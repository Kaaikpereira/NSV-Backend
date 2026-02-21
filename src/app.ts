import Fastify from 'fastify';
import cors from '@fastify/cors'; // <— adiciona isso

import recordsRoutes from './routes/records.routes';
import authRoutes from './routes/auth.routes';
import authGuardPlugin from './middleware/authGuard';
import transactionsRoutes from './routes/transactions.routes';
import userRoutes from './routes/users.routes';
import adminRoutes from './routes/admin.routes';
import { meAvatarRoutes } from './routes/avatar.routes';
import nixRoutes from './routes/nix.routes';
import { accountsRoutes } from './routes/accounts.routes';
import { securityRoutes } from './routes/security.routes';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS – precisa vir antes das rotas
 await app.register(cors, {
   origin: [
    'http://localhost:8080',
    'http://192.168.0.72:8080',
    'http://172.28.99.210:8080'
  ], // ou true em dev
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // se precisar
})

  // opcional, mas ajuda se ainda der 404 no OPTIONS
  //app.options('/*', async (req, reply) => {
   // reply.code(204).send();
  //});

  // auth guard
  await app.register(authGuardPlugin);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.register(recordsRoutes, { prefix: '/records' });
  app.register(authRoutes, { prefix: '/api' });
  app.register(transactionsRoutes, { prefix: '/api' });
  app.register(nixRoutes, { prefix: "/api" });
  app.register(userRoutes, { prefix: "/api" });
  app.register(adminRoutes, { prefix: '/api' });
  app.register(meAvatarRoutes, { prefix: '/api' });
  app.register(accountsRoutes, { prefix: '/api' });
  app.register(securityRoutes, { prefix: "/api" });


  // depois de todos os app.register(...)
  app.ready((err: unknown) => {
    if (err) {
      app.log.error(err);
      return;
    }
    app.log.info(app.printRoutes());
  });

  return app;
}
