import { Hono } from "hono";
import { eventCreateSchema, type ApiErrorResponse, type EventsListResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import {
  cancelEventRegistration,
  canManageEventScope,
  createEventRecord,
  listEventsForMember,
  registerForEvent,
} from "../../lib/db/events";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requireVerifiedMember,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createEventRoutes(options: AuthMiddlewareOptions = {}) {
  const events = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  events.use("*", requireAuth, requireIdentityRecord, requireVerifiedMember);

  events.get("/", async (c) => {
    const member = c.get("currentMember");
    const items = await listEventsForMember(c.env.DB, member.id);
    const response: EventsListResponse = { items };
    return c.json(response, 200);
  });

  events.post("/", async (c) => {
    const member = c.get("currentMember");

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      const payload: ApiErrorResponse = {
        error: { code: "INVALID_JSON", message: "Geçersiz JSON gövdesi." },
      };
      return c.json(payload, 400);
    }

    const parsed = eventCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Etkinlik bilgileri geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    const targetCommunityId = parsed.data.communityId ?? null;
    if (!canManageEventScope(member, targetCommunityId)) {
      const payload: ApiErrorResponse = {
        error: {
          code: "FORBIDDEN",
          message: "Bu kapsamda etkinlik oluşturma yetkiniz bulunmuyor.",
        },
      };
      return c.json(payload, 403);
    }

    const eventId = await createEventRecord(c.env.DB, member.id, parsed.data);
    return c.json({ id: eventId }, 201);
  });

  events.post("/:eventId/register", async (c) => {
    const member = c.get("currentMember");
    const eventId = c.req.param("eventId");
    const pepper = c.env.QR_TOKEN_PEPPER?.trim();

    if (!pepper) {
      const payload: ApiErrorResponse = {
        error: {
          code: "TICKETING_NOT_CONFIGURED",
          message: "Bilet güvenlik anahtarı yapılandırılmamış.",
        },
      };
      return c.json(payload, 503);
    }

    const outcome = await registerForEvent(c.env.DB, pepper, {
      eventId,
      userId: member.id,
    });

    if (!outcome.ok) {
      const map: Record<typeof outcome.code, { status: 400 | 404 | 409; message: string }> = {
        NOT_FOUND: { status: 404, message: "Etkinlik bulunamadı." },
        EVENT_NOT_OPEN: { status: 400, message: "Etkinlik şu anda kayda açık değil." },
        EVENT_FULL: { status: 409, message: "Etkinlik kontenjanı dolmuştur." },
        ALREADY_REGISTERED: { status: 409, message: "Bu etkinliğe zaten kayıtlısınız." },
      };
      const entry = map[outcome.code];
      const payload: ApiErrorResponse = {
        error: { code: outcome.code, message: entry.message },
      };
      return c.json(payload, entry.status);
    }

    return c.json({ status: "confirmed", ticketId: outcome.ticketId }, 201);
  });

  events.post("/:eventId/cancel", async (c) => {
    const member = c.get("currentMember");
    const eventId = c.req.param("eventId");

    const outcome = await cancelEventRegistration(c.env.DB, {
      eventId,
      userId: member.id,
    });

    if (!outcome.ok) {
      const payload: ApiErrorResponse = {
        error: {
          code: outcome.code,
          message:
            outcome.code === "ALREADY_CHECKED_IN"
              ? "Yoklaması alınmış bilet iptal edilemez."
              : "Aktif etkinlik kaydı bulunamadı.",
        },
      };
      return c.json(payload, outcome.code === "ALREADY_CHECKED_IN" ? 409 : 404);
    }

    return c.json({ status: "cancelled" }, 200);
  });

  return events;
}
