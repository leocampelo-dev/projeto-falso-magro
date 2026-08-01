// supabase/functions/admin-clients/index.ts
//
// Ações administrativas sobre clientes. Só pode ser chamada por um
// usuário autenticado com app_metadata.role === "admin".
//
// Body esperado: { action: "list" | "block" | "reactivate" | "reset" | "delete", ... }

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
      const { data: codes, error } = await supabaseAdmin
        .from("access_codes")
        .select("id, code_display_prefix, code_display_suffix, status, user_id, created_at, last_used_at")
        .order("created_at", { ascending: false });

      if (error) return jsonResponse({ error: "Não foi possível listar clientes." }, 500);

      const userIds = (codes || []).map((c) => c.user_id).filter(Boolean) as string[];
      let profilesById: Record<string, { name: string | null }> = {};

      if (userIds.length) {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, name")
          .in("id", userIds);
        profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, { name: p.name }]));
      }

      const clients = (codes || []).map((c) => ({
        accessCodeId: c.id,
        maskedCode: `${c.code_display_prefix}-****-${c.code_display_suffix}`,
        name: c.user_id ? profilesById[c.user_id]?.name || "(sem nome ainda)" : "—",
        status: c.status,
        createdAt: c.created_at,
        lastUsedAt: c.last_used_at,
      }));

      return jsonResponse({ clients });
    }

    if (action === "block" || action === "reactivate") {
      const accessCodeId = body?.accessCodeId;
      if (!accessCodeId) return jsonResponse({ error: "accessCodeId é obrigatório." }, 400);

      const newStatus = action === "block" ? "blocked" : "used";
      const { error } = await supabaseAdmin
        .from("access_codes")
        .update({ status: newStatus })
        .eq("id", accessCodeId);

      if (error) return jsonResponse({ error: "Não foi possível atualizar o status." }, 500);
      return jsonResponse({ ok: true });
    }

    if (action === "reset") {
      const accessCodeId = body?.accessCodeId;
      const confirmed = body?.confirmed === true;

      if (!accessCodeId) return jsonResponse({ error: "accessCodeId é obrigatório." }, 400);
      if (!confirmed) {
        return jsonResponse({ error: "É necessário confirmar explicitamente o reset (confirmed: true)." }, 400);
      }

      const { data: accessCode } = await supabaseAdmin
        .from("access_codes")
        .select("user_id")
        .eq("id", accessCodeId)
        .maybeSingle();

      if (!accessCode?.user_id) {
        return jsonResponse({ error: "Cliente ainda não iniciou o uso do código." }, 400);
      }

      await supabaseAdmin.from("checkins").delete().eq("user_id", accessCode.user_id);
      await supabaseAdmin.from("goals").delete().eq("user_id", accessCode.user_id);
      await supabaseAdmin
        .from("profiles")
        .update({ start_date: new Date().toISOString().slice(0, 10), completion_shown: false })
        .eq("id", accessCode.user_id);

      return jsonResponse({ ok: true });
    }

    if (action === "delete") {
      const accessCodeId = body?.accessCodeId;
      const confirmed = body?.confirmed === true;

      if (!accessCodeId) return jsonResponse({ error: "accessCodeId é obrigatório." }, 400);
      if (!confirmed) {
        return jsonResponse({ error: "É necessário confirmar explicitamente a exclusão (confirmed: true)." }, 400);
      }

      const { data: accessCode } = await supabaseAdmin
        .from("access_codes")
        .select("user_id")
        .eq("id", accessCodeId)
        .maybeSingle();

      if (!accessCode) {
        return jsonResponse({ error: "Código não encontrado." }, 404);
      }

      // Apagar o usuário do Auth já apaga em cascata profile, goals e checkins
      // (todos referenciam auth.users(id) com "on delete cascade").
      if (accessCode.user_id) {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(accessCode.user_id);
        if (deleteUserError) {
          console.error("delete user failed", deleteUserError);
          return jsonResponse({ error: "Não foi possível excluir os dados do cliente." }, 500);
        }
      }

      const { error: deleteCodeError } = await supabaseAdmin
        .from("access_codes")
        .delete()
        .eq("id", accessCodeId);

      if (deleteCodeError) {
        console.error("delete access_code failed", deleteCodeError);
        return jsonResponse({ error: "Cliente removido, mas houve falha ao excluir o código." }, 500);
      }

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error("admin-clients unexpected error", err);
    return jsonResponse({ error: "Erro inesperado." }, 500);
  }
});
