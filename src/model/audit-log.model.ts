// src/model/audit-log.model.ts
import { getCollection } from '../infra/mongo/collection'
import type { AuditLog } from '../types/audit-log'

async function auditLogsCollection() {
  return getCollection<AuditLog>('audit_logs')
}

export async function insertAuditLog(log: Omit<AuditLog, '_id'>) {
  const col = await auditLogsCollection()
  await col.insertOne(log as any)
}

export async function listAuditLogs(limit = 200) {
  const col = await auditLogsCollection()
  return col
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}