import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchRecommendations, Recommendation, DiscoverFilters } from '@/api/discovery';
import { fetchEvents, EventItem, rsvpEvent, cancelRsvpEvent } from '@/api/events';
import { useAuthStore } from '@/store/authStore';

type Tab = 'people' | 'events';

// Tribe cultural taglines - maps tribe name to cultural description
const TRIBE_TAGLINES: Record<string, string> = {
  yoruba: 'Known for rich culture, arts, and the famous talking drums of Africa',
  igbo: 'Celebrated for entrepreneurship, vibrant festivals, and strong community bonds',
  hausa: 'Renowned for hospitality, beautiful textiles, and ancient trading heritage',
  zulu: 'Proud warriors with rich traditions in music, dance, and beadwork',
  swahili: 'Masters of coastal trade, poetry, and the beautiful Swahili language',
  kikuyu: 'Enterprising people known for agriculture and strong family values',
  maasai: 'Legendary pastoralists known for distinctive customs and warrior traditions',
  fulani: 'Nomadic herders with rich oral traditions and intricate jewelry',
  akan: 'Keepers of the golden stool, known for kente cloth and proverbs',
  amhara: 'Ancient civilization with unique alphabet, Orthodox traditions, and coffee culture',
  default: 'United by heritage, connected by tradition, finding love together',
};

interface Filters {
  status: 'all' | 'online' | 'active';
  verifiedId: boolean;
  verifiedSelfie: boolean;
  distance: number;
  minAge: number;
  maxAge: number;
  lookingFor: string[];
}

const DEFAULT_FILTERS: Filters = {
  status: 'all',
  verifiedId: false,
  verifiedSelfie: false,
  distance: 0, // 0 means any
  minAge: 30,
  maxAge: 70,
  lookingFor: [],
};

const LOOKING_FOR_OPTIONS = ['Marriage', 'Long-term', 'Friendship', 'Casual Dating', 'Not sure yet'];

