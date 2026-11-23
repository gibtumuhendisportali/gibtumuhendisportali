import { Hono } from "hono";
import type { AuthMeResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import {
  createRequireAuthMiddleware,
  type AuthMiddlewareOptions,
  type AuthVariables,
} from "../../middleware/auth";

export function createAuthRoutes(options: AuthMiddlewareOptions = {}) {
  const auth = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  auth.get("/me", requireAuth, (c) => {
    const identity = c.get("authIdentity");
    const payload: AuthMeResponse = {
      user: {
        supabaseUserId: identity.supabaseUserId,
        email: identity.email,
        emailVerified: identity.emailVerified,
        sessionIssuedAt: identity.sessionIssuedAt,
      },
    };
    return c.json(payload, 200);
  });

  return auth;
}
