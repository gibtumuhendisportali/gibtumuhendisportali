import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { onboardingInputSchema, verificationDecisionSchema } from "@gibtu/shared";
import { updateSession } from "../src/lib/supabase/middleware";

const MOCK_CONFIG = {
  url: "https://example.supabase.co",
  anonKey: "anon-placeholder",
};

describe("Phase 1B Onboarding & Admin schemas and route protection", () => {
  it("requires graduationYear for alumni and kvkkDisclosureAccepted=true", () => {
    const missingGrad = onboardingInputSchema.safeParse({
      fullName: "Ali Demir",
      userType: "alumni",
      department: "Bilgisayar Mühendisliği",
      entryYear: 2020,
      kvkkDisclosureAccepted: true,
      kvkkExplicitConsent: false,
    });
    assert.equal(missingGrad.success, false);

    const validAlumni = onboardingInputSchema.safeParse({
      fullName: "Ali Demir",
      userType: "alumni",
      department: "Bilgisayar Mühendisliği",
      entryYear: 2020,
      graduationYear: 2024,
      kvkkDisclosureAccepted: true,
      kvkkExplicitConsent: false,
    });
    assert.equal(validAlumni.success, true);
  });

  it("requires rejectionReason when admin rejects an application", () => {
    const missingReason = verificationDecisionSchema.safeParse({
      decision: "rejected",
    });
    assert.equal(missingReason.success, false);

    const validReject = verificationDecisionSchema.safeParse({
      decision: "rejected",
      rejectionReason: "GİBTÜ mühendislik kaydı doğrulanamadı.",
    });
    assert.equal(validReject.success, true);
  });

  it("protects /onboarding and /admin routes in middleware for unauthenticated users", async () => {
    const onboardingReq = new NextRequest("https://portal.example.com/onboarding");
    const onboardingRes = await updateSession(onboardingReq, {
      getConfig: () => MOCK_CONFIG,
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    });
    assert.equal(onboardingRes.status, 307);
    assert.equal(
      onboardingRes.headers.get("location"),
      "https://portal.example.com/login?next=%2Fonboarding",
    );

    const adminReq = new NextRequest("https://portal.example.com/admin/verifications");
    const adminRes = await updateSession(adminReq, {
      getConfig: () => MOCK_CONFIG,
      createClient: () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    });
    assert.equal(adminRes.status, 307);
    assert.equal(
      adminRes.headers.get("location"),
      "https://portal.example.com/login?next=%2Fadmin%2Fverifications",
    );
  });
});
