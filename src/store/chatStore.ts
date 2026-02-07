import { create } from 'zustand';

type ChatStore = {
  unreadCount: number;
  threadCounts: Record<string, number>;
  /** Thread IDs the user has opened locally but the API may not have caught up yet */
  locallyReadIds: string[];
  setUnreadCount: (count: number) => void;
  setThreadUnread: (threadId: string, count: number) => void;
  incrementUnread: (threadId?: string) => void;
  markThreadRead: (threadId: string) => void;
  /** Sync unread counts from fetched threads, respecting locally-read state */
  syncFromThreads: (threads: Array<{ id: string; unreadCount?: number }>) => void;
  clearAll: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  unreadCount: 0,
  threadCounts: {},
  locallyReadIds: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  setThreadUnread: (threadId, count) => {
    const { threadCounts } = get();
    const newCounts = { ...threadCounts, [threadId]: count };
    const total = Object.values(newCounts).reduce((sum, n) => sum + n, 0);
    set({ threadCounts: newCounts, unreadCount: total });
  },
  incrementUnread: (threadId) => {
    const { threadCounts, unreadCount } = get();
    if (threadId) {
      const current = threadCounts[threadId] || 0;
      const newCounts = { ...threadCounts, [threadId]: current + 1 };
      set({ threadCounts: newCounts, unreadCount: unreadCount + 1 });
    } else {
      set({ unreadCount: unreadCount + 1 });
    }
  },
  markThreadRead: (threadId) => {
    const { threadCounts, unreadCount, locallyReadIds } = get();
    const threadUnread = threadCounts[threadId] || 0;
    const newCounts = { ...threadCounts, [threadId]: 0 };
    // Add to locallyReadIds so polling won't overwrite
    const newReadIds = locallyReadIds.includes(threadId)
      ? locallyReadIds
      : [...locallyReadIds, threadId];
    set({
      threadCounts: newCounts,
      unreadCount: Math.max(0, unreadCount - threadUnread),
      locallyReadIds: newReadIds,
    });
  },
  syncFromThreads: (threads) => {
    const { locallyReadIds } = get();
    const newCounts: Record<string, number> = {};
    const confirmedReadIds: string[] = [];

    for (const thread of threads) {
      const apiUnread = thread.unreadCount || 0;
      if (locallyReadIds.includes(thread.id)) {
        // Thread was locally marked as read
        if (apiUnread === 0) {
          // API confirmed it's read — remove from locallyReadIds
          confirmedReadIds.push(thread.id);
        }
        // Always treat as 0 until API catches up
        newCounts[thread.id] = 0;
      } else {
        newCounts[thread.id] = apiUnread;
      }
    }

    const total = Object.values(newCounts).reduce((sum, n) => sum + n, 0);
    const updatedReadIds = locallyReadIds.filter((id) => !confirmedReadIds.includes(id));
    set({ threadCounts: newCounts, unreadCount: total, locallyReadIds: updatedReadIds });
  },
  clearAll: () => set({ unreadCount: 0, threadCounts: {}, locallyReadIds: [] }),
}));
