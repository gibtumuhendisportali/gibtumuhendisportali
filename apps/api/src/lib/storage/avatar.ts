export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export interface DetectedImageType {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (bytes.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: "image/png", ext: "png" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: "image/webp", ext: "webp" };
  }

  return null;
}

export function buildAvatarKey(userId: string, ext: "jpg" | "png" | "webp"): string {
  return `avatars/${userId}/${crypto.randomUUID()}.${ext}`;
}

const SAFE_AVATAR_KEY_REGEX = /^avatars\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/;

export function isSafeAvatarKey(key: string): boolean {
  return SAFE_AVATAR_KEY_REGEX.test(key);
}
