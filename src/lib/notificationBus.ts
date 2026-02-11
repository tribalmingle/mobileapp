export type PushEventPayload = {
  type?: string;
  [key: string]: unknown;
};

type Listener = (payload: PushEventPayload) => void;

const listeners = new Set<Listener>();

export const onPushEvent = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitPushEvent = (payload: PushEventPayload) => {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.warn('Push event listener failed', error);
    }
  });
};
