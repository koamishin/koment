const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomFrom(alphabet: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let out = "";
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "event";
}

export function randomSlugSuffix(): string {
  return randomFrom(SLUG_ALPHABET, 6);
}

export function randomJoinCode(): string {
  return `${randomFrom(CODE_ALPHABET, 4)}-${randomFrom(CODE_ALPHABET, 4)}`;
}

export function randomCheckInCode(): string {
  return randomFrom(CODE_ALPHABET, 10);
}

export function normalizeJoinCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) {
    return value.toUpperCase();
  }
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export function normalizeCheckInCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
