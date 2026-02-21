// src/models/transaction.model.ts
import { ObjectId } from "mongodb";
import { getCollection } from "../infra/mongo/collection";
import type { Transaction } from "../types/transaction";

const COLLECTION_NAME = "transactions";

async function transactionsCollection() {
  return getCollection<Transaction>(COLLECTION_NAME);
}

export async function insertTransaction(tx: Transaction) {
  const col = await transactionsCollection();
  await col.insertOne(tx);
}

export async function listTransactionsByAccount(
  accountId: ObjectId,
  limit = 50
) {
  const col = await transactionsCollection();
  return col
    .find({ account_id: accountId })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
}
