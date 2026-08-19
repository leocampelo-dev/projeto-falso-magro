// supabase/functions/kiwify-webhook/index.ts
//
// Recebe o webhook da Kiwify, registra a compra em `purchases` e mantém
// `profiles.access_status` sincronizado. NÃO cria senha, NÃO envia magic
// link e NÃO manda e-mail de login — esta função só registra o estado da
// compra. Quem cuida da ativação (criação de senha) é a página /ativar,
// via check-purchase-status + activate-account.
//
// Segurança: valida um segredo próprio (WEBHOOK_SECRET) que você escolhe
// e coloca na URL cadastrada no painel da Kiwify:
//   https://SEU-PROJETO.functions.supabase.co/kiwify-webhook?secret=SEU_SEGREDO
// Só requisições com o secret correto são processadas.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const ACCESS_DAYS = 60;
const DEFAULT_PRODUCT_ID = "falso-magro-30d";

// Eventos que liberam acesso (produto aprovado / assinatura renovada)
const APPROVED_EVENTS = ["compra_aprovada", "order_approved", "paid"];
// Eventos que bloqueiam acesso sem apagar dados
const BLOCKED_EVENTS = ["compra_reembolsada", "chargeback", "refunded", "chargedback", "subscription_canceled"];

function extractOrderData(body: any) {
  // A Kiwify pode variar o formato entre payload de webhook e API; cobrimos
  // os nomes de campo documentados (customer.email, customer.name, id/order_id,
  // order_status) com fallback para variações comuns.
  const email: string | undefined =
    body?.customer?.email ?? body?.Customer?.email ?? body?.email;
  const name: string | undefined =
    body?.customer?.full_name ?? body?.customer?.name ?? body?.Customer?.full_name ?? body?.customer_name;
  // name é guardado no payload bruto (kiwify_events.payload) para consulta
  // futura, mas não é usado diretamente aqui — o nome de exibição é
  // preenchido pelo próprio usuário durante a ativação em /ativar.
  const orderId: string | undefined =
    body?.order_id ?? body?.id ?? body?.order?.id;
  const orderStatus: string | undefined =
    body?.order_status ?? body?.status ?? body?.event ?? body?.webhook_event_type;
  const productId: string | undefined =
    body?.product?.id ?? body?.Product?.id ?? body?.product_id;

  return { email, name, orderId, orderStatus, productId };
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

  const { email, orderId, orderStatus, productId } = extractOrderData(body);

  if (!email || !orderId) {
    console.error("Payload sem email ou orderId", JSON.stringify(body));
    return jsonResponse({ error: "missing email or order id" }, 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const eventKey = orderStatus ?? "unknown";

  // Idempotência de log bruto: se este (order_id, event) já foi processado,
  // não repete o processamento (mas ainda respondemos 200 pra Kiwify não
  // ficar reenviando).
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
      order_id: orderId, event: eventKey, order_status: orderStatus, email: normalizedEmail, payload: body,
    });
    return jsonResponse({ ok: true, ignored: true });
  }

  let userId: string | null = null;

  if (isApproval) {
    // Localiza usuário existente pelo e-mail (caso já tenha comprado antes
    // ou já tenha sido criado por outro fluxo). Não cria usuário no Auth
    // aqui — quem cria a conta é o fluxo de ativação (/ativar), no momento
    // em que a pessoa efetivamente define a senha. Antes disso, a compra
    // fica registrada com user_id nulo e é vinculada pelo e-mail.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    userId = existingProfile?.id ?? null;

    const expiresAt = new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Upsert em purchases: unique(kiwify_transaction_id) garante 1 linha
    // por compra mesmo com reenvios de webhook em outro evento.
    await supabaseAdmin.from("purchases").upsert(
      {
        user_id: userId,
        email: normalizedEmail,
        kiwify_transaction_id: String(orderId),
        product_id: productId ?? DEFAULT_PRODUCT_ID,
        status: "active",
        purchased_at: new Date().toISOString(),
        access_expires_at: expiresAt,
      },
      { onConflict: "kiwify_transaction_id" },
    );

    // Se já existe profile (conta já ativada antes, ex: renovação de
    // compra), atualiza o status. Se não existe ainda, não cria — fica
    // para /ativar criar no momento da definição de senha.
    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update({
          access_status: "active",
          access_expires_at: expiresAt,
          access_source: "kiwify",
        })
        .eq("id", userId);
    }
  }

  if (isBlock) {
    // Bloqueia a compra correspondente (se existir) e o profile vinculado.
    await supabaseAdmin
      .from("purchases")
      .update({ status: "blocked" })
      .eq("email", normalizedEmail)
      .eq("status", "active");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profile) {
      userId = profile.id;
      await supabaseAdmin
        .from("profiles")
        .update({ access_status: "blocked" })
        .eq("id", profile.id);
    } else {
      console.error("Reembolso/chargeback para e-mail sem profile encontrado:", normalizedEmail);
    }
  }

  await supabaseAdmin.from("kiwify_events").insert({
    order_id: orderId, event: eventKey, order_status: orderStatus, email: normalizedEmail, user_id: userId, payload: body,
  });

  return jsonResponse({ ok: true });
});
