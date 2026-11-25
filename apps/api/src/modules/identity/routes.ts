import { Hono } from "hono";
import { onboardingInputSchema, type ApiErrorResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import { createOnboardingApplication, findMeBySupabaseId } from "../../lib/db/identity";
import {
  createRequireAuthMiddleware,
  type AuthMiddlewareOptions,
  type AuthVariables,
} from "../../middleware/auth";

export function createIdentityRoutes(options: AuthMiddlewareOptions = {}) {
  const identity = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  identity.get("/me", requireAuth, async (c) => {
    const authIdentity = c.get("authIdentity");
    const me = await findMeBySupabaseId(c.env.DB, authIdentity.supabaseUserId);
    return c.json(me, 200);
  });

  identity.post("/onboarding", requireAuth, async (c) => {
    const authIdentity = c.get("authIdentity");
    if (!authIdentity.email) {
      const payload: ApiErrorResponse = {
        error: {
          code: "EMAIL_REQUIRED",
          message: "Kimlik belirtecinde e-posta bilgisi bulunamadı.",
        },
      };
      return c.json(payload, 400);
    }

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

    const parsed = onboardingInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Başvuru bilgileri geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    const existing = await findMeBySupabaseId(c.env.DB, authIdentity.supabaseUserId);
    if (existing.onboarded) {
      const payload: ApiErrorResponse = {
        error: {
          code: "ALREADY_ONBOARDED",
          message: "Üyelik başvurunuz zaten oluşturulmuş.",
        },
      };
      return c.json(payload, 409);
    }

    const created = await createOnboardingApplication(c.env.DB, {
      supabaseUserId: authIdentity.supabaseUserId,
      email: authIdentity.email,
      input: parsed.data,
    });

    return c.json(created, 201);
  });

  return identity;
}
