import type { MiddlewareHandler } from "hono";
import type { ApiErrorResponse } from "@gibtu/shared";
import type { JWTVerifyGetKey } from "jose";
import type { Env } from "../env";
import {
  JwtVerificationError,
  verifySupabaseJwt,
  type VerifiedJwtIdentity,
} from "../lib/auth/jwt";

export interface AuthVariables {
  authIdentity: VerifiedJwtIdentity;
}

export interface AuthMiddlewareOptions {
  getKey?: JWTVerifyGetKey;
  issuer?: string;
  audience?: string;
}

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    return null;
  }
  const token = parts[1];
  return token && token.length > 0 ? token : null;
}

export function createRequireAuthMiddleware(
  options: AuthMiddlewareOptions = {},
): MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> {
  return async (c, next) => {
    const token = extractBearerToken(c.req.header("Authorization"));

    if (!token) {
      const payload: ApiErrorResponse = {
        error: {
          code: "UNAUTHORIZED",
          message: "Kimlik doğrulama gerekli.",
        },
      };
      return c.json(payload, 401);
    }

    try {
      const jwksUrl =
        c.env.SUPABASE_JWKS_URL ??
        (c.env.SUPABASE_URL
          ? `${c.env.SUPABASE_URL.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`
          : undefined);

      const issuer =
        options.issuer ??
        c.env.SUPABASE_JWT_ISSUER ??
        (c.env.SUPABASE_URL
          ? `${c.env.SUPABASE_URL.replace(/\/+$/, "")}/auth/v1`
          : undefined);

      const audience = options.audience ?? c.env.SUPABASE_JWT_AUDIENCE ?? "authenticated";

      const identity = await verifySupabaseJwt(token, {
        ...(jwksUrl ? { jwksUrl } : {}),
        ...(issuer ? { issuer } : {}),
        audience,
        ...(options.getKey ? { getKey: options.getKey } : {}),
      });

      c.set("authIdentity", identity);
      await next();
    } catch (error) {
      if (error instanceof JwtVerificationError) {
        if (error.code === "AUTH_NOT_CONFIGURED") {
          const payload: ApiErrorResponse = {
            error: {
              code: "AUTH_NOT_CONFIGURED",
              message: "Kimlik doğrulama servisi yapılandırılmamış.",
            },
          };
          return c.json(payload, 503);
        }

        if (error.code === "JWKS_UNAVAILABLE") {
          const payload: ApiErrorResponse = {
            error: {
              code: "AUTH_SERVICE_UNAVAILABLE",
              message: "Kimlik doğrulama anahtar servisine şu anda ulaşılamıyor.",
            },
          };
          return c.json(payload, 503);
        }
      }

      const payload: ApiErrorResponse = {
        error: {
          code: "INVALID_TOKEN",
          message: "Geçersiz veya süresi dolmuş oturum belirteci.",
        },
      };
      return c.json(payload, 401);
    }
  };
}
