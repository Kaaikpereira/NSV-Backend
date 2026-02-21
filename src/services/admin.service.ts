// src/services/admin.service.ts
import { ObjectId } from 'mongodb';
import { listAuditLogs } from '../model/audit-log.model';
import {
  accountsCollection,
  findAccountById,
  updateAccountBalance,
} from '../model/account.model';
import { findUserByMongoId } from '../model/user.model';
import { encryptContext, decryptContext } from '../sna/sna456';
import { writeAuditLog } from '../model/audit.model';

export async function getAuditLogs(limit?: number) {
  const logs = await listAuditLogs(limit ?? 200);
  return logs;
}

// ===== ADMIN CONTAS =====

export async function adminListAccounts(limit = 100) {
  const col = await accountsCollection();
  const docs = await col
    .find({})
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    user_id: doc.user_id.toHexString(),
    account_display: doc.account_display_plain,
    status: doc.status,
    currency: doc.currency,
    created_at: doc.created_at,
  }));
}

export async function adminGetAccount(id: string) {
  const acc = await findAccountById(new ObjectId(id));
  if (!acc) return null;

  return {
    id: acc._id.toHexString(),
    user_id: acc.user_id.toHexString(),
    account_display: acc.account_display_plain,
    status: acc.status,
    currency: acc.currency,
    created_at: acc.created_at,
  };
}

export async function adminUpdateAccount(params: {
  adminSupabaseId: string;
  accountId: string;
  newBalance?: number;
  newStatus?: 'active' | 'blocked';
  reason: string;
}) {
  const { adminSupabaseId, accountId, newBalance, newStatus, reason } = params;
  const acc = await findAccountById(new ObjectId(accountId));
  if (!acc) throw new Error('Account not found');

  const owner = await findUserByMongoId(acc.user_id);
  if (!owner) throw new Error('Owner not found');

  let oldBalance: number | undefined;
  let newBalanceValue: number | undefined;

  if (typeof newBalance === 'number') {
    const ctx = {
      userId: owner.supabase_user_id,
      type: 'account',
      recordId: owner._id.toHexString(),
    };
    const payload: any = await decryptContext(ctx, acc.balance_cipher);
    oldBalance = payload.balance ?? 0;

    const newBalanceCipher = await encryptContext(ctx, {
      balance: newBalance,
    });
    await updateAccountBalance(acc._id, newBalanceCipher);
    newBalanceValue = newBalance;
  }

  if (newStatus) {
    const col = await accountsCollection();
    await col.updateOne(
      { _id: acc._id },
      { $set: { status: newStatus, updated_at: new Date() } }
    );
  }

  await writeAuditLog({
    actorUserId: adminSupabaseId,
    action: 'ADMIN_UPDATE_ACCOUNT',
    entity: 'account',
    entityId: acc._id.toHexString(),
    metadata: {
      reason,
      oldBalance,
      newBalance: newBalanceValue,
      oldStatus: acc.status,
      newStatus,
    },
    createdAt: new Date(),
  });
}

export async function adminDeleteAccount(id: string) {
  const col = await accountsCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
}