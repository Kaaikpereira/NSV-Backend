import type { FastifyInstance } from "fastify";
import { meHandler, loginHandler, registerHandler } from "../controllers/auth.controller";

export default async function authRoutes(app: FastifyInstance) {
  // ✅ LOGIN - POST /api/auth/login (público)
  app.post(
    "/auth/login",
    async (request, reply) => {
      await loginHandler(request, reply);
    }
  );

  // ✅ REGISTER - POST /api/auth/register (público)
  app.post(
    "/auth/register",
    async (request, reply) => {
      await registerHandler(request, reply);
    }
  );

  // ✅ ME - GET /api/auth/me (protegido)
  app.get(
    "/auth/me",
    {
      preHandler: [app.authGuard],
    },
    meHandler
  );
}