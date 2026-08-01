// supabase/functions/redeem-access-code/index.ts
//
// Recebe um código individual do cliente, valida no banco (server-side,
// nunca no frontend), cria/recupera o usuário Supabase Auth correspondente
// e devolve um token que o frontend usa para estabelecer sessão via
// supabase.auth.verifyOtp(). Nenhum secret é exposto ao navegador.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, getClientIp } from "../_shared/cors.ts";
import { normalizeCode, hashCode } from "../_shared/code.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const GENERIC_ERROR = "Código inválido ou acesso indisponível. Verifique o código e tente novamente.";

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
    const { blocked } = await checkRateLimit(supabaseAdmin, ip, "redeem");
    if (blocked) {
      return jsonResponse(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
      );
    }

    const { code } = await req.json().catch(() => ({ code: null }));
    if (!code || typeof code !== "string") {
      return jsonResponse({ error: GENERIC_ERROR }, 400);
    }

    const normalized = normalizeCode(code);
    if (normalized.length < 6) {
      return jsonResponse({ error: GENERIC_ERROR }, 400);
    }

    const codeHash = await hashCode(normalized);

    const { data: accessCode, error: findError } = await supabaseAdmin
      .from("access_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (findError || !accessCode) {
      return jsonResponse({ error: GENERIC_ERROR }, 401);
    }

    // Verifica expiração "preguiçosa" (marca como expirado na primeira checagem)
    if (
      accessCode.status === "active" &&
      accessCode.expires_at &&
      new Date(accessCode.expires_at).getTime() < Date.now()
    ) {
      await supabaseAdmin
        .from("access_codes")
        .update({ status: "expired" })
        .eq("id", accessCode.id);
      return jsonResponse({ error: GENERIC_ERROR }, 401);
    }

    if (accessCode.status === "blocked" || accessCode.status === "expired") {
      return jsonResponse({ error: GENERIC_ERROR }, 401);
    }

    if (accessCode.status !== "active" && accessCode.status !== "used") {
      return jsonResponse({ error: GENERIC_ERROR }, 401);
    }

    let userId = accessCode.user_id as string | null;
    const syntheticEmail = `${accessCode.id}@access.falsomagro.internal`;

    if (!userId) {
      // Primeiro uso deste código: cria o usuário Supabase Auth correspondente.
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        app_metadata: { role: "client", access_code_id: accessCode.id },
      });

      if (createError || !created?.user) {
        console.error("createUser failed", createError);
        return jsonResponse({ error: "Não foi possível liberar o acesso agora. Tente novamente em instantes." }, 500);
      }

      userId = created.user.id;

      await supabaseAdmin
        .from("access_codes")
        .update({
          status: "used",
          user_id: userId,
          activated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq("id", accessCode.id);

      // Cria o profile inicial (nome ainda vazio — preenchido no onboarding do app)
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        access_code_id: accessCode.id,
        role: "client",
      });
    } else {
      await supabaseAdmin
        .from("access_codes")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", accessCode.id);
    }

    // Gera um token de login (magic link) que o frontend troca por uma sessão real
    // via supabase.auth.verifyOtp(). Isso evita qualquer necessidade de senha.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: syntheticEmail,
    });

    if (linkError || !linkData) {
      console.error("generateLink failed", linkError);
      return jsonResponse({ error: "Não foi possível liberar o acesso agora. Tente novamente em instantes." }, 500);
    }

    return jsonResponse({
      email: syntheticEmail,
      hashedToken: linkData.properties?.hashed_token,
    });
  } catch (err) {
    console.error("redeem-access-code unexpected error", err);
    return jsonResponse({ error: GENERIC_ERROR }, 500);
  }
});
