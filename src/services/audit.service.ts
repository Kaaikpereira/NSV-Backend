// src/services/audit.service.ts
import { insertAuditLog } from '../model/audit-log.model'
import type { AuditAction, AuditEntity } from '../types/audit-log'

export async function audit(
  params: {
    actorUserId: string
    action: AuditAction
    entity: AuditEntity
    entityId: string
    metadata?: Record<string, any>
  }
) {
  await insertAuditLog({
    actorUserId: params.actorUserId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    metadata: params.metadata,
    createdAt: new Date(),
  })
}