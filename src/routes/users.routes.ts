import type { FastifyInstance } from "fastify";
import { updateDisplayNameHandler } from "../controllers/users.controller";

export default async function userRoutes(app: FastifyInstance) {
  app.patch(
    "/user/display-name",
    { preHandler: [app.authGuard] },
    updateDisplayNameHandler
  );
}
