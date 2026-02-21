// src/model/audit.model.ts
import { ObjectId } from "mongodb";
import { getCollection } from "../infra/mongo/collection";
import type { AuditLog } from "../types/audit-log";

const COLLECTION_NAME = "audit_logs";

async function auditCollection() {
  return getCollection<AuditLog>(COLLECTION_NAME);
}

export async function writeAuditLog(log: Omit<AuditLog, "_id">) {
  const col = await auditCollection();
  await col.insertOne({
    _id: new ObjectId().toHexString(),
    ...log,
  });
}