import {
  createRemoteJWKSet,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

export interface VerifiedJwtIdentity {
  supabaseUserId: string;
  email: string | null;
  emailVerified: boolean | null;
  sessionIssuedAt: string | null;
}

export interface JwtVerifierConfig {
  jwksUrl?: string;
  issuer?: string;
  audience?: string;
  getKey?: JWTVerifyGetKey;
}

export type JwtErrorCode = "AUTH_NOT_CONFIGURED" | "JWKS_UNAVAILABLE" | "INVALID_TOKEN";

export class JwtVerificationError extends Error {
  public readonly code: JwtErrorCode;

  constructor(code: JwtErrorCode, message: string) {
    super(message);
    this.name = "JwtVerificationError";
    this.code = code;
  }
}

const jwksCache = new Map<string, JWTVerifyGetKey>();

function getRemoteJwks(jwksUrl: string): JWTVerifyGetKey {
  const existing = jwksCache.get(jwksUrl);
  if (existing) {
    return existing;
  }
  const created = createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, created);
  return created;
}

/**
 * Resolves email verification strictly from top-level JWT claims.
 * Never trusts client-writable `user_metadata`. Returns `null` when
 * no trustworthy top-level claim is present in the token.
 */
export function resolveEmailVerified(payload: JWTPayload): boolean | null {
  if (typeof payload["email_verified"] === "boolean") {
    return payload["email_verified"];
  }
  return null;
}

const TOKEN_VALIDATION_ERROR_CODES = new Set<string>([
  "ERR_JWT_EXPIRED",
  "ERR_JWT_CLAIM_VALIDATION_FAILED",
  "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
  "ERR_JWS_INVALID",
  "ERR_JWT_INVALID",
  "ERR_JWKS_NO_MATCHING_KEY",
  "ERR_JWKS_MULTIPLE_MATCHING_KEYS",
  "ERR_JOSE_ALG_NOT_ALLOWED",
  "ERR_JOSE_NOT_SUPPORTED",
]);

export async function verifySupabaseJwt(
  token: string,
  config: JwtVerifierConfig,
): Promise<VerifiedJwtIdentity> {
  if (!config.issuer || !config.audience) {
    throw new JwtVerificationError("AUTH_NOT_CONFIGURED", "Auth verifier is not configured.");
  }

  const keyResolver =
    config.getKey ?? (config.jwksUrl ? getRemoteJwks(config.jwksUrl) : undefined);

  if (!keyResolver) {
    throw new JwtVerificationError("AUTH_NOT_CONFIGURED", "JWKS resolver is not configured.");
  }

  let payload: JWTPayload;
  try {
    const result = await jwtVerify(token, keyResolver, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["ES256", "RS256"],
    });
    payload = result.payload;
  } catch (error) {
    if (error instanceof joseErrors.JOSEError && TOKEN_VALIDATION_ERROR_CODES.has(error.code)) {
      throw new JwtVerificationError("INVALID_TOKEN", "Token validation failed.");
    }

    // Network failures, timeouts (ERR_JWKS_TIMEOUT), or upstream JWKS errors fail closed with 503.
    throw new JwtVerificationError("JWKS_UNAVAILABLE", "Unable to verify token against JWKS.");
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new JwtVerificationError("INVALID_TOKEN", "Token subject is missing.");
  }

  const email = typeof payload["email"] === "string" ? payload["email"] : null;
  const sessionIssuedAt =
    typeof payload.iat === "number" ? new Date(payload.iat * 1000).toISOString() : null;

  return {
    supabaseUserId: payload.sub,
    email,
    emailVerified: resolveEmailVerified(payload),
    sessionIssuedAt,
  };
}
