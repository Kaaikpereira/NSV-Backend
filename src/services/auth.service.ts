// src/services/auth.service.ts
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ObjectId } from "mongodb";
import { createUser, findUserBySupabaseId, updateUserById } from "../model/user.model";
import { createNsvAccountForUser } from "../model/account.model";
import type { User } from "../types/user";
import type { Account } from "../types/account";
import { decryptContext } from "../sna/sna456";

export interface MeResponse {
  user: {
    id: string;
    email: string | null;
    display_name: string | null;
    role: string;
  };
  account: {
    id: string;
    balance: number;
    currency: string;
    status: string;
    account_display?: string | null; 
  } | null;
}

export async function getOrCreateUserWithAccount(
  supabaseUser: SupabaseUser
): Promise<MeResponse> {
  const supabaseUserId = supabaseUser.id;
  const email = supabaseUser.email ?? null;
  const displayName =
    (supabaseUser.user_metadata as any)?.name ??
    (supabaseUser.user_metadata as any)?.full_name ??
    email;

  let userDoc = await findUserBySupabaseId(supabaseUserId);

  if (!userDoc) {
    userDoc = await createUser({
      supabaseUserId,
      email,
      displayName,
    });

    const accountDoc = await createNsvAccountForUser(userDoc._id, supabaseUserId);
    await updateUserById(userDoc._id, { nsv_account_id: accountDoc._id });

    return {
      user: await mapUserForResponse(userDoc, supabaseUserId),
      account: await mapAccountForResponse(accountDoc, supabaseUserId),
    };
  }

  let accountDoc: Account | null = null;
  if (userDoc.nsv_account_id) {
    const { findAccountById } = await import("../model/account.model");
    accountDoc = await findAccountById(userDoc.nsv_account_id as ObjectId);
  }

  return {
    user: await mapUserForResponse(userDoc, supabaseUserId),
    account: accountDoc
      ? await mapAccountForResponse(accountDoc, supabaseUserId)
      : null,
  };
}

export async function mapUserForResponse(user: User, supabaseUserId: string) {
  const context = { userId: supabaseUserId, type: "user" };

  let email: string | null = null;
  if (user.email_cipher) {
    const payload: any = await decryptContext(context, user.email_cipher);
    email = payload.email ?? null;
  }

  let display_name: string | null = null;
  if (user.display_name_cipher) {
    const payload: any = await decryptContext(context, user.display_name_cipher);
    display_name = payload.display_name ?? null;
  }

  return {
    id: user._id.toHexString(),
    email,
    display_name,
    role: user.role,
  };
}

async function mapAccountForResponse(account: Account, supabaseUserId: string) {
  const context = {
    userId: supabaseUserId,
    type: "account",
    recordId: account.user_id.toHexString(),
  };

  // saldo
  const balancePayload: any = await decryptContext(context, account.balance_cipher);
  const balance = balancePayload.balance ?? 0;

  // NOVO: conta exibida
  let account_display: string | null = null;
  if (account.account_display_cipher) {
    const displayPayload: any = await decryptContext(
      context,
      account.account_display_cipher
    );
    // como você cifrou só a string, o decrypt volta ela direta
    account_display =
      typeof displayPayload === "string"
        ? displayPayload
        : displayPayload.account_display ?? null;
  }

  return {
    id: account._id.toHexString(),
    balance,
    currency: account.currency,
    status: account.status,
    account_display, // <- campo novo
  };
}