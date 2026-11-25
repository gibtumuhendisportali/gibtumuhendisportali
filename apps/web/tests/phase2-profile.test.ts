import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { directoryQuerySchema, profileUpdateSchema } from "@gibtu/shared";
import { updateSession } from "../src/lib/supabase/middleware";

const MOCK_CONFIG = {
  url: "https://example.supabase.co",
  anonKey: "anon-placeholder",
};

describe("Phase 2 Profile & Directory schemas and route protection", () => {
  it("enforces https:// URLs on profile links and rejects javascript: URLs", () => {
    const evil = profileUpdateSchema.safeParse({
      fullName: "Ayşe Yılmaz",
      linkedinUrl: "javascript:alert(1)",
      directoryVisible: false,
      showContactInfo: false,
      showProfessionalLinks: false,
    });
    assert.equal(evil.success, false);

    const valid = profileUpdateSchema.safeParse({
      fullName: "Ayşe Yılmaz",
      headline: "AI Engineer",
      skills: ["Python", "PyTorch"],
      linkedinUrl: "https://linkedin.com/in/ayse",
      githubUrl: "",
      contactEmail: "",
      directoryVisible: true,
      showContactInfo: false,
      showProfessionalLinks: true,
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.githubUrl, null);
      assert.equal(valid.data.contactEmail, null);
    }
  });

  it("validates directory query defaults", () => {
    const parsed = directoryQuerySchema.parse({});
    assert.equal(parsed.userType, "all");
    assert.equal(parsed.department, "all");
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 12);
  });

  it("protects /profile and /directory in middleware for unauthenticated users", async () => {
    for (const path of ["/profile", "/directory"]) {
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
