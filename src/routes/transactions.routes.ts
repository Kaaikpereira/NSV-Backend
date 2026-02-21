// src/routes/transactions.routes.ts
import { FastifyInstance } from "fastify";
import {
  listMyTransactionsHandler,
  createTransactionHandler,
} from "../controllers/transactions.controller";

export default async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    "/transactions",
    { preHandler: [app.authGuard] },
    listMyTransactionsHandler
  );

  app.post(
    "/transactions",
    { preHandler: [app.authGuard] },
    createTransactionHandler
  );
}
