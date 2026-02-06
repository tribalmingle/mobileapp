import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchTipById, Tip } from '@/api/tips';

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No tip ID provided');
      setLoading(false);
      return;
    }

    fetchTipById(id)
      .then((data) => {
        if (data) {
          setTip(data);
        } else {
          setError('Tip not found');
        }
      })
      .catch((err) => setError(err?.message || 'Could not load tip'))
      .finally(() => setLoading(false));
  }, [id]);

  // Parse markdown-style content into formatted sections
  const renderContent = (content: string) => {
    if (!content) return null;

    const sections = content.split('\n\n').filter(Boolean);
    
    return sections.map((section, index) => {
      // Check if it's a header (starts with ##)
      if (section.startsWith('## ')) {
        return (
          <Text key={index} style={styles.sectionHeader}>
            {section.replace('## ', '')}
          </Text>
        );
      }
      
      // Check if it's a bullet list
      if (section.includes('\n- ')) {
        const lines = section.split('\n');
        return (
          <View key={index} style={styles.listContainer}>
            {lines.map((line, lineIndex) => {
              if (line.startsWith('- ')) {
                return (
                  <View key={lineIndex} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>{renderBoldText(line.substring(2))}</Text>
                  </View>
                );
              }
              return line ? <Text key={lineIndex} style={styles.contentText}>{renderBoldText(line)}</Text> : null;
            })}
          </View>
        );
      }

      // Regular paragraph
      return (
        <Text key={index} style={styles.contentText}>
          {renderBoldText(section)}
        </Text>
      );
    });
  };

  // Handle bold text (**text**)
  const renderBoldText = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <UniversalBackground title="Loading..." showBackButton>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      </UniversalBackground>
    );
  }

  if (error || !tip) {
    return (
      <UniversalBackground title="Error" showBackButton>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error || 'Tip not found'}</Text>
        </View>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Dating Tips"
      showBackButton
      onBackPress={() => router.back()}
      showBottomNav
    >
      {tip.featuredImage && (
        <Image
          source={{ uri: tip.featuredImage }}
          style={[styles.featuredImage, { width: width - spacing.lg * 2 }]}
          resizeMode="cover"
        />
      )}

      <GlassCard style={styles.card} intensity={26} padding={spacing.lg}>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tip.category}</Text>
          </View>
          <View style={styles.readTime}>
            <Feather name="clock" size={14} color={colors.text.tertiary} />
            <Text style={styles.readTimeText}>{tip.readingTime} min read</Text>
          </View>
        </View>

        <Text style={styles.title}>{tip.title}</Text>
        
        <View style={styles.divider} />

        <View style={styles.contentContainer}>
          {renderContent(tip.content)}
        </View>
      </GlassCard>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  featuredImage: {
    height: 200,
    borderRadius: borderRadius.lg,
  },
  card: {
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.stroke,
    marginVertical: spacing.sm,
  },
  contentContainer: {
    gap: spacing.md,
  },
  sectionHeader: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  contentText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  listContainer: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  bullet: {
    ...typography.body,
    color: colors.secondary,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  listItemText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 24,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
