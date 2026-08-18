// supabase/functions/request-login-link/index.ts
//
// Chamada pelo cliente (não pela Kiwify) quando ele quer entrar em outro
// aparelho, ou quando o Magic Link anterior já expirou/foi usado. Não cria
// acesso novo nem cobra nada — só reenvia um novo Magic Link se o e-mail
// já tiver acesso ativo (access_status = 'active' e não expirado).
//
// Resposta é sempre genérica (não revela se o e-mail existe ou não), pra
// não vazar quem é ou não cliente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const GENERIC_MESSAGE =
  "Se esse e-mail tiver acesso ativo, enviamos um novo link para entrar. Confira sua caixa de entrada.";

function siteUrl() {
  return (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
}

async function sendMagicLinkEmail(email: string, name: string | undefined, link: string) {
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
      subject: "Seu novo link de acesso — Falso Magro 30 Dias",
      html: `
      <div style="background:#0d0d0d;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #262626;">
          <div style="padding:28px 28px 0 28px;text-align:center;">
            <p style="margin:0;color:#8a8a8a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Lapidados Clube</p>
            <h1 style="margin:8px 0 0 0;color:#fff;font-size:22px;">Falso Magro 30 Dias</h1>
          </div>
          <div style="padding:20px 28px 8px 28px;">
            <p style="color:#e5e5e5;font-size:16px;line-height:1.5;">Olá${name ? `, ${name}` : ""}!</p>
            <p style="color:#b3b3b3;font-size:15px;line-height:1.6;">Aqui está seu novo link de acesso.</p>
          </div>
          <div style="padding:12px 28px 28px 28px;text-align:center;">
            <a href="${link}" style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0d0d0d;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">Entrar no app</a>
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

  // Confere se existe profile com acesso ativo pra esse e-mail (fluxo Kiwify).
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, access_status, access_expires_at")
    .eq("email", email)
    .maybeSingle();

  const hasActiveAccess =
    profile &&
    profile.access_status === "active" &&
    (!profile.access_expires_at || new Date(profile.access_expires_at).getTime() > Date.now());

  // Resposta sempre igual, exista ou não o e-mail — evita enumerar clientes.
  if (!hasActiveAccess) {
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl()}/magic-callback.html` },
  });

  if (linkError || !linkData) {
    console.error("generateLink falhou", linkError);
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  const hashedToken = linkData.properties?.hashed_token;
  const loginLink = `${siteUrl()}/magic-callback.html?token=${encodeURIComponent(hashedToken ?? "")}`;

  await sendMagicLinkEmail(email, profile.name ?? undefined, loginLink);

  return jsonResponse({ message: GENERIC_MESSAGE });
});
