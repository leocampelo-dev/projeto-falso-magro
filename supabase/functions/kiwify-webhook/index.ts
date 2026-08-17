// supabase/functions/kiwify-webhook/index.ts
//
// Recebe o webhook da Kiwify, cria/localiza o usuário no Supabase Auth pelo
// e-mail real do comprador, libera 60 dias de acesso e envia um Magic Link
// por e-mail (via Resend) para o cliente entrar no app sem senha.
//
// Segurança: em vez de tentar adivinhar o esquema de assinatura interno da
// Kiwify, a validação usa um segredo próprio (WEBHOOK_SECRET) que você
// mesmo escolhe e coloca na URL cadastrada no painel da Kiwify:
//   https://SEU-PROJETO.functions.supabase.co/kiwify-webhook?secret=SEU_SEGREDO
// Só requisições com o secret correto são processadas.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const ACCESS_DAYS = 60;

// Eventos que liberam acesso (produto aprovado / assinatura renovada)
const APPROVED_EVENTS = ["compra_aprovada", "order_approved", "paid"];
// Eventos que bloqueiam acesso sem apagar dados
const BLOCKED_EVENTS = ["compra_reembolsada", "chargeback", "refunded", "chargedback", "subscription_canceled"];

function siteUrl() {
  return (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");
}

function extractOrderData(body: any) {
  // A Kiwify pode variar o formato entre payload de webhook e API; cobrimos
  // os nomes de campo documentados (customer.email, customer.name, id/order_id,
  // order_status) com fallback para variações comuns.
  const email: string | undefined =
    body?.customer?.email ?? body?.Customer?.email ?? body?.email;
  const name: string | undefined =
    body?.customer?.full_name ?? body?.customer?.name ?? body?.Customer?.full_name ?? body?.customer_name;
  const orderId: string | undefined =
    body?.order_id ?? body?.id ?? body?.order?.id;
  const orderStatus: string | undefined =
    body?.order_status ?? body?.status ?? body?.event ?? body?.webhook_event_type;

  return { email, name, orderId, orderStatus };
}

async function sendMagicLinkEmail(email: string, name: string | undefined, link: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM"); // ex: "Falso Magro <acesso@seudominio.com>"
  if (!apiKey || !from) {
    console.error("RESEND_API_KEY ou EMAIL_FROM não configurados — e-mail não enviado.");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Seu acesso está liberado 🔓",
      html: `
        <p>Olá${name ? `, ${name}` : ""}!</p>
        <p>Sua compra foi confirmada e seu acesso já está liberado por 60 dias.</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Entrar no app</a></p>
        <p>Se o botão não funcionar, copie e cole este link no navegador:<br>${link}</p>
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

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== Deno.env.get("WEBHOOK_SECRET")) {
    return jsonResponse({ error: "unauthorized" }, 401);
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

  const { email, name, orderId, orderStatus } = extractOrderData(body);

  if (!email || !orderId) {
    console.error("Payload sem email ou orderId", JSON.stringify(body));
    return jsonResponse({ error: "missing email or order id" }, 400);
  }

  const eventKey = orderStatus ?? "unknown";

  // Idempotência: se este (order_id, event) já foi processado, não repete.
  const { data: already } = await supabaseAdmin
    .from("kiwify_events")
    .select("id")
    .eq("order_id", orderId)
    .eq("event", eventKey)
    .maybeSingle();

  if (already) {
    return jsonResponse({ ok: true, deduped: true });
  }

  const isApproval = APPROVED_EVENTS.includes(eventKey);
  const isBlock = BLOCKED_EVENTS.includes(eventKey);

  if (!isApproval && !isBlock) {
    // Evento que não precisa de ação (ex: boleto_gerado, pix_gerado, carrinho_abandonado).
    await supabaseAdmin.from("kiwify_events").insert({
      order_id: orderId, event: eventKey, order_status: orderStatus, email, payload: body,
    });
    return jsonResponse({ ok: true, ignored: true });
  }

  let userId: string | null = null;

  if (isApproval) {
    // generateLink com type "magiclink" cria o usuário automaticamente se
    // ele ainda não existir — mesmo mecanismo já usado em redeem-access-code.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${siteUrl()}/magic-callback.html` },
    });

    if (linkError || !linkData?.user) {
      console.error("generateLink falhou", linkError);
      return jsonResponse({ error: "auth error" }, 500);
    }

    userId = linkData.user.id;
    const hashedToken = linkData.properties?.hashed_token;
    // Só token_hash é necessário — bate com o formato que magic-callback.html
    // usa (o mesmo já usado pelo login por código no supabase-client.js).
    const loginLink = `${siteUrl()}/magic-callback.html?token=${encodeURIComponent(hashedToken ?? "")}`;

    const expiresAt = new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      name: name ?? undefined,
      role: "client",
      access_status: "active",
      access_expires_at: expiresAt,
      access_source: "kiwify",
      kiwify_customer_id: String(orderId),
    });

    await sendMagicLinkEmail(email, name, loginLink);
  }

  if (isBlock) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
      await supabaseAdmin
        .from("profiles")
        .update({ access_status: "blocked" })
        .eq("id", profile.id);
    } else {
      console.error("Reembolso/chargeback para e-mail sem profile encontrado:", email);
    }
  }

  await supabaseAdmin.from("kiwify_events").insert({
    order_id: orderId, event: eventKey, order_status: orderStatus, email, user_id: userId, payload: body,
  });

  return jsonResponse({ ok: true });
});
