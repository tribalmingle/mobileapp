import { MongoClient } from 'mongodb';
import { config } from './config.js';
import { logger } from './logger.js';
import type { DeviceTokenRecord } from './types.js';

let client: MongoClient | null = null;

export const connectDb = async () => {
  if (client) return client;
  client = new MongoClient(config.mongoUri);
  await client.connect();
  logger.info({ msg: 'MongoDB connected' });
  return client;
};

const getCollection = async () => {
  const conn = await connectDb();
  return conn.db().collection<DeviceTokenRecord>('device_tokens');
};

export const upsertDeviceToken = async (record: DeviceTokenRecord) => {
  const collection = await getCollection();
  await collection.updateOne(
    { userId: record.userId, deviceToken: record.deviceToken },
    { $set: { ...record, updatedAt: new Date().toISOString(), enabled: true } },
    { upsert: true }
  );
};

export const disableDeviceToken = async (deviceToken: string) => {
  const collection = await getCollection();
  await collection.updateOne(
    { deviceToken },
    { $set: { enabled: false, updatedAt: new Date().toISOString() } }
  );
};

export const getTokensForUser = async (userId: string) => {
  const collection = await getCollection();
  return collection.find({ userId, enabled: true }).toArray();
};
