// supabase/functions/generate-access-code/index.ts
//
// Gera um novo código individual de acesso. Só pode ser chamada por um
// usuário autenticado com app_metadata.role === "admin" (verificado
// server-side). O código em texto puro só é retornado nesta resposta —
// depois disso, o banco guarda apenas o hash.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { generateRandomCode, hashCode, normalizeCode } from "../_shared/code.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";

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
    const notes: string | null = typeof body?.notes === "string" ? body.notes.slice(0, 200) : null;
    const expiresAt: string | null = typeof body?.expiresAt === "string" ? body.expiresAt : null;

    // Garante unicidade tentando algumas vezes em caso de colisão (extremamente raro).
    for (let attempt = 0; attempt < 5; attempt++) {
      const plainCode = generateRandomCode();
      const normalized = normalizeCode(plainCode);
      const codeHash = await hashCode(normalized);
      const [prefix, , suffix] = normalized.split("-");

      const { error: insertError } = await supabaseAdmin.from("access_codes").insert({
        code_hash: codeHash,
        code_display_prefix: prefix,
        code_display_suffix: suffix,
        status: "active",
        notes,
        expires_at: expiresAt,
      });

      if (!insertError) {
        return jsonResponse({ code: plainCode });
      }

      // 23505 = unique_violation → tenta gerar outro código
      if (insertError.code !== "23505") {
        console.error("generate-access-code insert failed", insertError);
        return jsonResponse({ error: "Não foi possível gerar o código agora." }, 500);
      }
    }

    return jsonResponse({ error: "Não foi possível gerar um código único. Tente novamente." }, 500);
  } catch (err) {
    console.error("generate-access-code unexpected error", err);
    return jsonResponse({ error: "Erro inesperado ao gerar código." }, 500);
  }
});
