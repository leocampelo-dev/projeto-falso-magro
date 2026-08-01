import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 10;

/**
 * Verifica quantas tentativas esse IP fez nos últimos WINDOW_MINUTES.
 * Se exceder MAX_ATTEMPTS, retorna { blocked: true }.
 * Sempre registra a tentativa atual (mesmo quando bloqueado), para
 * que o bloqueio persista enquanto o abuso continuar.
 */
export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  ip: string,
  kind: "redeem" | "admin",
): Promise<{ blocked: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("access_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("kind", kind)
    .gte("attempted_at", windowStart);

  await supabaseAdmin.from("access_attempts").insert({ ip, kind });

  if (error) {
    // Em caso de falha ao consultar rate limit, não bloqueia o usuário legítimo.
    console.error("rate limit check failed", error);
    return { blocked: false };
  }

  return { blocked: (count ?? 0) >= MAX_ATTEMPTS };
}
