import admin from 'firebase-admin';
import { config } from '../../config.js';
import { logger } from '../../logger.js';
import type { PushPayload } from '../../types.js';

let initialized = false;

const ensureFirebase = () => {
  if (initialized) return;
  const serviceAccount = JSON.parse(config.firebaseServiceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
  logger.info({ msg: 'Firebase Admin initialized' });
};

export const sendFcm = async (token: string, payload: PushPayload) => {
  ensureFirebase();
  const message: admin.messaging.Message = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
    data: payload.data || {},
  };

  const result = await admin.messaging().send(message);
  return result;
};
