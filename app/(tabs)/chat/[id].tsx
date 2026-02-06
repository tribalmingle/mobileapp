import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
  fetchThreadMessages,
  fetchDirectMessages,
  Message,
  sendMessage,
  sendDirectMessage,
  markThreadRead,
  Thread,
  blockUser,
  reportThread,
  fetchTypingStatus,
  sendTypingStatus,
} from '@/api/messaging';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

const normalizeId = (value?: string | null) => (value ? String(value).toLowerCase() : '');

export default function ThreadScreen() {
  const router = useRouter();
  const { id, name: nameParam, avatar } = useLocalSearchParams<{ id: string; name?: string; avatar?: string }>();
  const { user } = useAuthStore();

  const currentUserId = useMemo(
    () => user?._id || user?.id || (user as any)?.userId || (user as any)?.uid || (user as any)?.email || (user as any)?.profileId,
    [user]
  );

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'info' | 'success' | 'error' } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isTypingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const useDirect = Boolean(id && String(id).includes('@'));

  const partnerId = useMemo(() => normalizeId(thread?.participants?.[0]?.id || (useDirect && id ? String(id) : undefined)), [id, thread, useDirect]);

  const loadThread = useCallback(async () => {
    if (!id) return;
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    if (initialLoadRef.current) {
      setLoading(true);
    }
    try {
      const PAGE_SIZE = 30;

      if (useDirect) {
        const msgs = await fetchDirectMessages(String(id), { page: 1, limit: PAGE_SIZE });
        setThread({
          id: String(id),
          participants: [{ id: String(id), name: nameParam || 'Member', photo: avatar as string | undefined }],
        });
        setMessages(msgs);
        setPage(1);
        setHasMore(msgs.length >= PAGE_SIZE);
      } else {
        const data = await fetchThreadMessages(String(id), { page: 1, limit: PAGE_SIZE });
        setThread(data.thread);
        setMessages(data.messages || []);
        setPage(1);
        setHasMore((data.messages?.length || 0) >= PAGE_SIZE);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load messages');
      setToast({ message: err?.message || 'Could not load messages', tone: 'error' });
    } finally {
      isLoadingRef.current = false;
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        setLoading(false);
      }
    }
  }, [avatar, id, nameParam, useDirect]);

  const loadMore = useCallback(async () => {
    if (!id || !hasMore || loadingMore || useDirect) return;
    setLoadingMore(true);
    try {
      const PAGE_SIZE = 30;
      const nextPage = page + 1;
      const data = await fetchThreadMessages(String(id), { page: nextPage, limit: PAGE_SIZE });
      const newMessages = data.messages || [];
      setMessages((prev) => [...prev, ...newMessages]);
      setPage(nextPage);
      setHasMore(newMessages.length >= PAGE_SIZE);
    } catch (err: any) {
      setToast({ message: err?.message || 'Could not load more', tone: 'error' });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, id, loadingMore, page, useDirect]);

  useEffect(() => {
    loadThread();
    const interval = useDirect ? null : setInterval(loadThread, 4000);
    const typingInterval = useDirect
      ? null
      : setInterval(() => {
          if (!id) return;
          fetchTypingStatus(String(id)).then((list) => setTypingUsers(list || [])).catch(() => {});
        }, 2000);
    let sub: { remove: () => void } | null = null;

    const registerNotificationListener = async () => {
      if (isExpoGo) return;
      const Notifications = await import('expo-notifications');
      sub = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification?.request?.content?.data as any;
        if (data?.type === 'message' && (!data.threadId || String(data.threadId) === String(id))) {
          loadThread();
          addNotification({
            title: notification?.request?.content?.title ?? 'New message',
            body: notification?.request?.content?.body ?? undefined,
            data,
          });
        }
      });
    };

    registerNotificationListener();
    return () => {
      if (interval) clearInterval(interval);
      if (typingInterval) clearInterval(typingInterval);
      sub?.remove();
    };
  }, [fetchTypingStatus, id, loadThread, useDirect]);

  useEffect(() => {
    if (!id || useDirect) return;
    markThreadRead(String(id)).catch(() => {});
    return () => {
      sendTypingStatus(String(id), false).catch(() => {});
    };
  }, [id, useDirect]);

  const onSend = async () => {
    if (!input.trim() || !id) return;
    const pending: Message = {
      id: `local-${Date.now()}`,
      senderId: user?._id || user?.id || 'me',
      receiverId: useDirect ? String(id) : undefined,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, pending]);
    setInput('');
    setSending(true);
    try {
      const saved = useDirect
        ? await sendDirectMessage(String(id), pending.content)
        : await sendMessage(String(id), pending.content);
      setMessages((prev) => prev.map((m) => (m.id === pending.id ? saved : m)));
    } catch (err: any) {
      setError(err?.message || 'Message failed to send');
      setToast({ message: err?.message || 'Message failed to send', tone: 'error' });
      setMessages((prev) => prev.filter((m) => m.id !== pending.id));
    } finally {
      setSending(false);
    }
  };

  const displayName = useMemo(() => {
    if (nameParam) return nameParam;
    const participant = thread?.participants?.[0];
    return participant?.name || 'Chat';
  }, [nameParam, thread]);

  const targetUserId = useMemo(() => {
    const participantId = thread?.participants?.[0]?.id;
    if (participantId) return participantId;
    if (useDirect && id) return String(id);
    return undefined;
  }, [id, thread, useDirect]);

  const participantAvatar = useMemo(() => (avatar as string) || thread?.participants?.[0]?.photo || '', [avatar, thread]);
  const participantInitial = useMemo(() => displayName?.[0]?.toUpperCase?.() || '?', [displayName]);
  const participantVerification = useMemo(() => {
    const participant = thread?.participants?.[0] as any;
    const hasId = Boolean(
      participant?.idVerificationUrl ||
        participant?.verificationIdUrl ||
        participant?.idVerification?.url
    );
    const hasSelfie = Boolean(
      participant?.selfiePhoto ||
        participant?.verificationSelfie
    );
    const isVerified = Boolean(
      participant?.isVerified ||
        participant?.verified ||
        participant?.verificationStatus === 'verified' ||
        (hasId && hasSelfie)
    );
    return { isVerified };
  }, [thread]);

  const onBlock = async () => {
    if (!targetUserId) return;
    setActioning(true);
    setError(null);
    try {
      await blockUser(targetUserId);
      router.back();
    } catch (err: any) {
      setError(err?.message || 'Failed to block user');
      setToast({ message: err?.message || 'Failed to block user', tone: 'error' });
    } finally {
      setActioning(false);
    }
  };

  const onReport = async () => {
    if (!id) return;
    setActioning(true);
    setError(null);
    try {
      await reportThread(String(id), 'inappropriate');
      setToast({ message: 'Reported', tone: 'success' });
    } catch (err: any) {
      setError(err?.message || 'Failed to report');
      setToast({ message: err?.message || 'Failed to report', tone: 'error' });
    } finally {
      setActioning(false);
    }
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const renderItem = ({ item }: { item: Message }) => {
    const sender = normalizeId(item.senderId);
    const meId = normalizeId(currentUserId);
    const receiver = normalizeId(item.receiverId);
    // Prefer explicit partner match; if sender is partner, it's not me. Otherwise, match to current user.
    const isPartner = partnerId ? sender === partnerId : false;
    const isMe = isPartner
      ? false
      : meId
        ? sender === meId || (!!partnerId && receiver === partnerId && !!sender)
        : !!partnerId && receiver === partnerId && !!sender;
    const statusLabel = item.status === 'read' ? 'Read' : item.status === 'delivered' ? 'Delivered' : 'Sent';
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {item.content ? <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>{item.content}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            {isMe ? <Text style={styles.status}>{statusLabel}</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  const handleTyping = useCallback(
    (text: string) => {
      setInput(text);
      if (!id || useDirect) return;
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTypingStatus(String(id), true).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTypingStatus(String(id), false).catch(() => {});
      }, 1500);
    },
    [id, useDirect]
  );

  if (loading) {
    return (
      <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title={displayName}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.subtitle}>Loading conversation…</Text>
      </UniversalBackground>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <UniversalBackground
          scrollable={false}
          style={styles.fill}
          title={displayName}
          showBackButton
          onBackPress={() => router.replace('/(tabs)/chat')}
          toast={toast}
        >
          <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {participantAvatar ? (
                <Image source={{ uri: participantAvatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Text style={styles.headerAvatarText}>{participantInitial}</Text>
                </View>
              )}
              <View style={styles.headerMeta}>
                <Text style={styles.headerName}>{displayName}</Text>
                <View style={styles.verifyRow}>
                  <Ionicons
                    name={participantVerification.isVerified ? 'shield-checkmark' : 'alert-circle'}
                    size={12}
                    color={participantVerification.isVerified ? colors.success : colors.warning}
                  />
                  <Text
                    style={[
                      styles.verifyText,
                      participantVerification.isVerified ? styles.verifyTextVerified : styles.verifyTextUnverified,
                    ]}
                  >
                    {participantVerification.isVerified ? 'Verified user' : 'Unverified user'}
                  </Text>
                </View>
                {thread?.participants?.[0]?.name ? <Text style={styles.headerSub}>Chat partner</Text> : null}
              </View>
            </View>
            {targetUserId ? (
              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: targetUserId } })}
              >
                <Text style={styles.viewProfileText}>View profile</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionPill} onPress={onReport} disabled={actioning}>
              <Ionicons name="flag" size={14} color={colors.primaryDark} />
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, styles.actionPillDanger]} onPress={onBlock} disabled={actioning}>
              <Ionicons name="ban" size={14} color={colors.primaryDark} />
              <Text style={styles.actionText}>Block</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              hasMore ? (
                <TouchableOpacity style={styles.loadMore} onPress={loadMore} disabled={loadingMore}>
                  {loadingMore ? <ActivityIndicator color={colors.secondary} /> : <Text style={styles.loadMoreText}>Load earlier</Text>}
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={<Text style={styles.subtitle}>Say hi to start the conversation.</Text>}
          />

          {typingUsers.filter((u) => u !== (user?._id || user?.id || 'me')).length ? (
            <Text style={styles.typing}>Typing…</Text>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={colors.primary}
              value={input}
              onChangeText={handleTyping}
              blurOnSubmit
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              multiline
              onBlur={() => {
                if (id && isTypingRef.current) {
                  isTypingRef.current = false;
                  sendTypingStatus(String(id), false).catch(() => {});
                }
              }}
            />
            <TouchableOpacity style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={onSend} disabled={sending}>
              {sending ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons name="send" size={18} color={colors.primaryDark} />}
            </TouchableOpacity>
          </View>
          </View>
        </UniversalBackground>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  loadMore: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  loadMoreText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  actionPillDanger: {
    backgroundColor: colors.warning,
  },
  actionText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginLeft: 64,
    alignItems: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    marginRight: 64,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleMe: {
    backgroundColor: '#F97316',
    borderColor: '#EA580C',
    borderWidth: 1.5,
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleThem: {
    backgroundColor: '#5B21B6',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderTopLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
  },
  messageTextMe: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  messageTextThem: {
    color: '#F5F3FF',
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  status: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    color: colors.primaryDark,
  },
  mediaButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  typing: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: -spacing.xs,
    marginTop: -spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.dark,
  },
  headerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  headerMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifyText: {
    ...typography.caption,
    fontWeight: '700',
  },
  verifyTextVerified: {
    color: colors.success,
  },
  verifyTextUnverified: {
    color: colors.warning,
  },
  headerName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerSub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  viewProfileButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  viewProfileText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
