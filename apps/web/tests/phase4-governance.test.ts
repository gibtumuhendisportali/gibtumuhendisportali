import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  communityPermissionGrantSchema,
  communityPermissionRevokeSchema,
  eventStatusUpdateSchema,
} from "@gibtu/shared";
import { updateSession } from "../src/lib/supabase/middleware";

const MOCK_CONFIG = {
  url: "https://example.supabase.co",
  anonKey: "anon-placeholder",
};

describe("Phase 4 Community Governance & Event Attendees schemas and route protection", () => {
  it("validates communityPermissionGrantSchema, revoke schema, and eventStatusUpdateSchema", () => {
    const grant = communityPermissionGrantSchema.safeParse({
      userId: "u-1",
      communityId: "comm-yazek",
      role: "organizer",
    });
    assert.equal(grant.success, true);

    const revoke = communityPermissionRevokeSchema.safeParse({
      userId: "u-1",
      communityId: "comm-yazek",
    });
    assert.equal(revoke.success, true);

    const status = eventStatusUpdateSchema.safeParse({ status: "cancelled" });
    assert.equal(status.success, true);
  });

  it("protects /admin/communities and /events/[id]/attendees in middleware", async () => {
    for (const path of ["/admin/communities", "/events/evt-1/attendees"]) {
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
