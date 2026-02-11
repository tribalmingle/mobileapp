import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { PushJob } from '../types.js';
import { sendPushToUser } from './service.js';

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

export const pushQueue = new Queue<PushJob>('push-queue', { connection });

export const enqueuePush = async (job: PushJob) => {
  await pushQueue.add('send', job, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
};

export const startPushWorker = () => {
  const worker = new Worker<PushJob>(
    'push-queue',
    async (job) => {
      const { userId, payload } = job.data;
      logger.info({ msg: 'Sending push', userId, title: payload.title });
      await sendPushToUser(userId, payload);
    },
    { connection }
  );

  worker.on('failed', (job, error) => {
    logger.error({ msg: 'Push job failed', jobId: job?.id, error: String(error) });
  });

  worker.on('completed', (job) => {
    logger.info({ msg: 'Push job completed', jobId: job.id });
  });
};
