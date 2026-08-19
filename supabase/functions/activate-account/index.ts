// supabase/functions/activate-account/index.ts
//
// Chamada pela página /ativar depois que check-purchase-status confirmou
// status "active" para o e-mail. Cria a conta no Supabase Auth (se ainda
// não existir) com a senha escolhida pelo usuário, ou define a senha em
// uma conta já existente (caso de recompra ou transição do fluxo antigo).
//
// Esta é a única função que efetivamente cria usuários no Auth. O
// kiwify-webhook nunca cria usuário — só registra a compra. Isso garante
// que toda conta criada corresponde a alguém que passou pela validação
// de compra ativa, fechando a brecha de "criar conta sem ter comprado".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, getClientIp } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_ATTEMPTS = 6;
const WINDOW_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 8;

const GENERIC_PURCHASE_ERROR =
  "Não encontramos uma compra aprovada para este e-mail. Confira o e-mail usado na compra e tente novamente.";

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
    const { blocked } = await checkRateLimit(supabaseAdmin, ip, "activate", {
      maxAttempts: MAX_ATTEMPTS,
      windowMinutes: WINDOW_MINUTES,
    });
    if (blocked) {
      return jsonResponse(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "E-mail inválido." }, 400);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse(
        { error: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` },
        400,
      );
    }

    // Revalida a compra no servidor — nunca confia em "o front já checou
    // antes". Esta é a barreira real contra criar conta sem ter comprado.
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .select("id, status, access_expires_at, user_id")
      .eq("email", email)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchaseError) {
      console.error("activate-account: erro ao consultar purchases", purchaseError);
      return jsonResponse({ error: "Erro interno. Tente novamente em instantes." }, 500);
    }

    if (!purchase || purchase.status !== "active") {
      return jsonResponse({ error: GENERIC_PURCHASE_ERROR }, 403);
    }

    if (purchase.access_expires_at && new Date(purchase.access_expires_at).getTime() < Date.now()) {
      return jsonResponse(
        { error: "Sua compra expirou. Entre em contato com o suporte para renovar o acesso." },
        403,
      );
    }

    // Caso 1: já existe profile vinculado a essa compra (user_id preenchido).
    let userId = purchase.user_id as string | null;

    // Caso 2: purchase ainda não tem user_id, mas já existe um profile com
    // esse e-mail (ex: compra antiga, ou profile criado por outro fluxo).
    if (!userId) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, password_set_at")
        .eq("email", email)
        .maybeSingle();
      if (existingProfile) userId = existingProfile.id;
    }

    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("password_set_at")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.password_set_at) {
        // Já ativou antes — não deixa "recriar" senha por aqui.
        // O caminho certo pra esse caso é /esqueci-senha (Parte 5).
        return jsonResponse(
          { error: "Esta conta já foi ativada. Use a tela de login ou 'Esqueci minha senha'." },
          409,
        );
      }

      // Conta já existe no Auth (ex: veio do fluxo antigo de magic link)
      // mas nunca teve senha própria — define a senha agora.
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updateAuthError) {
        console.error("activate-account: falha ao definir senha", updateAuthError);
        return jsonResponse({ error: "Erro ao definir senha. Tente novamente." }, 500);
      }
    } else {
      // Caso 3: primeira ativação de verdade — cria o usuário no Auth agora.
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        console.error("activate-account: falha ao criar usuário", createError);
        return jsonResponse({ error: "Erro ao criar conta. Tente novamente." }, 500);
      }
      userId = created.user.id;
    }

    // Sincroniza profile (cria se não existir) e vincula a purchase ao user_id.
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email,
        access_status: "active",
        access_expires_at: purchase.access_expires_at,
        access_source: "kiwify",
        password_set_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    await supabaseAdmin
      .from("purchases")
      .update({ user_id: userId })
      .eq("id", purchase.id);

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("activate-account unexpected error", err);
    return jsonResponse({ error: "Erro interno. Tente novamente." }, 500);
  }
});
