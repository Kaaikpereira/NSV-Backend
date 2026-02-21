import { ObjectId } from "mongodb";
import { getCollection } from "../infra/mongo/collection";
import type { User } from "../types/user";
import { encryptContext } from "../sna/sna456";

const COLLECTION_NAME = "users";

export async function usersCollection() {
  return getCollection<User>(COLLECTION_NAME);
}

export async function findUserByMongoId(id: ObjectId): Promise<User | null> {
  const col = await usersCollection();
  return col.findOne({ _id: id });
}

export async function createUser(data: {
  supabaseUserId: string;
  email: string | null;
  displayName: string | null;
}): Promise<User> {
  const col = await usersCollection();

  const contextBase = {
    userId: data.supabaseUserId,
    type: "user",
  };

  const email_cipher = data.email
    ? await encryptContext(contextBase, { email: data.email })
    : null;

  const display_name_cipher = data.displayName
    ? await encryptContext(contextBase, { display_name: data.displayName })
    : null;

  const user: User = {
    _id: new ObjectId(),
    supabase_user_id: data.supabaseUserId,
    email_cipher,
    display_name_cipher,
    role: "tester",
    status: "active",
    nsv_account_id: null,
    sna_subject_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  await col.insertOne(user);
  return user;
}

export async function updateUserById(
  id: ObjectId,
  updates: Partial<User>
): Promise<void> {
  const col = await usersCollection();
  await col.updateOne(
    { _id: id },
    { $set: { ...updates, updated_at: new Date() } }
  );
}

export async function findUserBySupabaseId(
  supabaseUserId: string
): Promise<User | null> {
  const col = await usersCollection();
  return col.findOne({ supabase_user_id: supabaseUserId });
}