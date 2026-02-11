import apn from 'apn';
import { config } from '../../config.js';
import { logger } from '../../logger.js';
import type { PushPayload } from '../../types.js';

let provider: apn.Provider | null = null;

const ensureApns = () => {
  if (provider) return provider;
  provider = new apn.Provider({
    token: {
      key: config.apnsKeyPath,
      keyId: config.apnsKeyId,
      teamId: config.apnsTeamId,
    },
    production: config.apnsProduction,
  });
  logger.info({ msg: 'APNs provider initialized', production: config.apnsProduction });
  return provider;
};

export const sendApns = async (token: string, payload: PushPayload) => {
  const apnsProvider = ensureApns();
  const note = new apn.Notification();
  note.topic = config.apnsBundleId;
  note.alert = {
    title: payload.title,
    body: payload.body,
  };
  note.sound = 'default';
  note.payload = payload.data || {};
  note.pushType = 'alert';
  note.priority = 10;

  const response = await apnsProvider.send(note, token);
  return response;
};
