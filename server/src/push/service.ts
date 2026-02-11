import { getTokensForUser, disableDeviceToken } from '../db.js';
import { logger } from '../logger.js';
import type { PushPayload } from '../types.js';
import { sendFcm } from './providers/fcm.js';
import { sendApns } from './providers/apns.js';

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  const tokens = await getTokensForUser(userId);
  if (!tokens.length) {
    logger.info({ msg: 'No device tokens for user', userId });
    return { sent: 0 };
  }

  let sent = 0;

  for (const tokenRecord of tokens) {
    try {
      if (tokenRecord.tokenType === 'fcm') {
        await sendFcm(tokenRecord.deviceToken, payload);
        sent += 1;
      } else if (tokenRecord.tokenType === 'apns') {
        const response = await sendApns(tokenRecord.deviceToken, payload);
        if (response.failed?.length) {
          const failure = response.failed[0];
          const status = (failure.status || 0) as number;
          if (status === 410 || status === 400) {
            await disableDeviceToken(tokenRecord.deviceToken);
            logger.warn({ msg: 'APNs token invalidated', token: tokenRecord.deviceToken, status });
          }
        } else {
          sent += 1;
        }
      }
    } catch (error: any) {
      const code = error?.code || error?.errorInfo?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument') {
        await disableDeviceToken(tokenRecord.deviceToken);
        logger.warn({ msg: 'FCM token invalidated', token: tokenRecord.deviceToken, code });
        continue;
      }
      logger.error({ msg: 'Push send failed', error: String(error), userId, tokenType: tokenRecord.tokenType });
      throw error;
    }
  }

  return { sent };
};
