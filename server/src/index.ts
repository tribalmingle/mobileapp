import express from 'express';
import { config } from './config.js';
import { logger } from './logger.js';
import { startPushWorker } from './push/queue.js';
import tokensRouter from './routes/tokens.js';
import eventsRouter from './routes/events.js';
import healthRouter from './routes/health.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(healthRouter);
app.use(tokensRouter);
app.use(eventsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ msg: 'Unhandled error', error: String(err) });
  res.status(500).json({ error: 'Internal server error' });
});

startPushWorker();

app.listen(config.port, () => {
  logger.info({ msg: 'Push service listening', port: config.port });
});
