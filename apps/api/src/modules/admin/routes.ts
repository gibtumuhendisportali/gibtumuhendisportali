import { Hono } from "hono";
import {
  VERIFICATION_STATUSES,
  communityPermissionGrantSchema,
  communityPermissionRevokeSchema,
  verificationDecisionSchema,
  type AdminVerificationsListResponse,
  type ApiErrorResponse,
  type VerificationStatus,
} from "@gibtu/shared";
import type { Env } from "../../env";
import {
  applyVerificationDecision,
  findUserById,
  grantCommunityPermission,
  listAdminCommunitiesAndMembers,
  listVerificationApplications,
  revokeCommunityPermission,
} from "../../lib/db/identity";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requirePlatformAdmin,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createAdminRoutes(options: AuthMiddlewareOptions = {}) {
  const admin = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  admin.use("*", requireAuth, requireIdentityRecord, requirePlatformAdmin);

  admin.get("/verifications", async (c) => {
    const rawStatus = c.req.query("status") ?? "pending";
    const isValidStatus = (VERIFICATION_STATUSES as readonly string[]).includes(rawStatus);
    if (!isValidStatus) {
      const payload: ApiErrorResponse = {
        error: {
          code: "INVALID_STATUS",
          message: "Geçersiz doğrulama durumu filtresi.",
        },
      };
      return c.json(payload, 400);
    }

    const items = await listVerificationApplications(
      c.env.DB,
      rawStatus as VerificationStatus,
    );
    const response: AdminVerificationsListResponse = { items };
    return c.json(response, 200);
  });

  admin.post("/verifications/:userId/decision", async (c) => {
    const targetUserId = c.req.param("userId");
    const actor = c.get("currentMember");

    if (targetUserId === actor.id) {
      const payload: ApiErrorResponse = {
        error: {
          code: "SELF_DECISION_FORBIDDEN",
          message: "Kendi hesabınız üzerinde onay veya ret işlemi yapamazsınız.",
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

    const parsed = verificationDecisionSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Karar verisi geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    const target = await findUserById(c.env.DB, targetUserId);
    if (!target) {
      const payload: ApiErrorResponse = {
        error: {
          code: "NOT_FOUND",
          message: "Kullanıcı kaydı bulunamadı.",
        },
      };
      return c.json(payload, 404);
    }

    await applyVerificationDecision(c.env.DB, {
      targetUserId,
      actorUserId: actor.id,
      decision: parsed.data.decision,
      ...(parsed.data.rejectionReason
        ? { rejectionReason: parsed.data.rejectionReason }
        : {}),
    });

    return c.json({ status: "ok", userId: targetUserId, decision: parsed.data.decision }, 200);
  });

  admin.get("/communities", async (c) => {
    const data = await listAdminCommunitiesAndMembers(c.env.DB);
    return c.json(data, 200);
  });

  admin.post("/communities/permissions", async (c) => {
    const actor = c.get("currentMember");

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      const payload: ApiErrorResponse = {
        error: { code: "INVALID_JSON", message: "Geçersiz JSON gövdesi." },
      };
      return c.json(payload, 400);
    }

    const parsed = communityPermissionGrantSchema.safeParse(rawBody);
    if (!parsed.success) {
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Yetki bilgileri geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    const outcome = await grantCommunityPermission(c.env.DB, {
      targetUserId: parsed.data.userId,
      communityId: parsed.data.communityId,
      role: parsed.data.role,
      actorUserId: actor.id,
    });

    if (!outcome.ok) {
      const payload: ApiErrorResponse = {
        error: {
          code: outcome.code,
          message:
            outcome.code === "NOT_FOUND"
              ? "Üye veya topluluk bulunamadı."
              : "Yalnızca doğrulanmış üyelere topluluk yetkisi verilebilir.",
        },
      };
      return c.json(payload, outcome.code === "NOT_FOUND" ? 404 : 400);
    }

    return c.json({ status: "ok" }, 200);
  });

  admin.delete("/communities/permissions", async (c) => {
    const actor = c.get("currentMember");

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      const payload: ApiErrorResponse = {
        error: { code: "INVALID_JSON", message: "Geçersiz JSON gövdesi." },
      };
      return c.json(payload, 400);
    }

    const parsed = communityPermissionRevokeSchema.safeParse(rawBody);
    if (!parsed.success) {
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Yetki kaldırma verisi geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    await revokeCommunityPermission(c.env.DB, {
      targetUserId: parsed.data.userId,
      communityId: parsed.data.communityId,
      actorUserId: actor.id,
    });

    return c.json({ status: "ok" }, 200);
  });

  return admin;
}
