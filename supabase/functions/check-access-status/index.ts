// supabase/functions/check-access-status/index.ts
//
// Chamada pelo frontend (usuário já logado) para confirmar que seu acesso
// continua ativo. Se o admin bloqueou o código (fluxo por código) OU se o
// acesso Kiwify foi bloqueado por reembolso/chargeback ou expirou (fluxo
// Kiwify), esta função é o que permite ao app detectar isso e encerrar a
// sessão automaticamente — sem depender do usuário clicar em "Sair da conta".
//
// [REVISADO] Suporte a dois modelos de acesso, sem alterar o comportamento
// já existente pra quem entra por código:
//   1. Por código de acesso (como já era): profiles.access_code_id aponta
//      pra uma linha em access_codes, que tem seu próprio status/validade.
//   2. Por Kiwify (novo): profiles.access_code_id fica null; o status e a
//      validade ficam direto em profiles.access_status/access_expires_at
//      (preenchidos pelo kiwify-webhook na compra e no reembolso/chargeback).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ status: "unknown" }, 401);

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse({ status: "unknown" }, 401);
    }

    // Administradores não têm access_code — sempre considerados válidos.
    if (userData.user.app_metadata?.role === "admin") {
      return jsonResponse({ status: "active" });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("access_code_id, access_status, access_expires_at")
      .eq("id", userData.user.id)
      .maybeSingle();

    // Sem perfil algum — mantém como já era.
    if (!profile) {
      return jsonResponse({ status: "unknown" });
    }

    // ---------- Fluxo por código de acesso (comportamento original) ----------
    if (profile.access_code_id) {
      const { data: accessCode } = await supabaseAdmin
        .from("access_codes")
        .select("status, expires_at")
        .eq("id", profile.access_code_id)
        .maybeSingle();

      if (!accessCode) {
        return jsonResponse({ status: "unknown" });
      }

      if (accessCode.expires_at && new Date(accessCode.expires_at).getTime() < Date.now()) {
        return jsonResponse({ status: "expired" });
      }

      return jsonResponse({ status: accessCode.status });
    }

    // ---------- Fluxo Kiwify (novo) ----------
    if (profile.access_status === "blocked") {
      return jsonResponse({ status: "blocked" });
    }

    if (profile.access_expires_at && new Date(profile.access_expires_at).getTime() < Date.now()) {
      return jsonResponse({ status: "expired" });
    }

    if (profile.access_status) {
      return jsonResponse({ status: profile.access_status });
    }

    // Nem access_code_id nem access_status preenchidos — perfil de outra
    // origem (ex: admin criado manualmente sem nenhum dos dois fluxos).
    return jsonResponse({ status: "unknown" });
  } catch (err) {
    console.error("check-access-status unexpected error", err);
    // Em caso de erro inesperado, não bloqueia o usuário (evita falso positivo).
    return jsonResponse({ status: "unknown" }, 500);
  }
});
