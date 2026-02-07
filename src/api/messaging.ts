import apiClient, { isDemoMode } from './client';

export type Participant = {
  id: string;
  name: string;
  photo?: string;
  isOnline?: boolean;
  lastActive?: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId?: string;
  content: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
};

export type Thread = {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt?: string;
};

export interface ThreadsResponse {
  threads: Thread[];
}

export interface ThreadMessagesResponse {
  thread: Thread;
  messages: Message[];
}

type ThreadMessagesParams = {
  page?: number;
  limit?: number;
};

const pickId = (value: any): string | undefined =>
  value?._id || value?.id || value?.userId || value?.uid || value?.email || value?.profileId;

const normalizeParticipant = (raw: any): Participant => ({
  id: pickId(raw) || '',
  name: raw?.name || raw?.fullName || raw?.username || raw?.displayName || 'Member',
  photo:
    raw?.photo || raw?.avatar || raw?.image || raw?.profilePhoto || raw?.profileImage || raw?.profileImageUrl || undefined,
  isOnline: raw?.isOnline ?? raw?.is_online ?? raw?.online ?? undefined,
  lastActive: raw?.lastActive || raw?.last_active || raw?.lastSeen || raw?.last_seen || undefined,
});

const normalizeMessage = (raw: any): Message => ({
  id: pickId(raw) || `local-${Date.now()}`,
  senderId: pickId(raw?.sender) || raw?.senderId || raw?.from || 'unknown',
  receiverId: pickId(raw?.receiver) || raw?.receiverId || raw?.to,
  content: raw?.content ?? raw?.message ?? raw?.text ?? '',
  createdAt: raw?.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  status: (raw?.status as Message['status']) || undefined,
});

const normalizeThread = (raw: any): Thread => {
  const participantSource = Array.isArray(raw?.participants)
    ? raw.participants
    : raw?.user
      ? [raw.user]
      : raw?.userId || raw?.email
        ? [{ id: raw.userId || raw.email, name: raw.name, photo: raw.avatar }]
        : [];

  const participants = participantSource.map(normalizeParticipant).filter((p: Participant) => p.id);

  const lastRaw = raw?.lastMessage || raw?.last_message || raw?.recentMessage || raw?.recent_message;
  const lastMessage = lastRaw
    ? normalizeMessage(lastRaw)
    : raw?.lastMessage
      ? {
          id: `last-${pickId(raw) || raw?.userId || Date.now()}`,
          senderId: raw?.senderId || raw?.sender || raw?.userId || 'unknown',
          receiverId: raw?.receiverId || raw?.recipientId,
          content: raw.lastMessage,
          createdAt: raw?.lastMessageAt || raw?.updatedAt || new Date().toISOString(),
        }
      : undefined;

  return {
    id: pickId(raw) || raw?.threadId || raw?.conversationId || raw?.userId || `thread-${Date.now()}`,
    participants,
    lastMessage,
    unreadCount: raw?.unreadCount ?? raw?.unread ?? raw?.unreadMessages ?? 0,
    updatedAt: raw?.updatedAt || raw?.lastMessageAt || raw?.lastMessageTimestamp || lastMessage?.createdAt,
  };
};

const extractThreads = (payload: any): any[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.threads)) return payload.threads;
  if (Array.isArray(payload?.conversations)) return payload.conversations;
  if (Array.isArray(payload?.data?.threads)) return payload.data.threads;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const fetchThreads = async (): Promise<Thread[]> => {
  try {
    const { data } = await apiClient.get<ThreadsResponse | any>('/messages/conversations');
    const rawThreads = extractThreads(data);
    if (rawThreads.length) {
      return rawThreads.map(normalizeThread).filter((thread) => thread.id);
    }
  } catch (error) {
    console.warn('fetchThreads failed, falling back to demo', error);
  }
  return [];
};

