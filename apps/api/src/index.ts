import { Hono } from "hono";
import type { ApiErrorResponse, HealthResponse } from "@gibtu/shared";
import type { Env } from "./env.js";
import { createCorsMiddleware, securityHeadersMiddleware } from "./middleware/security.js";

const app = new Hono<{ Bindings: Env }>();

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

const v1 = new Hono<{ Bindings: Env }>();

v1.get("/", (c) => {
  return c.json({
    service: "gibtu-engineering-portal-api",
    version: "v1",
    status: "ready",
  });
});

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

export default app;
