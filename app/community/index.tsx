import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchClubs, joinClub, Club } from '@/api/community';
import { fetchEvents, EventItem, rsvpEvent, cancelRsvpEvent } from '@/api/events';

export default function CommunityScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchClubs(), fetchEvents()])
      .then(([clubList, eventList]) => {
        setClubs(clubList);
        setEvents(eventList);
      })
      .catch((err) => setError(err?.message || 'Could not load community data'))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (id: string) => {
    try {
      await joinClub(id);
      setClubs((prev) => prev.map((c) => (c.id === id ? { ...c, joined: true } : c)));
    } catch (err: any) {
      setError(err?.message || 'Could not join club');
    }
  };

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

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Community & Events"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <GlassCard style={styles.card} intensity={30} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Featured tribes</Text>
        {clubs.map((tribe) => (
          <View key={tribe.id} style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="people" size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>{tribe.name}</Text>
              <Text style={styles.subtitle}>{tribe.summary}</Text>
              <Text style={styles.caption}>{tribe.members ?? 0} members</Text>
            </View>
            <TouchableOpacity style={styles.joinPill} onPress={() => handleJoin(tribe.id)} disabled={tribe.joined}>
              <Text style={styles.joinText}>{tribe.joined ? 'Joined' : 'Join'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.card} intensity={30} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Upcoming events</Text>
        {events.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>{event.date || 'TBD'}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.subtitle}>{event.city || event.location}</Text>
              {event.rsvp ? <Text style={styles.caption}>RSVPed</Text> : null}
            </View>
            <TouchableOpacity style={styles.chevron} onPress={() => handleRsvp(event.id, event.rsvp)}>
              <Ionicons name={event.rsvp ? 'close-circle' : 'checkmark-circle'} size={18} color={event.rsvp ? colors.error : colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>

      <GoldButton title="See more tribes" onPress={() => {}} />
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  caption: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  joinPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  joinText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  eventBadge: {
    backgroundColor: colors.glass.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  eventBadgeText: {
    ...typography.label,
    color: colors.text.primary,
  },
  chevron: {
    padding: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
