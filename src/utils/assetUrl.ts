// Normaliza URLs de archivos (pdf/xml/img) devueltos por la API.
// - Si viene absoluta (http/https) la deja igual.
// - Si viene relativa, asegura que empiece con "/" para que funcione con los rewrites de Next (ver next.config.ts).
export function assetUrl(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = String(input).trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return trimmed;

  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;

  return `/${trimmed}`;
}

export default assetUrl;

