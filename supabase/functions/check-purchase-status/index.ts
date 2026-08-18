// supabase/functions/check-purchase-status/index.ts
//
// Chamada pela página /ativar. Dado um e-mail, diz em que estado está a
// compra correspondente na Kiwify — inclusive o estado "ainda não chegou"
// (o webhook pode não ter processado ainda), que é o caso que resolve a
// race condition: /ativar pode abrir antes do webhook rodar, então o
// frontend consulta esta função de novo por alguns segundos até sair
// do estado "not_found".
//
// Não expõe nenhum dado sensível: nunca diz "esse e-mail não existe no
// nosso sistema" de forma diferente de "ainda não chegou" — os dois
// retornam not_found, pra não virar ferramenta de descobrir quem comprou.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, getClientIp } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

// Limite generoso pensado pra polling: a página /ativar pode chamar esta
// função a cada ~3s por até ~30s enquanto espera o webhook (≈10 chamadas
// legítimas), então o teto fica bem acima disso.
const MAX_ATTEMPTS = 30;
const WINDOW_MINUTES = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip = getClientIp(req);
    const { blocked } = await checkRateLimit(supabaseAdmin, ip, "check-purchase", {
      maxAttempts: MAX_ATTEMPTS,
      windowMinutes: WINDOW_MINUTES,
    });
    if (blocked) {
      return jsonResponse(
        { status: "rate_limited", error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return jsonResponse({ status: "invalid_email", error: "E-mail inválido." }, 400);
    }

    // Pega a compra mais recente pra esse e-mail (caso tenha mais de uma
    // ao longo do tempo — ex: recompra depois de expirar).
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .select("status, access_expires_at, user_id")
      .eq("email", email)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchaseError) {
      console.error("check-purchase-status query failed", purchaseError);
      return jsonResponse({ status: "error" }, 500);
    }

    if (!purchase) {
      // Não existe nenhuma compra registrada ainda pra esse e-mail. Pode
      // ser: (a) webhook ainda não processou (race condition — front deve
      // continuar tentando por alguns segundos), ou (b) e-mail nunca
      // comprou. Não dá pra diferenciar isso com segurança, e não
      // precisa: os dois casos, a resposta certa pro usuário é a mesma
      // ("ainda não encontramos sua compra").
      return jsonResponse({ status: "not_found" });
    }

    if (purchase.status === "blocked") {
      return jsonResponse({ status: "blocked" });
    }

    const isExpired =
      purchase.status === "expired" ||
      (purchase.access_expires_at && new Date(purchase.access_expires_at).getTime() < Date.now());

    if (isExpired) {
      return jsonResponse({ status: "expired" });
    }

    if (purchase.status !== "active") {
      // pending ou qualquer outro estado intermediário futuro.
      return jsonResponse({ status: "not_found" });
    }

    // Compra ativa. Verifica se essa pessoa já ativou a conta antes
    // (já tem senha definida) — nesse caso /ativar deve mandar pro login
    // em vez de deixar criar senha de novo.
    let alreadyActivated = false;
    if (purchase.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("password_set_at")
        .eq("id", purchase.user_id)
        .maybeSingle();
      alreadyActivated = !!profile?.password_set_at;
    }

    return jsonResponse({
      status: "active",
      alreadyActivated,
    });
  } catch (err) {
    console.error("check-purchase-status unexpected error", err);
    return jsonResponse({ status: "error" }, 500);
  }
});
