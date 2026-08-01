import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Extrai o JWT do header Authorization e confirma que pertence a um
 * usuário com app_metadata.role === "admin". Retorna o user ou null.
 * A checagem é sempre feita server-side com a service_role — nunca
 * confiar em uma flag vinda do frontend.
 */
export async function requireAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  if (data.user.app_metadata?.role !== "admin") return null;

  return { id: data.user.id, email: data.user.email };
}
