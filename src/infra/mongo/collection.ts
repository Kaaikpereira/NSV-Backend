// src/infra/mongo/collections.ts
import type { Collection, Document } from 'mongodb';
import { getDb } from './client';

export async function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
