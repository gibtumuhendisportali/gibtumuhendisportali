const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

export function sanitizeRedirectPath(
  rawPath: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!rawPath) {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (
    !trimmed ||
    CONTROL_CHAR_REGEX.test(trimmed) ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost" || parsed.pathname.startsWith("//")) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
