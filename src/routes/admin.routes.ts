// src/routes/admin.routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  deleteAccountHandler,
  getAccountHandler,
  listAccountsHandler,
  listAuditLogsHandler,
  updateAccountHandler,
} from '../controllers/admin.controller';


async function ensureAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.userRole !== 'admin') {
    return reply.code(403).send({ error: 'Forbidden' });
  }
}

export default async function adminRoutes(app: FastifyInstance) {
  app.get(
    '/admin/audit-logs',
    { preHandler: [app.authGuard, ensureAdmin] },
    listAuditLogsHandler
  );

  app.get(
    '/admin/accounts',
    { preHandler: [app.authGuard, ensureAdmin] },
    listAccountsHandler
  );

  app.get(
    '/admin/accounts/:id',
    { preHandler: [app.authGuard, ensureAdmin] },
    getAccountHandler
  );

  app.patch(
    '/admin/accounts/:id',
    { preHandler: [app.authGuard, ensureAdmin] },
    updateAccountHandler
  );

  app.delete(
    '/admin/accounts/:id',
    { preHandler: [app.authGuard, ensureAdmin] },
    deleteAccountHandler
  );
}