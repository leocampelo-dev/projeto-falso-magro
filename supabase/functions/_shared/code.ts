// Normalização e hash dos códigos de acesso.
// O código nunca é guardado em texto puro no banco — apenas o hash.

/** Remove espaços, deixa maiúsculo, remove caracteres não alfanuméricos exceto hífen */
export function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

/**
 * Hash SHA-256 do código normalizado, com "pepper" opcional (secret de ambiente)
 * para dificultar ataques de rainbow table caso o banco vaze.
 */
export async function hashCode(normalizedCode: string): Promise<string> {
  const pepper = Deno.env.get("CODE_HASH_PEPPER") || "";
  const data = new TextEncoder().encode(`${normalizedCode}::${pepper}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Gera um código aleatório seguro no formato FM30-XXXX-XXXX */
export function generateRandomCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem caracteres ambíguos (0,O,1,I,L)
  const randomGroup = (length: number) => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  };
  return `FM30-${randomGroup(4)}-${randomGroup(4)}`;
}
