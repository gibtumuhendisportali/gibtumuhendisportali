import type { MiddlewareHandler } from "hono";
import type { ApiErrorResponse, MeResponse } from "@gibtu/shared";
import type { Env } from "../env";
import { findMeBySupabaseId } from "../lib/db/identity";
import type { AuthVariables } from "./auth";

export interface AuthorizationVariables extends AuthVariables {
  currentMember: NonNullable<MeResponse["user"]>;
  currentProfile: MeResponse["profile"];
}

export const requireIdentityRecord: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthorizationVariables;
}> = async (c, next) => {
  const authIdentity = c.get("authIdentity");
  const me = await findMeBySupabaseId(c.env.DB, authIdentity.supabaseUserId);

  if (!me.onboarded || !me.user) {
    const payload: ApiErrorResponse = {
      error: {
        code: "ONBOARDING_REQUIRED",
        message: "Devam etmek için üyelik başvuru bilgilerinizi tamamlamalısınız.",
      },
    };
    return c.json(payload, 403);
  }

  if (me.user.verificationStatus === "suspended") {
    const payload: ApiErrorResponse = {
      error: {
        code: "ACCOUNT_SUSPENDED",
        message: "Hesabınız askıya alınmıştır.",
      },
    };
    return c.json(payload, 403);
  }

  c.set("currentMember", me.user);
  c.set("currentProfile", me.profile);
  await next();
};

export const requireVerifiedMember: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthorizationVariables;
}> = async (c, next) => {
  const member = c.get("currentMember");
  if (member.verificationStatus !== "verified") {
    const payload: ApiErrorResponse = {
      error: {
        code: "VERIFICATION_REQUIRED",
        message: "Bu alana yalnızca doğrulanmış GİBTÜ mühendislik üyeleri erişebilir.",
      },
    };
    return c.json(payload, 403);
  }
  await next();
};

export const requirePlatformAdmin: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthorizationVariables;
}> = async (c, next) => {
  const member = c.get("currentMember");
  if (member.verificationStatus !== "verified" || member.role !== "platform_admin") {
    const payload: ApiErrorResponse = {
      error: {
        code: "FORBIDDEN",
        message: "Bu işlem için platform yöneticisi yetkisi gereklidir.",
      },
    };
    return c.json(payload, 403);
  }
  await next();
};
