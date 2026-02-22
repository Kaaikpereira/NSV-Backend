// src/controllers/nix.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { ObjectId } from "mongodb";
import {
  findAccountById,
  findAccountByDisplay,
  updateAccountBalance,
} from "../model/account.model";
import { encryptContext, decryptContext } from "../sna/sna456";
import { registerTransaction } from "../services/transactions.service";
import { findUserBySupabaseId, findUserByMongoId } from "../model/user.model";
import { writeAuditLog } from "../model/audit.model";

type NixTransferBody = {
  to_account: string; // account_display_plain digitado
  amount: number;
  description?: string;
};

interface AuthRequest extends FastifyRequest {
  userId?: string;         // _id do Mongo do usuário logado (string)
  supabaseUserId?: string; // id do usuário no Supabase (string)
}


export async function nixTransferHandler(
  request: AuthRequest,
  reply: FastifyReply
) {
  if (!request.userId || !request.supabaseUserId) {
    return reply.status(401).send({ error: "unauthorized" });
  }

  const { to_account, amount, description } = request.body as {
    to_account: string;
    amount: number;
    description?: string;
  };

  const sender = await findUserBySupabaseId(request.supabaseUserId);
  if (!sender?.nsv_account_id) {
    return reply.status(400).send({ error: "account_not_found" });
  }

  const fromAccount = await findAccountById(sender.nsv_account_id);
  const toAccount = await findAccountByDisplay(to_account);

  if (!fromAccount || !toAccount) {
    return reply.status(404).send({ error: "account_not_found" });
  }

  const recipientUser = await findUserByMongoId(toAccount.user_id);

  // decrypt balances
  const fromPayload = await decryptContext(
    { userId: request.supabaseUserId, type: "account", recordId: sender._id.toHexString() },
    fromAccount.balance_cipher
  );

  if (fromPayload.balance < amount) {
    return reply.status(400).send({ error: "insufficient_funds" });
  }

  const toPayload = await decryptContext(
    { userId: recipientUser!.supabase_user_id, type: "account", recordId: recipientUser!._id.toHexString() },
    toAccount.balance_cipher
  );

  const newFrom = fromPayload.balance - amount;
  const newTo = toPayload.balance + amount;

  await updateAccountBalance(
    fromAccount._id,
    await encryptContext({ userId: request.supabaseUserId, type: "account", recordId: sender._id.toHexString() }, { balance: newFrom })
  );

  await updateAccountBalance(
    toAccount._id,
    await encryptContext({ userId: recipientUser!.supabase_user_id, type: "account", recordId: recipientUser!._id.toHexString() }, { balance: newTo })
  );

  await registerTransaction(request.supabaseUserId, {
    type: "nix",
    direction: "debit",
    amount,
    description,
  });

  if (recipientUser?.supabase_user_id) {
    await registerTransaction(recipientUser.supabase_user_id, {
      type: "nix",
      direction: "credit",
      amount,
      description,
    });
  }

  // 🔒 AUDIT TRANSFER
  await writeAuditLog({
    actorUserId: request.supabaseUserId,
    action: "TRANSFER_NIX",
    entity: "transaction",
    entityId: fromAccount._id.toHexString(),
    metadata: {
      toAccount: to_account,
      amount,
      description,
    },
    createdAt: new Date(),
  });

  return reply.status(201).send({ new_balance: newFrom });
}