// Direct messaging (email/userId based) fallback
export const fetchDirectMessages = async (
  userId: string,
  { page = 1, limit = 30 }: ThreadMessagesParams = {}
): Promise<Message[]> => {
  try {
    const { data } = await apiClient.get<{ success: boolean; messages?: any[] }>(`/messages/${userId}`, {
      params: { page, limit },
    });
    if (Array.isArray(data?.messages)) {
      return data.messages.map(normalizeMessage);
    }
  } catch (error) {
    console.warn('fetchDirectMessages failed, using demo', error);
  }
  return [];
};

export const fetchThreadMessages = async (
  threadId: string,
  { page = 1, limit = 30 }: ThreadMessagesParams = {}
): Promise<ThreadMessagesResponse> => {
  try {
    const { data } = await apiClient.get<{ messages?: any[]; success?: boolean } | any>(`/messages/${threadId}`, {
      params: { page, limit },
    });
    const messagesPayload = data?.messages || data?.data || [];

    if (Array.isArray(messagesPayload)) {
      return {
        thread: normalizeThread({ id: threadId }),
        messages: messagesPayload.map(normalizeMessage),
      };
    }
  } catch (error) {
    console.warn('fetchThreadMessages failed, using demo', error);
  }
  return { thread: { id: threadId, participants: [] }, messages: [] };
};

export const sendMessage = async (threadId: string, content: string): Promise<Message> => {
  return sendDirectMessage(threadId, content);
};

export const sendDirectMessage = async (userId: string, content: string): Promise<Message> => {
  const { data } = await apiClient.post<{ success: boolean; messageId?: string }>(`/messages/send`, {
    receiverId: userId,
    message: content,
  });
  const now = new Date().toISOString();
  return {
    id: data?.messageId || `local-${Date.now()}`,
    senderId: 'me',
    receiverId: userId,
    content,
    createdAt: now,
    status: 'sent',
  };
};

export const sendTypingStatus = async (threadId: string, isTyping: boolean) => {
  if (isDemoMode()) return { ok: true };
  try {
    // Send both isTyping and typing to cover backend variations.
    const { data } = await apiClient.post(`/messages/threads/${threadId}/typing`, { isTyping, typing: isTyping });
    return data || { ok: true };
  } catch (error) {
    console.warn('sendTypingStatus failed', error);
    return { ok: false };
  }
};

const normalizeTypingList = (payload: any): string[] => {
  if (!payload) return [];
  const candidate =
    payload.typing ??
    payload.users ??
    payload.typingUsers ??
    payload.userIds ??
    payload.data?.typing ??
    payload.data?.users;

  if (Array.isArray(candidate)) {
    return candidate.map((v) => (typeof v === 'string' ? v : v?.id || v?.userId)).filter(Boolean) as string[];
  }

  if (candidate && typeof candidate === 'object') {
    return Object.values(candidate)
      .map((v) => (typeof v === 'string' ? v : (v as any)?.id || (v as any)?.userId))
      .filter(Boolean) as string[];
  }

  return [];
};

export const fetchTypingStatus = async (threadId: string): Promise<string[]> => {
  if (isDemoMode()) return [];
  try {
    const { data } = await apiClient.get<unknown>(`/messages/threads/${threadId}/typing`);
    return normalizeTypingList(data);
  } catch (error) {
    return [];
  }
};

export const markThreadRead = async (threadId: string) => {
  if (isDemoMode()) return { ok: true };
  try {
    const { data } = await apiClient.post(`/messages/threads/${threadId}/read`);
    return data || { ok: true };
  } catch (error) {
    console.warn('markThreadRead failed', error);
    return { ok: false };
  }
};

export const reportThread = async (threadId: string, reason: string) => {
  if (isDemoMode()) return { ok: true };
  try {
    const { data } = await apiClient.post(`/messages/threads/${threadId}/report`, { reason });
    return data || { ok: true };
  } catch (error) {
    console.warn('reportThread failed', error);
    throw error;
  }
};

export const blockUser = async (userId: string) => {
  if (isDemoMode()) return { ok: true };
  try {
    const { data } = await apiClient.post('/safety/block', { userId });
    return data || { ok: true };
  } catch (error) {
    console.warn('blockUser failed', error);
    throw error;
  }
};

