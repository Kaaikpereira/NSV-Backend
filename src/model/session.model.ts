// src/model/session.model.ts
import { getCollection } from "../infra/mongo/collection";
import { ObjectId } from "mongodb";
import { encryptContext } from "../sna/sna456";

const COLLECTION_NAME = "sessions";

export interface Session {
  _id: ObjectId;
  user_id: ObjectId;
  supabase_user_id: string;
  device_id: string;
  device_name: string;
  user_agent: string;
  ip: string | null;
  created_at: Date;
  last_seen_at: Date;
  revoked_at?: Date | null;
  token_cipher?: {
    algorithm: string;
    data: string;
  };
}

export async function sessionsCollection() {
  return getCollection<Session>(COLLECTION_NAME);
}

export async function createOrUpdateSession(params: {
  userId: ObjectId;
  supabaseUserId: string;
  deviceId: string;
  deviceName: string;
  userAgent: string;
  ip: string | null;
  token: string;
}): Promise<Session> {
  const col = await sessionsCollection();
  const now = new Date();

  const ctx = {
    userId: params.supabaseUserId,
    type: "session",
    recordId: params.userId.toHexString(),
  };

  const token_cipher = await encryptContext(ctx, { token: params.token });

  const existing = await col.findOne({
    supabase_user_id: params.supabaseUserId,
    device_id: params.deviceId,
    revoked_at: { $exists: false },
  });

  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          last_seen_at: now,
          user_agent: params.userAgent,
          ip: params.ip,
          token_cipher,
        },
      }
    );

    return {
      ...existing,
      last_seen_at: now,
      user_agent: params.userAgent,
      ip: params.ip,
      token_cipher,
    } as Session;
  }

  const session: Session = {
    _id: new ObjectId(),
    user_id: params.userId,
    supabase_user_id: params.supabaseUserId,
    device_id: params.deviceId,
    device_name: params.deviceName,
    user_agent: params.userAgent,
    ip: params.ip,
    created_at: now,
    last_seen_at: now,
    token_cipher,
  };

  await col.insertOne(session);
  return session;
}

export async function listSessionsForUser(
  supabaseUserId: string
): Promise<Session[]> {
  const col = await sessionsCollection();
  return col
    .find({
      supabase_user_id: supabaseUserId,
      revoked_at: { $exists: false },
    })
    .sort({ last_seen_at: -1 })
    .toArray();
}

export async function revokeSession(
  sessionId: string,
  supabaseUserId: string
): Promise<void> {
  const col = await sessionsCollection();
  await col.updateOne(
    { _id: new ObjectId(sessionId), supabase_user_id: supabaseUserId },
    { $set: { revoked_at: new Date() } }
  );
}