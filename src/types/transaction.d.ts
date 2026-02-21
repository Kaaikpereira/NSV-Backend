// src/types/transaction.d.ts
import { ObjectId } from "mongodb";

export type TransactionType = "nix" | "payment" | "purchase" | "transfer";
export type TransactionDirection = "debit" | "credit";


export interface Transaction {
  _id: ObjectId;
  account_id: ObjectId;
  type: TransactionType;
  direction: TransactionDirection; // debit | credit
  amount_cipher: CipherPayload;
  description_cipher: CipherPayload | null;
  created_at: Date;
  transfer_id?: ObjectId; // ligação opcional
}

export interface Transfer {
  _id: ObjectId;
  from_account_id: ObjectId;
  to_account_id: ObjectId;
  amount_cipher: CipherPayload;
  created_at: Date;
}
