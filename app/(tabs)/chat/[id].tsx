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
  Platform,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useChatStore } from '@/store/chatStore';
import { fetchUserOnlineStatus } from '@/api/users';
import { onPushEvent } from '@/lib/notificationBus';


const normalizeId = (value?: string | null) => (value ? String(value).toLowerCase() : '');

// Reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🙏', '😡'];

// Extended Message type with reactions and reply
interface ExtendedMessage extends Message {
  reaction?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
}

export default function ThreadScreen() {
  const router = useRouter();
  const { id, name: nameParam, avatar } = useLocalSearchParams<{ id: string; name?: string; avatar?: string }>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const currentUserId = useMemo(
    () => user?._id || user?.id || (user as any)?.userId || (user as any)?.uid || (user as any)?.email || (user as any)?.profileId,
    [user]
  );

  const flatListRef = useRef<FlatList>(null);
  const isUserScrolling = useRef(false);
  const lastContentOffset = useRef(0);

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
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

  // Reaction and Reply state
  const [selectedMessage, setSelectedMessage] = useState<ExtendedMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const reactionScale = useRef(new Animated.Value(0)).current;

  // Three-dot menu state (must be declared before any early returns to avoid hooks violation)
  const [showMenu, setShowMenu] = useState(false);

  // Online status state
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastActive, setPartnerLastActive] = useState<string | undefined>(undefined);

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
    const unsubscribe = onPushEvent((data) => {
      if (data?.type === 'message' && (!data.threadId || String(data.threadId) === String(id))) {
        loadThread();
      }
    });
    return () => {
      if (interval) clearInterval(interval);
      if (typingInterval) clearInterval(typingInterval);
      unsubscribe();
    };
  }, [fetchTypingStatus, id, loadThread, useDirect]);

  // Mark thread as read when opening conversation
  const markThreadReadInStore = useChatStore((s) => s.markThreadRead);
  
  useEffect(() => {
    if (!id || useDirect) return;
    // Mark read in both API and local store to clear badge immediately
    markThreadRead(String(id)).catch(() => {});
    markThreadReadInStore(String(id));
    return () => {
      sendTypingStatus(String(id), false).catch(() => {});
    };
  }, [id, useDirect, markThreadReadInStore]);

  // Re-mark as read whenever new messages arrive (catches incoming messages while conversation is open)
  useEffect(() => {
    if (!id || useDirect || messages.length === 0) return;
    markThreadRead(String(id)).catch(() => {});
    markThreadReadInStore(String(id));
  }, [id, useDirect, messages.length, markThreadReadInStore]);

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

  // Poll partner's online status
  useEffect(() => {
    const userId = targetUserId || thread?.participants?.[0]?.id;
    if (!userId) return;

    // Check participant data from thread first
    const participant = thread?.participants?.[0] as any;
    if (participant?.isOnline !== undefined) {
      setPartnerOnline(Boolean(participant.isOnline));
      setPartnerLastActive(participant.lastActive || undefined);
    }

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await fetchUserOnlineStatus(userId);
        if (!cancelled) {
          setPartnerOnline(status.isOnline);
          setPartnerLastActive(status.lastActive);
        }
      } catch {
        // silently ignore
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // poll every 15s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [targetUserId, thread]);
  const onSend = async () => {
    if (!input.trim() || !id) return;
    const pending: ExtendedMessage = {
      id: `local-${Date.now()}`,
      senderId: user?._id || user?.id || 'me',
      receiverId: useDirect ? String(id) : undefined,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, senderId: replyingTo.senderId } : undefined,
    };
    setMessages((prev) => [...prev, pending]);
    setInput('');
    setReplyingTo(null);
    setSending(true);
    try {
      const saved = useDirect
        ? await sendDirectMessage(String(id), pending.content)
        : await sendMessage(String(id), pending.content);
      // Preserve replyTo when updating with saved message
      setMessages((prev) => prev.map((m) => (m.id === pending.id ? { ...saved, replyTo: pending.replyTo } : m)));
    } catch (err: any) {
      setError(err?.message || 'Message failed to send');
      setToast({ message: err?.message || 'Message failed to send', tone: 'error' });
      setMessages((prev) => prev.filter((m) => m.id !== pending.id));
    } finally {
      setSending(false);
    }
  };

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

  const renderItem = ({ item }: { item: ExtendedMessage }) => {
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
    const statusIcon = item.status === 'read' ? 'checkmark-done' : item.status === 'delivered' ? 'checkmark-done' : 'checkmark';
    const statusColor = item.status === 'read' ? '#1877F2' : colors.text.secondary;
    const statusLabel = item.status === 'read' ? 'Read' : item.status === 'delivered' ? 'Delivered' : 'Sent';
    
    const handleLongPress = () => {
      setSelectedMessage(item);
      setShowReactionPicker(true);
      Animated.spring(reactionScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    };

    return (
      <Pressable 
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}
      >
        {isMe ? (
          <LinearGradient
            colors={['#5B2E91', '#3D1F61'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleMe]}
          >
            {/* Reply preview */}
            {item.replyTo && (
              <TouchableOpacity 
                style={styles.replyPreviewInBubble}
                onPress={() => scrollToMessage(item.replyTo!.id)}
              >
                <View style={styles.replyPreviewBar} />
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {item.replyTo.content}
                </Text>
              </TouchableOpacity>
            )}
            {item.content ? <Text style={[styles.messageText, styles.messageTextMe]}>{item.content}</Text> : null}
            <View style={[styles.metaRow, styles.metaRowMe]}>
              <Text style={[styles.timestamp, styles.timestampMe]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                <Text style={{ fontSize: 10, color: statusColor, fontWeight: item.status === 'read' ? '600' : '400' }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            {/* Reaction badge */}
            {item.reaction && (
              <View style={[styles.reactionBadge, styles.reactionBadgeMe]}>
                <Text style={styles.reactionEmoji}>{item.reaction}</Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleThem]}>
            {/* Reply preview */}
            {item.replyTo && (
              <TouchableOpacity 
                style={styles.replyPreviewInBubble}
                onPress={() => scrollToMessage(item.replyTo!.id)}
              >
                <View style={styles.replyPreviewBar} />
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {item.replyTo.content}
                </Text>
              </TouchableOpacity>
            )}
            {item.content ? <Text style={[styles.messageText, styles.messageTextThem]}>{item.content}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            {/* Reaction badge */}
            {item.reaction && (
              <View style={styles.reactionBadge}>
                <Text style={styles.reactionEmoji}>{item.reaction}</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  // Scroll to original message when tapping quoted reply
  const scrollToMessage = (messageId: string) => {
    const index = sortedMessages.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  // Handle reaction selection
  const handleReactionSelect = (emoji: string) => {
    if (selectedMessage) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id
            ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
            : m
        )
      );
    }
    setShowReactionPicker(false);
    setSelectedMessage(null);
    Animated.timing(reactionScale, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  // Handle reply to message
  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    setShowReactionPicker(false);
    setSelectedMessage(null);
  };

  // Handle scroll events for smooth scrolling detection
  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // Check if user scrolled up (reading older messages)
    if (currentOffset < lastContentOffset.current - 10) {
      isUserScrolling.current = true;
    }
    
    // Check if user is near bottom (within 100px)
    if (contentHeight - currentOffset - layoutHeight < 100) {
      isUserScrolling.current = false;
    }
    
    lastContentOffset.current = currentOffset;
  };

  // Auto-scroll to bottom on new messages (only if user is not scrolling)
  useEffect(() => {
    if (!isUserScrolling.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

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
      <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="">
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.subtitle}>Loading conversation…</Text>
      </UniversalBackground>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <UniversalBackground
          scrollable={false}
          style={styles.fill}
          title=""
          showBackButton={false}
          toast={toast}
          safeAreaEdges={['top']}
        >
          <View style={styles.content}>
          {/* Compact Chat Header - Back + Avatar + Name + Menu in one row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.inlineBackButton}
              onPress={() => router.replace('/(tabs)/chat')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => targetUserId && router.push({ pathname: '/profile/[id]', params: { id: targetUserId } })}
              >
                {participantAvatar ? (
                  <Image source={{ uri: participantAvatar }} style={styles.headerAvatar} />
                ) : (
                  <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                    <Text style={styles.headerAvatarText}>{participantInitial}</Text>
                  </View>
                )}
                {/* Online status green dot on avatar */}
                {partnerOnline && (
                  <View style={styles.onlineIndicator} />
                )}
              </TouchableOpacity>
              <View style={styles.headerMeta}>
                <View style={styles.headerNameRow}>
                  <Text style={styles.headerName}>{displayName}</Text>
                  {participantVerification.isVerified && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 1, shadowColor: '#1877F2', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#1877F2" />
                    </View>
                  )}
                </View>
                {/* Online status text */}
                {partnerOnline ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                    <Text style={[styles.headerSubInfo, { color: '#22C55E', fontWeight: '600' }]}>Online now</Text>
                  </View>
                ) : (
                  <Text style={styles.headerSubInfo}>
                    {partnerLastActive
                      ? `Active ${(() => {
                          const diffMs = Date.now() - new Date(partnerLastActive).getTime();
                          const mins = Math.max(0, Math.round(diffMs / 60000));
                          if (mins < 1) return 'just now';
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.round(mins / 60);
                          if (hrs < 24) return `${hrs}h ago`;
                          return `${Math.round(hrs / 24)}d ago`;
                        })()}`
                      : `${(thread?.participants?.[0] as any)?.tribe || 'Member'}${(thread?.participants?.[0] as any)?.city ? ` • ${(thread?.participants?.[0] as any)?.city}` : ''}`}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Three-dot menu */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Action Menu Modal */}
          <Modal
            visible={showMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <Pressable 
              style={styles.menuOverlay}
              onPress={() => setShowMenu(false)}
            >
              <View style={styles.menuContainer}>
                {targetUserId && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      router.push({ pathname: '/profile/[id]', params: { id: targetUserId } });
                    }}
                  >
                    <Ionicons name="person" size={20} color={colors.text.primary} />
                    <Text style={styles.menuItemText}>View Profile</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    if (id) {
                      markThreadRead(String(id)).catch(() => {});
                      markThreadReadInStore(String(id));
                      setToast({ message: 'Marked as read', tone: 'success' });
                    }
                  }}
                >
                  <Ionicons name="checkmark-done" size={20} color={colors.success} />
                  <Text style={[styles.menuItemText, { color: colors.success }]}>Mark as Read</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onReport();
                  }}
                  disabled={actioning}
                >
                  <Ionicons name="flag" size={20} color={colors.warning} />
                  <Text style={[styles.menuItemText, { color: colors.warning }]}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemLast]}
                  onPress={() => {
                    setShowMenu(false);
                    onBlock();
                  }}
                  disabled={actioning}
                >
                  <Ionicons name="ban" size={20} color={colors.error} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Block</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {error ? <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text> : null}

          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
          <FlatList
            ref={flatListRef}
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 100);
            }}
            ListHeaderComponent={
              hasMore ? (
                <TouchableOpacity style={styles.loadMore} onPress={loadMore} disabled={loadingMore}>
                  {loadingMore ? <ActivityIndicator color={colors.secondary} /> : <Text style={styles.loadMoreText}>Load earlier</Text>}
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="chatbubbles" size={48} color={colors.primaryLight} />
                </View>
                <Text style={styles.emptyTitle}>Start your connection!</Text>
                <Text style={styles.emptySubtitle}>Send a message to {displayName}</Text>
                <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickActionButton} onPress={() => setInput('Hey! 👋')}>
                    <Text style={styles.quickActionText}>Wave Hello 👋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton} onPress={() => setInput('Hi! I noticed we matched. How are you doing?')}>
                    <Text style={styles.quickActionText}>Say Hi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
          </Pressable>

          {typingUsers.filter((u) => u !== (user?._id || user?.id || 'me')).length ? (
            <Text style={styles.typing}>Typing…</Text>
          ) : null}

          {/* Reply Bar */}
          {replyingTo && (
            <View style={styles.replyBar}>
              <View style={styles.replyBarContent}>
                <View style={styles.replyBarLine} />
                <View style={styles.replyBarText}>
                  <Text style={styles.replyBarLabel}>Replying to message</Text>
                  <Text style={styles.replyBarPreview} numberOfLines={1}>{replyingTo.content}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.replyBarClose} onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
          >
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.text.secondary}
                  value={input}
                  onChangeText={handleTyping}
                  blurOnSubmit={false}
                  returnKeyType="send"
                  onSubmitEditing={onSend}
                  multiline
                  onBlur={() => {
                    if (id && isTypingRef.current) {
                      isTypingRef.current = false;
                      sendTypingStatus(String(id), false).catch(() => {});
                    }
                  }}
                />
              </View>
              <TouchableOpacity 
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled, sending && styles.sendButtonDisabled]} 
                onPress={onSend} 
                disabled={sending || !input.trim()}
              >
                <LinearGradient
                  colors={input.trim() ? ['#D4AF37', '#B8860B'] : ['#4A4A4A', '#333333']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  {sending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </UniversalBackground>
      </KeyboardAvoidingView>
    
    {/* Reaction Picker Modal */}
    <Modal
      visible={showReactionPicker}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowReactionPicker(false);
        setSelectedMessage(null);
      }}
    >
      <Pressable 
        style={styles.reactionModalOverlay} 
        onPress={() => {
          setShowReactionPicker(false);
          setSelectedMessage(null);
        }}
      >
        <Animated.View style={[styles.reactionPickerContainer, { transform: [{ scale: reactionScale }] }]}>
          <View style={styles.reactionPicker}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionOption,
                  selectedMessage?.reaction === emoji && styles.reactionOptionSelected,
                ]}
                onPress={() => handleReactionSelect(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
            <Ionicons name="arrow-undo" size={18} color={colors.primaryDark} />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    gap: spacing.xs,
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
    position: 'relative',
  },
  bubbleMe: {
    borderTopRightRadius: 4,
    shadowColor: '#5B2E91',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTextThem: {
    color: colors.text.primary,
  },
  timestamp: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  timestampMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaRowMe: {
    justifyContent: 'flex-end',
  },
  status: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'android' ? spacing.sm : spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  input: {
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    ...typography.body,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.xs,
  },
  inlineBackButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.dark,
  },
  headerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSubInfo: {
    ...typography.small,
    color: colors.text.secondary,
  },
  viewProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu styles
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: spacing.lg,
  },
  menuContainer: {
    backgroundColor: colors.elevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 180,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  // Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickActionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  quickActionText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  // Reply preview inside message bubble
  replyPreviewInBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  replyPreviewBar: {
    width: 3,
    height: '100%',
    minHeight: 16,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  replyPreviewText: {
    ...typography.small,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  // Reaction badge on messages
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.glass.light,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  reactionBadgeMe: {
    left: -4,
  },
  reactionBadgeThem: {
    right: -4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  // Reply bar above input
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  replyBarLine: {
    width: 3,
    height: 32,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
  },
  replyBarText: {
    flex: 1,
    gap: 2,
  },
  replyBarLabel: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  replyBarPreview: {
    ...typography.small,
    color: colors.text.secondary,
  },
  replyBarClose: {
    padding: spacing.xs,
  },
  // Reaction picker modal
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  reactionOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  replyButtonText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
