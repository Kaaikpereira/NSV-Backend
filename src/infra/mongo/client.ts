// src/infra/mongo/client.ts
import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nsv';
const dbName = process.env.MONGO_DB_NAME || 'nsv';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  try {
    client = await MongoClient.connect(mongoUri);
    db = client.db(dbName);
    console.log('MongoDB connected:', mongoUri, dbName);
    return db;
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message || err);
    if (client) {
      try {
        await client.close();
      } catch {}
      client = null;
    }
    throw err;
  }
}

export async function getDb(): Promise<Db> {
  return connectMongo();
}
