import { Router } from 'express';
import { z } from 'zod';
import { enqueuePush } from '../push/queue.js';

const router = Router();

const baseSchema = z.object({
  recipientUserId: z.string().min(1),
  senderUserId: z.string().min(1),
  senderName: z.string().min(1),
});

router.post('/events/like', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const { recipientUserId, senderUserId, senderName } = parsed.data;
  await enqueuePush({
    userId: recipientUserId,
    payload: {
      title: 'New like',
      body: `${senderName} liked your profile`,
      data: {
        type: 'like',
        senderUserId,
        deepLink: '/(tabs)/matches',
      },
    },
  });

  return res.json({ ok: true });
});

router.post('/events/match', async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const { recipientUserId, senderUserId, senderName } = parsed.data;
  await enqueuePush({
    userId: recipientUserId,
    payload: {
      title: 'It’s a match',
      body: `You and ${senderName} matched`,
      data: {
        type: 'match',
        senderUserId,
        deepLink: '/(tabs)/matches',
      },
    },
  });

  return res.json({ ok: true });
});

const messageSchema = baseSchema.extend({
  threadId: z.string().min(1),
  messagePreview: z.string().min(1),
});

router.post('/events/message', async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const { recipientUserId, senderUserId, senderName, threadId, messagePreview } = parsed.data;
  await enqueuePush({
    userId: recipientUserId,
    payload: {
      title: senderName,
      body: messagePreview,
      data: {
        type: 'message',
        threadId,
        senderUserId,
        deepLink: `/(tabs)/chat/[id]?id=${encodeURIComponent(threadId)}`,
      },
    },
  });

  return res.json({ ok: true });
});

export default router;
