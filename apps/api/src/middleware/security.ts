import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Env } from "../env.js";

export const securityHeadersMiddleware = secureHeaders({
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
});

export function createCorsMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const rawOrigins = c.env.ALLOWED_ORIGINS ?? "";
    const allowedOrigins = rawOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    const corsHandler = cors({
      origin: (origin) => (allowedOrigins.includes(origin) ? origin : ""),
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    });

    return corsHandler(c, next);
  };
}
