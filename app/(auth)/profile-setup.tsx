import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

const interestOptions = ['African music', 'Fashion', 'Dance', 'Culture', 'Foodie', 'Travel', 'Art', 'Tech'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [tribe, setTribe] = useState(user?.tribe || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || ['African music']);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const profileCompletion = useMemo(() => {
    const fields = [tribe, country, city, bio];
    const filled = fields.filter((field) => field.trim().length > 0).length;
    const base = (filled / fields.length) * 70; // weight core fields heavily
    const interestBonus = selectedInterests.length > 1 ? 10 : 0;
    return Math.min(90, Math.round(base + interestBonus));
  }, [tribe, country, city, bio, selectedInterests.length]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  };

  const handleContinue = () => {
    setErrorMessage('');
    if (!tribe.trim()) return setErrorMessage('Please add your tribe');
    if (!country.trim()) return setErrorMessage('Please add your country');
    if (!city.trim()) return setErrorMessage('Please add your city');

    setLoading(true);
    setTimeout(() => {
      updateUser({
        tribe: tribe.trim(),
        country: country.trim(),
        city: city.trim(),
        bio: bio.trim(),
        interests: selectedInterests,
        profileCompletion,
      });
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 500);
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Add a few details so we can tailor matches for you</Text>

          <GlassCard style={styles.card}>
            <CustomInput label="Tribe" placeholder="e.g. Yoruba" value={tribe} onChangeText={setTribe} editable={!loading} />
            <CustomInput label="Country" placeholder="e.g. Nigeria" value={country} onChangeText={setCountry} editable={!loading} />
            <CustomInput label="City" placeholder="e.g. Lagos" value={city} onChangeText={setCity} editable={!loading} />

            <View style={styles.bioContainer}>
              <Text style={styles.label}>Short Bio</Text>
              <TextInput
                style={styles.bioInput}
                placeholder="Share a little about yourself, culture, and what you're looking for"
                placeholderTextColor={colors.text.primary}
                value={bio}
                onChangeText={setBio}
                multiline
                editable={!loading}
              />
            </View>

            <View style={styles.interestContainer}>
              <Text style={styles.label}>Interests</Text>
              <View style={styles.interestChips}>
                {interestOptions.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleInterest(interest)}
                      disabled={loading}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{interest}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.completionRow}>
              <Text style={styles.completionText}>Profile completion</Text>
              <Text style={styles.completionValue}>{profileCompletion}%</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <PrimaryButton title="Finish Setup" onPress={handleContinue} loading={loading} disabled={loading} />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.screenPadding, paddingTop: 60 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.styles.h1, color: colors.text.primary, marginBottom: spacing.xs, fontFamily: typography.fontFamily.display },
  subtitle: { ...typography.styles.body, color: colors.text.primary, marginBottom: spacing['2xl'], fontFamily: typography.fontFamily.sans },
  card: { padding: spacing.cardPaddingLarge },
  bioContainer: { marginBottom: spacing.lg },
  label: { ...typography.styles.label, marginBottom: spacing.xs, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  bioInput: {
    minHeight: 110,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.medium,
    backgroundColor: colors.glass.light,
    color: colors.text.primary,
    ...typography.styles.body,
    textAlignVertical: 'top',
    fontFamily: typography.fontFamily.sans,
  },
  interestContainer: { marginBottom: spacing.lg },
  interestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.medium,
    backgroundColor: colors.glass.light,
  },
  chipActive: { borderColor: colors.orange.primary, backgroundColor: 'rgba(249, 115, 22, 0.12)' },
  chipText: { ...typography.styles.bodySmall, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  chipTextActive: { color: colors.orange.primary, fontWeight: '700' },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  completionText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  completionValue: { ...typography.styles.h3, color: colors.text.primary, fontFamily: typography.fontFamily.display },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
  errorText: { ...typography.styles.body, color: colors.error, marginLeft: spacing.sm, flex: 1, fontFamily: typography.fontFamily.sans },
});