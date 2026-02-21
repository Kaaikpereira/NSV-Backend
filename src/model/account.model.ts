import { ObjectId } from "mongodb";
import { getCollection } from "../infra/mongo/collection";
import type { Account } from "../types/account";
import { encryptContext, decryptContext } from "../sna/sna456";
import { generateAccountNumber } from "../utils/generateAccount";
import { writeAuditLog } from "./audit.model";
import { findUserBySupabaseId } from "./user.model";

const COLLECTION_NAME = "accounts";

export async function accountsCollection() {
  return getCollection<Account>(COLLECTION_NAME);
}

export async function createNsvAccountForUser(
  userId: ObjectId,
  supabaseUserId: string
): Promise<Account> {
  const col = await accountsCollection();
  const accountData = generateAccountNumber();

  const context = {
    userId: supabaseUserId,
    type: "account",
    recordId: userId.toHexString(),
  };

  const account_number_cipher = await encryptContext(
    context,
    accountData.account_number
  );
  const account_digit_cipher = await encryptContext(
    context,
    accountData.account_digit
  );
  const account_display_cipher = await encryptContext(
    context,
    accountData.account_display
  );

  const balance_cipher = await encryptContext(context, { balance: 5000 });

  const account: Account = {
    _id: new ObjectId(),
    user_id: userId,
    account_number_cipher,
    account_digit_cipher,
    account_display_cipher,
    account_display_plain: accountData.account_display,
    balance_cipher,
    currency: "NSV",
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
  };

  await col.insertOne(account);

  return account;
}

export async function findAccountById(
  accountId: ObjectId
): Promise<Account | null> {
  const col = await accountsCollection();
  return col.findOne({ _id: accountId });
}

export async function updateAccountBalance(
  accountId: ObjectId,
  newBalanceCipher: Account["balance_cipher"]
): Promise<void> {
  const col = await accountsCollection();
  await col.updateOne(
    { _id: accountId },
    { $set: { balance_cipher: newBalanceCipher, updated_at: new Date() } }
  );
}

// conta NSV principal pelo supabaseUserId
export async function findAccountBySupabaseUserId(
  supabaseUserId: string
): Promise<Account | null> {
  const user = await findUserBySupabaseId(supabaseUserId);
  if (!user || !user.nsv_account_id) return null;

  return findAccountById(user.nsv_account_id as ObjectId);
}

// ler saldo (descriptografando)
export async function getAccountBalance(
  supabaseUserId: string,
  account: Account
): Promise<number> {
  // importante: recordId é SEMPRE o _id do user dono,
  // igual ao usado em createNsvAccountForUser
  const user = await findUserBySupabaseId(supabaseUserId);
  if (!user) return 0;

  const context = {
    userId: supabaseUserId,
    type: "account",
    recordId: user._id.toHexString(),
  };

  const payload: any = await decryptContext(context, account.balance_cipher);
  return payload.balance ?? 0;
}

// setar saldo (recriptografando)
export async function setAccountBalance(
  supabaseUserId: string,
  account: Account
): Promise<void> {
  const user = await findUserBySupabaseId(supabaseUserId);
  if (!user) return;

  const current = await getAccountBalance(supabaseUserId, account);

  const context = {
    userId: supabaseUserId,
    type: "account",
    recordId: user._id.toHexString(),
  };

  const newBalanceCipher = await encryptContext(context, {
    balance: current,
  });
  await updateAccountBalance(account._id, newBalanceCipher);
}

export async function findAccountByDisplay(
  display: string
): Promise<Account | null> {
  const col = await accountsCollection();

  // agora fazemos lookup direto pelo campo em claro
  return col.findOne({ account_display_plain: display });
}

export async function deleteAccountBySupabaseUserId(
  supabaseUserId: string
): Promise<void> {
  const col = await accountsCollection();
  const user = await findUserBySupabaseId(supabaseUserId);
  if (!user || !user.nsv_account_id) return;

  await col.deleteOne({ _id: user.nsv_account_id as ObjectId });

}