// src/routes/records.routes.ts
import { FastifyInstance } from 'fastify';
import {
  listRecordsHandler,
  createRecordHandler,
  getRecordHandler,
} from '../controllers/records.controller';

export default async function recordsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [app.authGuard] },
    listRecordsHandler
  );

  app.post(
    '/',
    { preHandler: [app.authGuard] },
    createRecordHandler
  );

  app.get(
    '/:id',
    { preHandler: [app.authGuard] },
    getRecordHandler
  );
}