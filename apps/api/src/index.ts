import { Hono } from "hono";
import type { ApiErrorResponse, HealthResponse } from "@gibtu/shared";
import type { Env } from "./env";
import type { AuthMiddlewareOptions, AuthVariables } from "./middleware/auth";
import { createCorsMiddleware, securityHeadersMiddleware } from "./middleware/security";
import { createAdminRoutes } from "./modules/admin/routes";
import { createAuthRoutes } from "./modules/auth/routes";
import { createDirectoryRoutes } from "./modules/directory/routes";
import { createIdentityRoutes } from "./modules/identity/routes";
import { createMediaRoutes } from "./modules/media/routes";
import { createProfileRoutes } from "./modules/profiles/routes";

export interface AppOptions {
  auth?: AuthMiddlewareOptions;
}

export function createApp(options: AppOptions = {}) {
  const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  app.use("*", securityHeadersMiddleware);
  app.use("*", createCorsMiddleware());

  app.get("/health", (c) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "gibtu-engineering-portal-api",
      timestamp: new Date().toISOString(),
    };
    return c.json(payload, 200);
  });

  const v1 = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  v1.get("/", (c) => {
    return c.json({
      service: "gibtu-engineering-portal-api",
      version: "v1",
      status: "ready",
    });
  });

  v1.route("/auth", createAuthRoutes(options.auth));
  v1.route("/", createIdentityRoutes(options.auth));
  v1.route("/profile", createProfileRoutes(options.auth));
  v1.route("/directory", createDirectoryRoutes(options.auth));
  v1.route("/media", createMediaRoutes(options.auth));
  v1.route("/admin", createAdminRoutes(options.auth));

  app.route("/v1", v1);

  app.notFound((c) => {
    const payload: ApiErrorResponse = {
      error: {
        code: "NOT_FOUND",
        message: "İstenen uç nokta bulunamadı.",
      },
    };
    return c.json(payload, 404);
  });

  app.onError((err, c) => {
    console.error("Unhandled API error:", err.message);
    const payload: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Beklenmeyen bir sunucu hatası oluştu.",
      },
    };
    return c.json(payload, 500);
  });

  return app;
}

const app = createApp();

export default app;
