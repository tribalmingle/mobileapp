import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GoldButton from '@/components/universal/GoldButton';
import { fetchRecommendations, Recommendation, DiscoverFilters } from '@/api/discovery';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
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

  const runSearch = async () => {
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
      setError(err?.message || 'Could not fetch search results');
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="person" size={20} color={colors.text.secondary} />
          </View>
        )}
      </View>
      <View style={styles.resultMeta}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
          {item.age ? `, ${item.age}` : ''}
        </Text>
        <Text style={styles.resultDetail} numberOfLines={1}>
          {[item.city, item.country].filter(Boolean).join(', ') || 'Location not set'}
        </Text>
        <Text style={styles.resultDetail} numberOfLines={1}>
          {item.tribe || 'Tribe not set'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <UniversalBackground
      scrollable
      useGradient={false}
      title="Search"
      showBackButton
      showBottomNav
      contentContainerStyle={styles.container}
    >
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, city, tribe, country"
          placeholderTextColor={colors.input.placeholder}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={runSearch}
        />
        <TouchableOpacity onPress={runSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

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
                onChangeText={setMinAge}
                placeholder="18"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Max age</Text>
              <TextInput
                value={maxAge}
                onChangeText={setMaxAge}
                placeholder="40"
                keyboardType="number-pad"
                placeholderTextColor={colors.input.placeholder}
                style={styles.field}
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
          <Text style={styles.emptyTitle}>Start typing to search</Text>
          <Text style={styles.emptySubtitle}>Use basic or advanced filters to match what you want.</Text>
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.input.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  searchButtonText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  advancedToggleText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  advancedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.input.text,
  },
  filterButton: {
    marginTop: spacing.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  resultImageWrapper: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
  resultMeta: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    ...typography.body,
    color: colors.black,
    fontWeight: '700',
  },
  resultDetail: {
    ...typography.small,
    color: colors.dark.navy,
  },
});
