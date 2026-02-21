import { ObjectId } from "mongodb";
import {
  findUserBySupabaseId,
  findUserByMongoId,
} from "../model/user.model";
import {
  findAccountById,
  updateAccountBalance,
} from "../model/account.model";
import {
  insertTransaction,
  listTransactionsByAccount,
} from "../model/transation.model";
import { encryptContext, decryptContext } from "../sna/sna456";
import type { TransactionType } from "../types/transaction";

// registra transação sem mexer em saldo (Nix vai usar essa)
export async function registerTransaction(
  supabaseUserId: string,
  input: {
    type: TransactionType;
    direction: "debit" | "credit";
    amount: number;
    description?: string;
  }
) {
  const user = await findUserBySupabaseId(supabaseUserId);
  if (!user || !user.nsv_account_id) throw new Error("Account not found");

  const accountId = user.nsv_account_id as ObjectId;
  const account = await findAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const txId = new ObjectId();

  const txContext = {
    userId: supabaseUserId,
    type: "transaction",
    recordId: txId.toHexString(),
  };

  const amount_cipher = await encryptContext(txContext, {
    amount: input.amount,
  });

  const description_cipher = input.description
    ? await encryptContext(txContext, { description: input.description })
    : null;

  const tx = {
    _id: txId,
    account_id: accountId,
    type: input.type,
    direction: input.direction,
    amount_cipher,
    description_cipher,
    created_at: new Date(),
  };

  await insertTransaction(tx);
}

// função antiga, se ainda quiser usar pra pagamentos genéricos
export async function createTransaction(
  supabaseUserId: string,
  input: { type: TransactionType; amount: number; description?: string }
) {
  console.log("createTransaction supabaseUserId=", supabaseUserId);
  const user = await findUserBySupabaseId(supabaseUserId);
  console.log("createTransaction user=", user?._id, user?.nsv_account_id);
  if (!user || !user.nsv_account_id) throw new Error("Account not found");

  const accountId = user.nsv_account_id as ObjectId;
  const account = await findAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const balanceContext = {
    userId: supabaseUserId,
    type: "account",
    recordId: user._id.toHexString(),
  };
  const balancePayload: any = await decryptContext(
    balanceContext,
    account.balance_cipher
  );
  const currentBalance = balancePayload.balance ?? 0;

  if (currentBalance < input.amount) {
    throw new Error("Insufficient funds");
  }

  const newBalance = currentBalance - input.amount;

  const newBalanceCipher = await encryptContext(balanceContext, {
    balance: newBalance,
  });

  await updateAccountBalance(accountId, newBalanceCipher);

  const txId = new ObjectId();
  const txContext = {
    userId: supabaseUserId,
    type: "transaction",
    recordId: txId.toHexString(),
  };

  const amount_cipher = await encryptContext(txContext, {
    amount: input.amount,
  });

  const description_cipher = input.description
    ? await encryptContext(txContext, { description: input.description })
    : null;

  const tx = {
    _id: txId,
    account_id: accountId,
    type: input.type,
    direction: "debit" as const,
    amount_cipher,
    description_cipher,
    created_at: new Date(),
  };

  await insertTransaction(tx);

  return { balance: newBalance };
}

// AGORA recebe Mongo _id (string)
export async function getTransactionsForUser(
  userMongoId: string,
  limit = 50
) {
  const userObjectId = new ObjectId(userMongoId);
  const user = await findUserByMongoId(userObjectId);
  if (!user || !user.nsv_account_id) return [];

  const accountId = user.nsv_account_id as ObjectId;
  const account = await findAccountById(accountId);
  if (!account) return [];

  const docs = await listTransactionsByAccount(accountId, limit);

  return Promise.all(
    docs.map(async (doc) => {
      const ctx = {
        userId: user.supabase_user_id, // para SNA
        type: "transaction",
        recordId: doc._id.toHexString(),
      };

      const amountPayload: any = await decryptContext(ctx, doc.amount_cipher);
      let desc: string | null = null;
      if (doc.description_cipher) {
        const d: any = await decryptContext(ctx, doc.description_cipher);
        desc = d.description ?? null;
      }

      return {
        id: doc._id.toHexString(),
        type: doc.type,
        direction: doc.direction,
        amount: amountPayload.amount ?? 0,
        description: desc,
        created_at: doc.created_at,
      };
    })
  );
}