// src/controllers/records.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { listRecords, createRecord, getRecord } from '../services/records.service';

export async function listRecordsHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.userId!;
  const records = await listRecords(userId);
  return reply.send(records);
}

export async function createRecordHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.userId!;
  const body = req.body as any;
  const record = await createRecord(userId, body);
  return reply.code(201).send(record);
}

export async function getRecordHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.userId!;
  const { id } = req.params as { id: string };
  const record = await getRecord(userId, id);

  if (!record) {
    return reply.code(404).send({ message: 'Record not found' });
  }

  return reply.send(record);
}