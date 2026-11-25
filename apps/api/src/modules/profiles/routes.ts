import { Hono } from "hono";
import { profileUpdateSchema, type ApiErrorResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import { updateAvatarKey, updateMemberProfile } from "../../lib/db/directory";
import { findMeBySupabaseId } from "../../lib/db/identity";
import {
  AVATAR_MAX_BYTES,
  buildAvatarKey,
  detectImageType,
  isSafeAvatarKey,
} from "../../lib/storage/avatar";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requireVerifiedMember,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createProfileRoutes(options: AuthMiddlewareOptions = {}) {
  const profile = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  profile.use("*", requireAuth, requireIdentityRecord, requireVerifiedMember);

  profile.put("/", async (c) => {
    const member = c.get("currentMember");

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      const payload: ApiErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Geçersiz JSON gövdesi.",
        },
      };
      return c.json(payload, 400);
    }

    const parsed = profileUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Profil bilgileri geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    await updateMemberProfile(c.env.DB, member.id, parsed.data);
    const updated = await findMeBySupabaseId(c.env.DB, member.supabaseUserId);
    return c.json(updated, 200);
  });

  profile.post("/avatar", async (c) => {
    const member = c.get("currentMember");
    const existingProfile = c.get("currentProfile");

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      const payload: ApiErrorResponse = {
        error: {
          code: "INVALID_FORM_DATA",
          message: "Geçersiz dosya yükleme isteği.",
        },
      };
      return c.json(payload, 400);
    }

    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      const payload: ApiErrorResponse = {
        error: {
          code: "FILE_REQUIRED",
          message: "Lütfen bir görsel dosyası seçin.",
        },
      };
      return c.json(payload, 400);
    }

    if (fileEntry.size === 0 || fileEntry.size > AVATAR_MAX_BYTES) {
      const payload: ApiErrorResponse = {
        error: {
          code: "FILE_TOO_LARGE",
          message: "Profil fotoğrafı en fazla 2 MB olabilir.",
        },
      };
      return c.json(payload, 400);
    }

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    const detected = detectImageType(bytes);
    if (!detected) {
      const payload: ApiErrorResponse = {
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: "Yalnızca geçerli JPEG, PNG veya WebP görselleri kabul edilir.",
        },
      };
      return c.json(payload, 400);
    }

    const newKey = buildAvatarKey(member.id, detected.ext);
    await c.env.MEDIA_BUCKET.put(newKey, bytes, {
      httpMetadata: {
        contentType: detected.mimeType,
      },
    });

    await updateAvatarKey(c.env.DB, member.id, newKey);

    if (existingProfile?.avatarKey && isSafeAvatarKey(existingProfile.avatarKey)) {
      try {
        await c.env.MEDIA_BUCKET.delete(existingProfile.avatarKey);
      } catch {
        // Non-fatal cleanup failure
      }
    }

    return c.json({ avatarKey: newKey }, 200);
  });

  profile.delete("/avatar", async (c) => {
    const member = c.get("currentMember");
    const existingProfile = c.get("currentProfile");

    await updateAvatarKey(c.env.DB, member.id, null);

    if (existingProfile?.avatarKey && isSafeAvatarKey(existingProfile.avatarKey)) {
      try {
        await c.env.MEDIA_BUCKET.delete(existingProfile.avatarKey);
      } catch {
        // Non-fatal cleanup failure
      }
    }

    return c.json({ avatarKey: null }, 200);
  });

  return profile;
}
