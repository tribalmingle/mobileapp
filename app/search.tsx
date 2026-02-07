import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GoldButton from '@/components/universal/GoldButton';
import { fetchRecommendations, Recommendation, DiscoverFilters } from '@/api/discovery';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

const DEBOUNCE_MS = 400;

// Popular quick filter chips
const QUICK_FILTERS = [
  { label: 'Online Now', icon: 'radio-button-on', filter: { online: true } },
  { label: 'Verified', icon: 'shield-checkmark', filter: { verified: true } },
  { label: 'Near Me', icon: 'location', filter: { nearby: true } },
  { label: 'New Members', icon: 'sparkles', filter: { new: true } },
];

// Popular tribes for suggestions
const POPULAR_TRIBES = ['Yoruba', 'Igbo', 'Hausa', 'Zulu', 'Swahili', 'Kikuyu'];

// Popular locations
const POPULAR_LOCATIONS = [
  { city: 'Lagos', country: 'Nigeria' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Johannesburg', country: 'South Africa' },
  { city: 'Accra', country: 'Ghana' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [minAge, setMinAge] = useState('30');
  const [maxAge, setMaxAge] = useState('70');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [tribe, setTribe] = useState('');
  const [religion, setReligion] = useState('');
  const [education, setEducation] = useState('');
  const [workType, setWorkType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (immediate?: boolean) => {
    // Cancel any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const filters: DiscoverFilters = {
      search: query.trim() || undefined,
      maritalStatus: maritalStatus || undefined,
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      country: country || undefined,
      city: city || undefined,
      tribe: tribe || undefined,
      religion: religion || undefined,
      education: education || undefined,
      workType: workType || undefined,
    };

    try {
      const { results: data } = await fetchRecommendations(filters, 1, 30);
      setResults(data);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Could not fetch search results');
      }
    } finally {
      setLoading(false);
    }
  }, [query, maritalStatus, minAge, maxAge, country, city, tribe, religion, education, workType]);

  // Debounced auto-search as user types
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch();
    }, DEBOUNCE_MS);
  }, [runSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const openProfile = (person: Recommendation) => {
    router.push({
      pathname: '/profile/[id]',
      params: { id: person.id, profile: JSON.stringify(person) },
    });
  };

  const renderResult = ({ item }: { item: Recommendation }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => openProfile(item)} activeOpacity={0.9}>
      <View style={styles.resultImageWrapper}>
        {item.photos?.[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.resultImage} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Ionicons name="person" size={24} color={colors.text.secondary} />
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#1877F2" />
          </View>
        )}
      </View>
      <View style={styles.resultMeta}>
        <View style={styles.resultNameRow}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}{item.age ? `, ${item.age}` : ''}
          </Text>
          {item.compatibility && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{item.compatibility}%</Text>
            </View>
          )}
        </View>
        <View style={styles.resultInfoRow}>
          <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
          <Text style={styles.resultDetail} numberOfLines={1}>
            {[item.city, item.country].filter(Boolean).join(', ') || 'Location not set'}
          </Text>
        </View>
        <View style={styles.resultInfoRow}>
          <Ionicons name="people-outline" size={12} color={colors.secondary} />
          <Text style={[styles.resultDetail, styles.resultTribe]} numberOfLines={1}>
            {item.tribe || 'Tribe not set'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  const handleQuickFilter = (filterLabel: string) => {
    setQuery(filterLabel);
    runSearch(true);
  };

  const handleTribeSearch = (tribeName: string) => {
    setTribe(tribeName);
    setShowAdvanced(true);
    runSearch(true);
  };

  const handleLocationSearch = (loc: { city: string; country: string }) => {
    setCity(loc.city);
    setCountry(loc.country);
    setShowAdvanced(true);
    runSearch(true);
  };

  return (
    <UniversalBackground
      scrollable
      useGradient={true}
      title="Search"
      showBackButton
      showBottomNav
      contentContainerStyle={styles.container}
    >
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Search by name, tribe, city..."
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(true)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
        {loading ? (
          <ActivityIndicator size="small" color={colors.secondary} />
        ) : (
          <TouchableOpacity onPress={() => runSearch(true)} style={styles.searchButton}>
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchButtonGradient}
            >
              <Ionicons name="search" size={16} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersScroll}
      >
        {QUICK_FILTERS.map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickFilterChip}
            onPress={() => handleQuickFilter(filter.label)}
          >
            <Ionicons name={filter.icon as any} size={14} color={colors.primaryLight} />
            <Text style={styles.quickFilterText}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced((prev) => !prev)}>
        <Text style={styles.advancedToggleText}>Advanced filters</Text>
        <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text.secondary} />
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.advancedCard}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Marital status</Text>
              <TextInput
                value={maritalStatus}
                onChangeText={setMaritalStatus}
                placeholder="Single, Divorced..."
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Tribe</Text>
              <TextInput
                value={tribe}
                onChangeText={setTribe}
                placeholder="Yoruba, Igbo..."
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Min age</Text>
              <TextInput
                value={minAge}
                onChangeText={(v) => {
                  const num = parseInt(v, 10);
                  if (v === '' || (!isNaN(num) && num >= 18 && num <= 70)) setMinAge(v);
                }}
                placeholder="30"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
                maxLength={2}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Max age</Text>
              <TextInput
                value={maxAge}
                onChangeText={(v) => {
                  const num = parseInt(v, 10);
                  if (v === '' || (!isNaN(num) && num >= 30 && num <= 70)) setMaxAge(v);
                }}
                placeholder="70"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Nigeria"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Lagos"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Religion</Text>
              <TextInput
                value={religion}
                onChangeText={setReligion}
                placeholder="Christian, Muslim..."
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Education</Text>
              <TextInput
                value={education}
                onChangeText={setEducation}
                placeholder="BSc, MSc..."
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fullField}>
              <Text style={styles.label}>Work type</Text>
              <TextInput
                value={workType}
                onChangeText={setWorkType}
                placeholder="Tech, Finance, Education..."
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
          </View>

          <GoldButton title="Apply filters" onPress={runSearch} style={styles.filterButton} />
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Searching members...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && results.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search" size={40} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Find Your Match</Text>
          <Text style={styles.emptySubtitle}>
            Search by name, or try one of these popular options
          </Text>

          {/* Popular Tribes */}
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Popular Tribes</Text>
            <View style={styles.suggestionChips}>
              {POPULAR_TRIBES.map((tribeName, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleTribeSearch(tribeName)}
                >
                  <Ionicons name="people" size={14} color={colors.secondary} />
                  <Text style={styles.suggestionChipText}>{tribeName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Locations */}
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Popular Locations</Text>
            <View style={styles.suggestionChips}>
              {POPULAR_LOCATIONS.map((loc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleLocationSearch(loc)}
                >
                  <Ionicons name="location" size={14} color={colors.secondary} />
                  <Text style={styles.suggestionChipText}>{loc.city}, {loc.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  searchButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  // Quick Filters
  quickFiltersScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  quickFilterText: {
    ...typography.small,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
  },
  advancedToggleText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  advancedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
    gap: spacing.xs,
  },
  fullField: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.text.secondary,
  },
  field: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  filterButton: {
    marginTop: spacing.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  // Empty State
  emptyState: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  // Suggestions
  suggestionSection: {
    width: '100%',
    marginTop: spacing.lg,
  },
  suggestionTitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  suggestionChipText: {
    ...typography.small,
    color: colors.secondary,
    fontWeight: '600',
  },
  // Results
  list: {
    paddingBottom: spacing.lg,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.glass.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 1,
    shadowColor: '#1877F2',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  resultMeta: {
    flex: 1,
    gap: 4,
  },
  resultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resultName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  matchBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  resultInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultDetail: {
    ...typography.small,
    color: colors.text.secondary,
  },
  resultTribe: {
    color: colors.secondary,
    fontWeight: '600',
  },
});
