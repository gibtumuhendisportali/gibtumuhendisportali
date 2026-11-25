import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { checkInRequestSchema, eventCreateSchema } from "@gibtu/shared";
import { updateSession } from "../src/lib/supabase/middleware";

const MOCK_CONFIG = {
  url: "https://example.supabase.co",
  anonKey: "anon-placeholder",
};

describe("Phase 3 Events, Tickets & Check-In schemas and route protection", () => {
  it("validates eventCreateSchema time ordering and capacity bounds", () => {
    const invalidOrder = eventCreateSchema.safeParse({
      title: "GİBTÜ Yapay Zeka Zirvesi",
      description: "Sektör ve akademi buluşması etkinliği.",
      communityId: "comm-yazek",
      location: "GİBTÜ Konferans Salonu",
      startsAt: "2026-12-10T14:00:00.000Z",
      endsAt: "2026-12-10T13:00:00.000Z",
      capacity: 120,
    });
    assert.equal(invalidOrder.success, false);

    const valid = eventCreateSchema.safeParse({
      title: "GİBTÜ Yapay Zeka Zirvesi",
      description: "Sektör ve akademi buluşması etkinliği.",
      communityId: null,
      location: "GİBTÜ Konferans Salonu",
      startsAt: "2026-12-10T10:00:00.000Z",
      endsAt: "2026-12-10T16:00:00.000Z",
      capacity: 120,
    });
    assert.equal(valid.success, true);
  });

  it("validates checkInRequestSchema minimum token length", () => {
    const shortToken = checkInRequestSchema.safeParse({
      eventId: "evt-1",
      qrToken: "short",
    });
    assert.equal(shortToken.success, false);

    const valid = checkInRequestSchema.safeParse({
      eventId: "evt-1",
      qrToken: "gibtu-qr-token-1234567890",
    });
    assert.equal(valid.success, true);
  });

  it("protects /events, /tickets, and /check-in in middleware for unauthenticated users", async () => {
    for (const path of ["/events", "/tickets", "/check-in"]) {
      const req = new NextRequest(`https://portal.example.com${path}`);
      const res = await updateSession(req, {
        getConfig: () => MOCK_CONFIG,
        createClient: () => ({
          auth: { getUser: async () => ({ data: { user: null } }) },
        }),
      });
      assert.equal(res.status, 307);
      assert.equal(
        res.headers.get("location"),
        `https://portal.example.com/login?next=${encodeURIComponent(path)}`,
      );
    }
  });
});
