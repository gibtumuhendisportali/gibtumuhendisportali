import { Hono } from "hono";
import {
  checkInRequestSchema,
  type ApiErrorResponse,
  type TicketsListResponse,
} from "@gibtu/shared";
import type { Env } from "../../env";
import {
  canManageEventScope,
  checkInTicketByQrToken,
  findEventById,
  listTicketsForMember,
} from "../../lib/db/events";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requireVerifiedMember,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createTicketRoutes(options: AuthMiddlewareOptions = {}) {
  const tickets = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  tickets.use("*", requireAuth, requireIdentityRecord, requireVerifiedMember);

  tickets.get("/", async (c) => {
    const member = c.get("currentMember");
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

    const items = await listTicketsForMember(c.env.DB, pepper, member.id);
    const response: TicketsListResponse = { items };
    return c.json(response, 200);
  });

  tickets.post("/check-in", async (c) => {
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

    const parsed = checkInRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Yoklama isteği geçersiz.",
        },
      };
      return c.json(payload, 400);
    }

    const event = await findEventById(c.env.DB, parsed.data.eventId);
    if (!event) {
      const payload: ApiErrorResponse = {
        error: { code: "NOT_FOUND", message: "Etkinlik bulunamadı." },
      };
      return c.json(payload, 404);
    }

    if (!canManageEventScope(member, event.community_id)) {
      const payload: ApiErrorResponse = {
        error: {
          code: "FORBIDDEN",
          message: "Bu etkinlik için yoklama alma yetkiniz yok.",
        },
      };
      return c.json(payload, 403);
    }

    const outcome = await checkInTicketByQrToken(c.env.DB, {
      eventId: parsed.data.eventId,
      qrToken: parsed.data.qrToken,
      actorUserId: member.id,
    });

    if (!outcome.ok) {
      const messages: Record<typeof outcome.code, string> = {
        INVALID_TICKET: "Geçersiz QR bilet kodu.",
        WRONG_EVENT: "Bu bilet seçili etkinliğe ait değil.",
        TICKET_CANCELLED: "Bu bilet iptal edilmiştir.",
      };
      const payload: ApiErrorResponse = {
        error: { code: outcome.code, message: messages[outcome.code] },
      };
      return c.json(payload, 400);
    }

    return c.json(outcome.data, 200);
  });

  return tickets;
}
