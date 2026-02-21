// src/controllers/admin.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { adminDeleteAccount, adminGetAccount, adminListAccounts, adminUpdateAccount, getAuditLogs } from '../services/admin.service';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: 'dev' | 'admin';
    supabaseUserId?: string;
  }
}

export async function listAuditLogsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId || request.userRole !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const limitParam = (request.query as any)?.limit;
  const limit = limitParam ? Number(limitParam) : 200;

  try {
    const logs = await getAuditLogs(limit);
    return reply.send({ logs });
  } catch (err) {
    request.log.error({ err }, 'Failed to list audit logs');
    return reply.status(500).send({ error: 'Erro ao carregar logs' });
  }
}

export async function listAccountsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // opcional: reforçar admin aqui também, se quiser
  if (!request.userId || request.userRole !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const accounts = await adminListAccounts();
  return reply.send({ accounts });
}

export async function getAccountHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId || request.userRole !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { id } = request.params as { id: string };
  const account = await adminGetAccount(id);
  if (!account) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return reply.send({ account });
}

export async function updateAccountHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId || request.userRole !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { id } = request.params as { id: string };
  const body = request.body as {
    new_balance?: number;
    status?: 'active' | 'blocked';
    reason: string;
  };

  if (!body.reason) {
    return reply.code(400).send({ error: 'reason is required' });
  }

  await adminUpdateAccount({
    adminSupabaseId: request.supabaseUserId!,
    accountId: id,
    newBalance: body.new_balance,
    newStatus: body.status,
    reason: body.reason,
  });

  return reply.send({ ok: true });
}

export async function deleteAccountHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId || request.userRole !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { id } = request.params as { id: string };

  await adminDeleteAccount(id);

  return reply.status(204).send();
}