import { Router } from 'express';
import { z } from 'zod';
import { upsertDeviceToken, disableDeviceToken } from '../db.js';
import { logger } from '../logger.js';

const router = Router();

const tokenSchema = z.object({
  userId: z.string().min(1),
  deviceToken: z.string().min(1),
  tokenType: z.enum(['fcm', 'apns']),
  platform: z.string().min(1),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
});

router.post('/notifications/device-token', async (req, res) => {
  const parsed = tokenSchema.safeParse({
    ...req.body,
    userId: req.body?.userId || req.header('x-user-id'),
  });

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const record = {
    ...parsed.data,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };

  await upsertDeviceToken(record);
  logger.info({ msg: 'Device token upserted', userId: record.userId, tokenType: record.tokenType });
  return res.json({ ok: true });
});

router.delete('/notifications/device-token', async (req, res) => {
  const token = req.body?.deviceToken || req.query?.deviceToken;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'deviceToken required' });
  }
  await disableDeviceToken(token);
  return res.json({ ok: true });
});

export default router;
