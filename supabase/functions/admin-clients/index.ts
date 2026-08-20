// supabase/functions/admin-clients/index.ts
//
// Ações administrativas sobre clientes. Só pode ser chamada por um
// usuário autenticado com app_metadata.role === "admin".
//
// [REVISADO] A lista e as ações passam a ser baseadas em profiles/purchases
// (fonte de verdade real de acesso hoje — Kiwify ou liberação manual), em
// vez de access_codes (sistema antigo, hoje sem uso pra clientes novos).
// Todas as ações agora são chaveadas por userId (profiles.id), não mais
// por accessCodeId.
//
// Body esperado: { action: "list" | "block" | "reactivate" | "reset" | "delete", userId?, confirmed? }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const admin = await requireAdmin(req, supabaseAdmin);
    if (!admin) {
      return jsonResponse({ error: "Não autorizado." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data: profiles, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, name, role, access_status, access_source, access_expires_at, password_set_at, created_at")
        .neq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) return jsonResponse({ error: "Não foi possível listar clientes." }, 500);

      const emails = (profiles || []).map((p) => p.email).filter(Boolean) as string[];
      let purchaseByEmail: Record<string, { kiwify_transaction_id: string; purchased_at: string }> = {};

      if (emails.length) {
        const { data: purchases } = await supabaseAdmin
          .from("purchases")
          .select("email, kiwify_transaction_id, purchased_at")
          .in("email", emails)
          .order("purchased_at", { ascending: false });
        // Mantém só a compra mais recente por e-mail (primeira que aparecer, já que veio ordenado desc).
        for (const p of purchases || []) {
          if (!purchaseByEmail[p.email]) purchaseByEmail[p.email] = p;
        }
      }

      const now = Date.now();
      const clients = (profiles || []).map((p) => {
        const purchase = p.email ? purchaseByEmail[p.email] : undefined;
        const isExpired = p.access_expires_at && new Date(p.access_expires_at).getTime() < now;

        let status: string = p.access_status || "unknown";
        if (isExpired && status === "active") status = "expired";
        // Compra registrada mas conta nunca ativada (raro: liberação manual
        // ou compra Kiwify sem a pessoa nunca ter passado por /ativar).
        if (status === "active" && !p.password_set_at) status = "pending_activation";

        return {
          userId: p.id,
          email: p.email,
          name: p.name || "(sem nome ainda)",
          status,
          source: purchase?.kiwify_transaction_id?.startsWith("manual-") ? "manual" : (p.access_source || "—"),
          createdAt: p.created_at,
          purchasedAt: purchase?.purchased_at || null,
          activated: !!p.password_set_at,
        };
      });

      return jsonResponse({ clients });
    }

    if (action === "block" || action === "reactivate") {
      const userId = body?.userId;
      if (!userId) return jsonResponse({ error: "userId é obrigatório." }, 400);

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      if (!profile) return jsonResponse({ error: "Cliente não encontrado." }, 404);

      const newStatus = action === "block" ? "blocked" : "active";
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ access_status: newStatus })
        .eq("id", userId);
      if (error) return jsonResponse({ error: "Não foi possível atualizar o status." }, 500);

      // Mantém purchases em sincronia, mesma lógica do webhook de reembolso.
      if (profile.email) {
        const fromStatus = action === "block" ? "active" : "blocked";
        await supabaseAdmin
          .from("purchases")
          .update({ status: newStatus })
          .eq("email", profile.email)
          .eq("status", fromStatus);
      }

      return jsonResponse({ ok: true });
    }

    if (action === "reset") {
      const userId = body?.userId;
      const confirmed = body?.confirmed === true;

      if (!userId) return jsonResponse({ error: "userId é obrigatório." }, 400);
      if (!confirmed) {
        return jsonResponse({ error: "É necessário confirmar explicitamente o reset (confirmed: true)." }, 400);
      }

      await supabaseAdmin.from("checkins").delete().eq("user_id", userId);
      await supabaseAdmin.from("goals").delete().eq("user_id", userId);
      await supabaseAdmin
        .from("profiles")
        .update({ start_date: new Date().toISOString().slice(0, 10), completion_shown: false })
        .eq("id", userId);

      return jsonResponse({ ok: true });
    }

    if (action === "delete") {
      const userId = body?.userId;
      const confirmed = body?.confirmed === true;

      if (!userId) return jsonResponse({ error: "userId é obrigatório." }, 400);
      if (!confirmed) {
        return jsonResponse({ error: "É necessário confirmar explicitamente a exclusão (confirmed: true)." }, 400);
      }

      // Apagar o usuário do Auth já apaga em cascata profile, goals e checkins
      // (todos referenciam auth.users(id) com "on delete cascade"). O
      // histórico de compra em `purchases` é mantido de propósito (auditoria
      // financeira), mesmo depois da conta de acesso ser removida.
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        console.error("delete user failed", deleteUserError);
        return jsonResponse({ error: "Não foi possível excluir os dados do cliente." }, 500);
      }

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error("admin-clients unexpected error", err);
    return jsonResponse({ error: "Erro inesperado." }, 500);
  }
});
