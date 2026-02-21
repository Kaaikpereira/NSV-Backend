import { FastifyRequest, FastifyReply } from "fastify";
import {
  createTransaction,
  getTransactionsForUser,
} from "../services/transactions.service";

type CreateTxBody = {
  type: "nix" | "payment" | "purchase" | "transfer";
  amount: number;
  description?: string;
};

export async function listMyTransactionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const txs = await getTransactionsForUser(request.userId);
  return reply.send({ transactions: txs });
}

export async function createTransactionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.supabaseUserId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const body = request.body as CreateTxBody;

  const result = await createTransaction(request.supabaseUserId, body);

  return reply.status(201).send({
    new_balance: result.balance,
  });
}