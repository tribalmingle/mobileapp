export type TokenType = 'fcm' | 'apns';

export type DeviceTokenRecord = {
  userId: string;
  deviceToken: string;
  tokenType: TokenType;
  platform: string;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  enabled: boolean;
  updatedAt: string;
};

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushJob = {
  userId: string;
  payload: PushPayload;
};
