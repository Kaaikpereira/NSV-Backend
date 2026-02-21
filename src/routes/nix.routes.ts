// src/routes/nix.routes.ts
import { FastifyInstance } from "fastify";
import { nixTransferHandler } from "../controllers/nix.controller";

export default async function nixRoutes(app: FastifyInstance) {
  app.post(
    "/nix/transfer",
    { preHandler: [app.authGuard] },
    nixTransferHandler
  );
}
