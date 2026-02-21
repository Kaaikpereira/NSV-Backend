// src/types/audit-log.ts
import { ObjectId } from 'mongodb'

export type AuditEntity =
  | 'user'
  | 'account'
  | 'transaction'
  | 'transfer'
  | 'record'

export type AuditAction =
  | 'USER_LOGIN'
  | 'LOGIN_FAILED'
  | 'USER_REGISTER'
  | 'UPDATE_DISPLAY_NAME'

  | 'CREATE_ACCOUNT'
  | 'UPDATE_ACCOUNT_STATUS'

  | 'CREATE_TRANSACTION'
  | 'TRANSFER_NIX'


  | 'PURCHASE_ITEM'
  | 'PAYMENT_NSV'

  | 'ADMIN_UPDATE_ACCOUNT'


export interface AuditLog {
  _id: ObjectId
  actorUserId: string          // supabase user id
  action: AuditAction
  entity: AuditEntity
  entityId: string             // id lógico
  metadata?: Record<string, any>
  createdAt: Date
}
