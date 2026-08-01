// supabase/functions/admin-login/index.ts
//
// Valida o código de administrador (guardado apenas como secret no
// Supabase, nunca no frontend) e devolve um token de sessão com
// app_metadata.role = "admin".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, getClientIp } from "../_shared/cors.ts";
import { normalizeCode } from "../_shared/code.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const GENERIC_ERROR = "Código inválido ou acesso indisponível.";
const ADMIN_EMAIL = "admin@access.falsomagro.internal";

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
    const { blocked } = await checkRateLimit(supabaseAdmin, ip, "admin");
    if (blocked) {
      return jsonResponse(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429,
      );
    }

    const adminSecret = Deno.env.get("FM_ADMIN_ACCESS_CODE");
    if (!adminSecret || adminSecret === "CHANGE_ME_ADMIN_CODE") {
      // Secret ainda não configurado pelo administrador — nunca aceitar por padrão.
      return jsonResponse({ error: "Acesso administrativo não configurado." }, 503);
    }

    const { code } = await req.json().catch(() => ({ code: null }));
    if (!code || typeof code !== "string") {
      return jsonResponse({ error: GENERIC_ERROR }, 400);
    }

    if (normalizeCode(code) !== normalizeCode(adminSecret)) {
      return jsonResponse({ error: GENERIC_ERROR }, 401);
    }

    // Busca (ou cria, na primeira vez) o usuário admin técnico.
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let adminUser = existingUsers?.users.find((u) => u.email === ADMIN_EMAIL);

    if (!adminUser) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });

      if (createError || !created?.user) {
        console.error("admin createUser failed", createError);
        return jsonResponse({ error: "Não foi possível autenticar como admin agora." }, 500);
      }
      adminUser = created.user;

      await supabaseAdmin.from("profiles").upsert({
        id: adminUser.id,
        name: "Administrador",
        role: "admin",
      });
    } else if (adminUser.app_metadata?.role !== "admin") {
      // Garante que o papel admin sempre esteja correto, mesmo se o usuário já existisse.
      await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        app_metadata: { ...adminUser.app_metadata, role: "admin" },
      });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ADMIN_EMAIL,
    });

    if (linkError || !linkData) {
      console.error("admin generateLink failed", linkError);
      return jsonResponse({ error: "Não foi possível autenticar como admin agora." }, 500);
    }

    return jsonResponse({
      email: ADMIN_EMAIL,
      hashedToken: linkData.properties?.hashed_token,
    });
  } catch (err) {
    console.error("admin-login unexpected error", err);
    return jsonResponse({ error: GENERIC_ERROR }, 500);
  }
});
