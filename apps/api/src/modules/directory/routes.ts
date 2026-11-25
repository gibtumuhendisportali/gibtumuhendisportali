import { Hono } from "hono";
import { directoryQuerySchema, type ApiErrorResponse } from "@gibtu/shared";
import type { Env } from "../../env";
import { searchDirectoryMembers } from "../../lib/db/directory";
import { createRequireAuthMiddleware, type AuthMiddlewareOptions } from "../../middleware/auth";
import {
  requireIdentityRecord,
  requireVerifiedMember,
  type AuthorizationVariables,
} from "../../middleware/authorization";

export function createDirectoryRoutes(options: AuthMiddlewareOptions = {}) {
  const directory = new Hono<{ Bindings: Env; Variables: AuthorizationVariables }>();
  const requireAuth = createRequireAuthMiddleware(options);

  directory.use("*", requireAuth, requireIdentityRecord, requireVerifiedMember);

  directory.get("/", async (c) => {
    const parsed = directoryQuerySchema.safeParse({
      q: c.req.query("q"),
      userType: c.req.query("userType"),
      department: c.req.query("department"),
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
    });

    if (!parsed.success) {
      const payload: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz dizin arama parametreleri.",
        },
      };
      return c.json(payload, 400);
    }

    const result = await searchDirectoryMembers(c.env.DB, parsed.data);
    return c.json(result, 200);
  });

  return directory;
}
