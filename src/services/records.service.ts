// src/services/records.service.ts
import { ObjectId } from 'mongodb';
import { getRecordsCollection } from '../infra/mongo/client';
import { encryptContext, decryptContext, CipherPayload } from '../sna/sna456';

type CreateRecordInput = {
  title: string;
  type: string;
  payload: any;
};

export async function listRecords(userId: string) {
  const collection = await getRecordsCollection();

  const docs = await collection
    .find({ userId })
    .project({ title: 1, type: 1, createdAt: 1 })
    .toArray();

  return docs.map(doc => ({
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    createdAt: doc.createdAt,
  }));
}

export async function getRecord(userId: string, id: string) {
  const collection = await getRecordsCollection();

  const doc = await collection.findOne({
    _id: new ObjectId(id),
    userId,
  });

  if (!doc) return null;

  const context = {
    userId: doc.userId as string,
    type: doc.type as string,
    recordId: doc._id.toString(),
  };

  const payload = await decryptContext(context, doc.cipher as CipherPayload);

  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    payload,
    createdAt: doc.createdAt,
  };
}

export async function createRecord(userId: string, input: CreateRecordInput) {
  const collection = await getRecordsCollection();

  const tempId = new ObjectId(); // já gera ID para usar no contexto

  const context = {
    userId,
    type: input.type,
    recordId: tempId.toString(),
  };

  const cipher = await encryptContext(context, input.payload);

  const now = new Date();

  const result = await collection.insertOne({
    _id: tempId,
    userId,
    title: input.title,
    type: input.type,
    cipher,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: result.insertedId.toString(),
    title: input.title,
    type: input.type,
    createdAt: now,
  };
}