export default function MyTribeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('people');
  const [members, setMembers] = useState<Recommendation[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);
  const user = useAuthStore((s) => s.user);
  const userTribe = user?.tribe || user?.heritage || '';

  // Collapsible header animation — content-driven shrink
  const scrollY = useRef(new Animated.Value(0)).current;
  const COLLAPSE_DISTANCE = 80;

  // Header padding shrinks
  const headerPaddingV = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [spacing.md, spacing.sm],
    extrapolate: 'clamp',
  });
  const headerPaddingH = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [spacing.md, spacing.sm],
    extrapolate: 'clamp',
  });
  // Tagline fades out and collapses
  const taglineOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.35],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const taglineMaxHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.5],
    outputRange: [40, 0],
    extrapolate: 'clamp',
  });
  // Member count fades out
  const memberCountOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const memberCountMaxHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE * 0.5],
    outputRange: [22, 0],
    extrapolate: 'clamp',
  });
  // Tribe name font shrinks
  const nameFontSize = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [18, 15],
    extrapolate: 'clamp',
  });
  // Header margin bottom shrinks
  const headerMarginBottom = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [spacing.md, spacing.xs],
    extrapolate: 'clamp',
  });
  // Gap between icon and text
  const headerGap = scrollY.interpolate({
    inputRange: [0, COLLAPSE_DISTANCE],
    outputRange: [spacing.sm, spacing.xs],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiFilters: DiscoverFilters = userTribe ? { tribe: userTribe } : {};
        const { results } = await fetchRecommendations(apiFilters, 1, 50);
        setMembers(results);
      } catch (err: any) {
        setError(err?.message || 'Could not load tribe members');
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [userTribe]);

  // Load events separately with error handling
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData || []);
      } catch (err: any) {
        console.warn('Events fetch error:', err);
        setEventsError('Events are currently unavailable');
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Apply filters to members
  const filteredMembers = useMemo(() => {
    let result = [...members];
    
    // Filter by verification
    if (filters.verifiedId) {
      result = result.filter((m) => m.verified || (m as any).idVerified);
    }
    if (filters.verifiedSelfie) {
      result = result.filter((m) => (m as any).selfieVerified);
    }
    
    // Filter by age
    result = result.filter((m) => {
      const age = m.age || 30;
      return age >= filters.minAge && age <= filters.maxAge;
    });
    
    // Filter by looking for
    if (filters.lookingFor.length > 0) {
      result = result.filter((m) => {
        const goal = m.lookingFor || (m.relationshipGoals?.[0]);
        return filters.lookingFor.some((f) => 
          goal?.toLowerCase().includes(f.toLowerCase())
        );
      });
    }
    
    // Sort by status
    if (filters.status === 'online') {
      result = result.filter((m) => (m as any).isOnline);
    } else if (filters.status === 'active') {
      result.sort((a, b) => {
        const aActive = (a as any).lastActive ? new Date((a as any).lastActive).getTime() : 0;
        const bActive = (b as any).lastActive ? new Date((b as any).lastActive).getTime() : 0;
        return bActive - aActive;
      });
    }
    
    // Sort verified first
    if (filters.verifiedId || filters.verifiedSelfie) {
      result.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    }
    
    return result;
  }, [members, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.verifiedId) count++;
    if (filters.verifiedSelfie) count++;
    if (filters.distance > 0) count++;
    if (filters.minAge !== 30 || filters.maxAge !== 70) count++;
    if (filters.lookingFor.length > 0) count++;
    return count;
  }, [filters]);

  const handleRsvp = async (id: string, isRsvp?: boolean) => {
    try {
      if (isRsvp) {
        await cancelRsvpEvent(id);
      } else {
        await rsvpEvent(id);
      }
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, rsvp: !isRsvp } : e)));
    } catch (err: any) {
      setError(err?.message || 'Could not update RSVP');
    }
  };

  const renderMemberItem = ({ item }: { item: Recommendation }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id, profile: JSON.stringify(item) } })}
      activeOpacity={0.8}
    >
      <View style={styles.memberPhotoContainer}>
        {item.photos[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.memberPhoto} />
        ) : (
          <View style={[styles.memberPhoto, styles.memberPhotoPlaceholder]}>
            <Text style={styles.memberInitial}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#1877F2" />
          </View>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
        {item.tribe && <Text style={styles.memberTribe}>{item.tribe}</Text>}
        <Text style={styles.memberLocation} numberOfLines={1}>
          {[item.city, item.country].filter(Boolean).join(', ') || 'Location unknown'}
        </Text>
        {item.compatibility && (
          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>{item.compatibility}% match</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: EventItem }) => (
    <View style={styles.eventCard}>
      <LinearGradient
        colors={['rgba(91, 46, 145, 0.2)', 'rgba(139, 92, 246, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eventGradient}
      >
        <View style={styles.eventDateBadge}>
          <Text style={styles.eventDateDay}>
            {item.date ? new Date(item.date).getDate() : '?'}
          </Text>
          <Text style={styles.eventDateMonth}>
            {item.date ? new Date(item.date).toLocaleString('default', { month: 'short' }).toUpperCase() : 'TBD'}
          </Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.eventMetaRow}>
            <Ionicons name="location" size={14} color={colors.text.secondary} />
            <Text style={styles.eventLocation} numberOfLines={1}>
              {item.city || item.location || 'Location TBA'}
            </Text>
          </View>
          {item.rsvp && (
            <View style={styles.rsvpBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.rsvpBadgeText}>You're going</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.rsvpButton, item.rsvp && styles.rsvpButtonActive]}
          onPress={() => handleRsvp(item.id, item.rsvp)}
        >
          <Ionicons
            name={item.rsvp ? 'close-circle' : 'add-circle'}
            size={24}
            color={item.rsvp ? colors.error : colors.secondary}
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const toggleLookingFor = (option: string) => {
    setFilters((prev) => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter((o) => o !== option)
        : [...prev.lookingFor, option],
    }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const tribeTagline = TRIBE_TAGLINES[userTribe?.toLowerCase() || ''] || TRIBE_TAGLINES.default;

  return (
    <UniversalBackground
      scrollable={false}
      style={styles.fill}
      title="My Tribe"
      showBottomNav
    >
      <View style={styles.container}>
        {/* Collapsible Tribe Header Banner */}
        {userTribe && (
          <Animated.View style={{ marginBottom: headerMarginBottom }}>
            <LinearGradient
              colors={['rgba(91, 46, 145, 0.3)', 'rgba(139, 92, 246, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tribeHeaderCollapsible}
            >
              <Animated.View style={{
                paddingHorizontal: headerPaddingH,
                paddingVertical: headerPaddingV,
              }}>
                {/* Row: icon + tribe name + member count */}
                <Animated.View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: headerGap,
                }}>
                  <Ionicons name="people-circle" size={28} color={colors.secondary} />
                  <Animated.Text style={[
                    styles.tribeNameAnimated,
                    { fontSize: nameFontSize },
                  ]} numberOfLines={1}>
                    {userTribe} Tribe
                  </Animated.Text>
                  <Animated.View style={{ opacity: memberCountOpacity, marginLeft: 'auto' }}>
                    <Text style={styles.memberCountInline}>{filteredMembers.length} members</Text>
                  </Animated.View>
                </Animated.View>

                {/* Tagline - collapses on scroll */}
                <Animated.View style={{
                  opacity: taglineOpacity,
                  maxHeight: taglineMaxHeight,
                  overflow: 'hidden',
                  marginTop: spacing.xs,
                }}>
                  <Text style={styles.tribeTagline} numberOfLines={2}>{tribeTagline}</Text>
                </Animated.View>

                {/* Member count below tagline */}
                <Animated.View style={{
                  opacity: memberCountOpacity,
                  maxHeight: memberCountMaxHeight,
                  overflow: 'hidden',
                  marginTop: spacing.xs,
                }}>
                  <Text style={styles.memberCount}>{filteredMembers.length} members</Text>
                </Animated.View>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'people' && styles.tabActive]}
            onPress={() => setActiveTab('people')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'people' ? colors.primaryDark : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
              People
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={activeTab === 'events' ? colors.primaryDark : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Events
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button Row (People tab only) */}
        {activeTab === 'people' && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options" size={18} color={activeFilterCount > 0 ? colors.white : colors.text.secondary} />
              <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading tribe...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : activeTab === 'people' ? (
          <Animated.FlatList
            key="people-list"
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMemberItem}
            numColumns={2}
            columnWrapperStyle={styles.memberRow}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No tribe members found</Text>
                <Text style={styles.emptySubtext}>
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters to see more people.'
                    : userTribe
                    ? `No other ${userTribe} members yet. Check back soon!`
                    : 'Complete your profile to see your tribe.'}
                </Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                    <Text style={styles.resetButtonText}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        ) : eventsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : eventsError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>Events Unavailable</Text>
            <Text style={styles.emptySubtext}>{eventsError}</Text>
          </View>
        ) : (
          <Animated.FlatList
            key="events-list"
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No events yet</Text>
                <Text style={styles.emptySubtext}>
                  Stay tuned for upcoming tribe gatherings and meetups!
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Members</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {(['all', 'online', 'active'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.chip, filters.status === status && styles.chipActive]}
                      onPress={() => setFilters((p) => ({ ...p, status }))}
                    >
                      <Text style={[styles.chipText, filters.status === status && styles.chipTextActive]}>
                        {status === 'all' ? 'All' : status === 'online' ? 'Online Now' : 'Recently Active'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Verification Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Verification</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, filters.verifiedId && styles.chipActive]}
                    onPress={() => setFilters((p) => ({ ...p, verifiedId: !p.verifiedId }))}
                  >
                    <Ionicons 
                      name="shield-checkmark" 
                      size={14} 
                      color={filters.verifiedId ? colors.white : colors.text.secondary} 
                    />
                    <Text style={[styles.chipText, filters.verifiedId && styles.chipTextActive]}>
                      ID Verified
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, filters.verifiedSelfie && styles.chipActive]}
                    onPress={() => setFilters((p) => ({ ...p, verifiedSelfie: !p.verifiedSelfie }))}
                  >
                    <Ionicons 
                      name="camera" 
                      size={14} 
                      color={filters.verifiedSelfie ? colors.white : colors.text.secondary} 
                    />
                    <Text style={[styles.chipText, filters.verifiedSelfie && styles.chipTextActive]}>
                      Selfie Verified
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Age Range */}
              <View style={styles.filterSection}>
                <View style={styles.filterLabelRow}>
                  <Text style={styles.filterLabel}>Age Range</Text>
                  <Text style={styles.filterValue}>{filters.minAge} - {filters.maxAge}</Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Min: {filters.minAge}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={18}
                    maximumValue={70}
                    step={1}
                    value={filters.minAge}
                    onValueChange={(v) => setFilters((p) => ({ ...p, minAge: Math.min(v, p.maxAge - 1) }))}
                    minimumTrackTintColor={colors.primaryLight}
                    maximumTrackTintColor={colors.glass.medium}
                    thumbTintColor={colors.secondary}
                  />
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Max: {filters.maxAge}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={18}
                    maximumValue={70}
                    step={1}
                    value={filters.maxAge}
                    onValueChange={(v) => setFilters((p) => ({ ...p, maxAge: Math.max(v, p.minAge + 1) }))}
                    minimumTrackTintColor={colors.primaryLight}
                    maximumTrackTintColor={colors.glass.medium}
                    thumbTintColor={colors.secondary}
                  />
                </View>
              </View>

              {/* Looking For */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Looking For</Text>
                <View style={styles.chipRowWrap}>
                  {LOOKING_FOR_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, filters.lookingFor.includes(option) && styles.chipActive]}
                      onPress={() => toggleLookingFor(option)}
                    >
                      <Text style={[styles.chipText, filters.lookingFor.includes(option) && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetModalButton} onPress={resetFilters}>
                <Text style={styles.resetModalText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>
                  Show {filteredMembers.length} Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: colors.secondary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryDark,
  },
  tribeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  tribeBannerText: {
    ...typography.small,
    color: colors.primaryLight,
  },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.light,
  },
  sortPillActive: {
    backgroundColor: colors.primaryLight,
  },
  sortText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  sortTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    padding: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  memberRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  memberCard: {
    width: '48%',
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  memberPhotoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.85,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  memberPhoto: {
    width: '100%',
    height: '100%',
  },
  memberPhotoPlaceholder: {
    backgroundColor: colors.glass.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    ...typography.h1,
    color: colors.white,
    opacity: 0.6,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: borderRadius.full,
    padding: 1.5,
    shadowColor: '#1877F2',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  memberInfo: {
    padding: spacing.sm,
    gap: 2,
  },
  memberName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  memberTribe: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  memberLocation: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  compatibilityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  compatibilityText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  // Event Card Styles
  eventCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  eventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: borderRadius.xl,
  },
  eventDateBadge: {
    width: 56,
    height: 56,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  eventDateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 24,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventLocation: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  rsvpBadgeText: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
  },
  rsvpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  // Tribe Header styles
  tribeHeaderCollapsible: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    overflow: 'hidden',
  },

  tribeNameAnimated: {
    color: colors.secondary,
    fontWeight: '800',
    flex: 1,
  },
  memberCountInline: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  tribeTagline: {
    ...typography.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  memberCount: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  // Filter styles
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  clearFiltersButton: {
    paddingHorizontal: spacing.sm,
  },
  clearFiltersText: {
    ...typography.small,
    color: colors.primaryLight,
    textDecorationLine: 'underline',
  },
  resetButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  resetButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.light,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filterValue: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderLabel: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glass.light,
  },
  resetModalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  resetModalText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
