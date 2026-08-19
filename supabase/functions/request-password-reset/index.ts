// supabase/functions/request-password-reset/index.ts
//
// Autoatendimento: usuário esqueceu a senha, pede um link pra criar uma
// nova. Mesmo padrão do request-login-link (que já existia pro magic
// link antigo), só que com type "recovery" em vez de "magiclink", e
// envio pelo Resend (não pelo template nativo do Supabase, que exige
// SMTP customizado pra ser editável e tem rate limit baixo por padrão).
//
// Resposta é sempre genérica — não revela se o e-mail existe ou tem
// conta ativa, pra não virar ferramenta de descobrir clientes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, getClientIp } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const GENERIC_MESSAGE =
  "Se esse e-mail tiver uma conta ativa, enviamos um link para redefinir a senha. Confira sua caixa de entrada.";

function siteUrl() {
  return (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
}

async function sendResetEmail(email: string, name: string | undefined, link: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) {
    console.error("RESEND_API_KEY ou EMAIL_FROM não configurados — e-mail não enviado.");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Redefinir sua senha — Falso Magro 30 Dias",
      html: `
      <div style="background:#0d0d0d;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #262626;">
          <div style="padding:28px 28px 0 28px;text-align:center;">
            <p style="margin:0;color:#8a8a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Lapidados Clube</p>
            <h1 style="margin:8px 0 0 0;color:#fff;font-size:22px;">Falso Magro 30 Dias</h1>
          </div>
          <div style="padding:20px 28px 8px 28px;">
            <p style="color:#e5e5e5;font-size:16px;line-height:1.5;">Olá${name ? `, ${name}` : ""}!</p>
            <p style="color:#b3b3b3;font-size:15px;line-height:1.6;">Recebemos um pedido para redefinir sua senha. Se não foi você, pode ignorar este e-mail.</p>
          </div>
          <div style="padding:12px 28px 28px 28px;text-align:center;">
            <a href="${link}" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0d0d0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Criar nova senha</a>
            <p style="color:#6b6b6b;font-size:12px;margin-top:16px;line-height:1.5;">
              Se o botão não funcionar, copie e cole este link no navegador:<br>
              <span style="color:#8a8a8a;word-break:break-all;">${link}</span>
            </p>
          </div>
          <div style="border-top:1px solid #262626;padding:16px 28px;text-align:center;">
            <p style="color:#5a5a5a;font-size:11px;margin:0;">Falso Magro 30 Dias · um produto Lapidados Clube</p>
          </div>
        </div>
      </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Falha ao enviar e-mail via Resend", await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);
  const { blocked } = await checkRateLimit(supabaseAdmin, ip, "reset-password", {
    maxAttempts: MAX_ATTEMPTS,
    windowMinutes: WINDOW_MINUTES,
  });
  if (blocked) {
    // Mesma mensagem genérica — não confirma nem nega nada, só some com
    // a diferença de comportamento (segue não revelando nada ao atacante).
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  const email = (body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "e-mail inválido" }, 400);
  }

  // Só envia se existir conta já ativada (password_set_at preenchido).
  // Se a compra existe mas a pessoa nunca criou senha, o caminho certo é
  // /ativar, não redefinição — não faz sentido "resetar" senha que nunca
  // existiu.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, password_set_at")
    .eq("email", email)
    .maybeSingle();

  if (!profile || !profile.password_set_at) {
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl()}/redefinir-senha.html` },
  });

  if (linkError || !linkData) {
    console.error("generateLink (recovery) falhou", linkError);
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  const hashedToken = linkData.properties?.hashed_token;
  const resetLink = `${siteUrl()}/redefinir-senha.html?token=${encodeURIComponent(hashedToken ?? "")}`;

  await sendResetEmail(email, profile.name ?? undefined, resetLink);

  return jsonResponse({ message: GENERIC_MESSAGE });
});
