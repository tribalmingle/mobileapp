import dotenv from 'dotenv';

dotenv.config();

const must = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT || 3001),
  mongoUri: must(process.env.MONGODB_URI, 'MONGODB_URI'),
  redisUrl: must(process.env.REDIS_URL, 'REDIS_URL'),
  firebaseServiceAccountJson: must(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'FIREBASE_SERVICE_ACCOUNT_JSON'),
  apnsKeyPath: must(process.env.APNS_KEY_PATH, 'APNS_KEY_PATH'),
  apnsKeyId: must(process.env.APNS_KEY_ID, 'APNS_KEY_ID'),
  apnsTeamId: must(process.env.APNS_TEAM_ID, 'APNS_TEAM_ID'),
  apnsBundleId: must(process.env.APNS_BUNDLE_ID, 'APNS_BUNDLE_ID'),
  apnsProduction: process.env.APNS_PRODUCTION !== 'false',
};
