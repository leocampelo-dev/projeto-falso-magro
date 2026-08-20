// supabase/functions/admin-grant-access/index.ts
//
// Substitui o antigo fluxo de "código de acesso" (redeem-access-code) para
// liberação manual de acesso. Em vez de gerar um código pro cliente digitar
// (que criava conta com e-mail sintético + magic link de uso único — o
// mesmo problema de multi-dispositivo que o resto do projeto corrigiu),
// o admin simplesmente registra uma "compra manual" com o e-mail real do
// cliente. O cliente usa o MESMO /ativar de sempre — sem código nenhum
// pra digitar, sem link especial, sem fluxo paralelo.
//
// Só pode ser chamada por um usuário autenticado com
// app_metadata.role === "admin" (verificado server-side).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";

const ACCESS_DAYS = 60;
const DEFAULT_PRODUCT_ID = "falso-magro-30d";

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
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const notes: string | null = typeof body?.notes === "string" ? body.notes.slice(0, 200) : null;

    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "E-mail inválido." }, 400);
    }

    const expiresAt = new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
    // Identificador único próprio pra distinguir de compras reais da Kiwify
    // nos relatórios/auditoria, mantendo o mesmo formato de tabela.
    const manualTransactionId = `manual-${crypto.randomUUID()}`;

    const { error: insertError } = await supabaseAdmin.from("purchases").insert({
      email,
      kiwify_transaction_id: manualTransactionId,
      product_id: DEFAULT_PRODUCT_ID,
      status: "active",
      purchased_at: new Date().toISOString(),
      access_expires_at: expiresAt,
    });

    if (insertError) {
      console.error("admin-grant-access insert failed", insertError);
      return jsonResponse({ error: "Não foi possível liberar o acesso agora." }, 500);
    }

    // Auditoria: registra quem liberou e por quê, no mesmo log de eventos
    // usado pelo webhook da Kiwify — assim fica tudo num histórico só.
    await supabaseAdmin.from("kiwify_events").insert({
      order_id: manualTransactionId,
      event: "manual_grant",
      order_status: "manual_grant",
      email,
      payload: { granted_by_admin_id: admin.id, granted_by_admin_email: admin.email, notes },
    });

    return jsonResponse({ ok: true, email, expiresAt });
  } catch (err) {
    console.error("admin-grant-access unexpected error", err);
    return jsonResponse({ error: "Erro inesperado ao liberar acesso." }, 500);
  }
});
