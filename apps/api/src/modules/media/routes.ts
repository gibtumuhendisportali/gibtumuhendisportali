import { Hono } from "hono";
import type { ApiErrorResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import { isSafeAvatarKey } from "../../lib/storage/avatar";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requireVerifiedMember,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createMediaRoutes(options: AuthMiddlewareOptions = {}) {
  const media = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  media.use("*", requireAuth, requireIdentityRecord, requireVerifiedMember);

  media.get("/avatars/:userId/:filename", async (c) => {
    const userId = c.req.param("userId");
    const filename = c.req.param("filename");
    const key = `avatars/${userId}/${filename}`;

    if (!isSafeAvatarKey(key)) {
      const payload: ApiErrorResponse = {
        error: {
          code: "INVALID_MEDIA_KEY",
          message: "Geçersiz medya anahtarı.",
        },
      };
      return c.json(payload, 400);
    }

    const object = await c.env.MEDIA_BUCKET.get(key);
    if (!object) {
      const payload: ApiErrorResponse = {
        error: {
          code: "NOT_FOUND",
          message: "Görsel bulunamadı.",
        },
      };
      return c.json(payload, 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(object.body, {
      status: 200,
      headers,
    });
  });

  return media;
}
