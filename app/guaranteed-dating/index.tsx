import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
  getGuaranteedDatingStatus,
  submitGuaranteedDating,
  requestGuaranteedRefund,
  submitGuaranteedFeedback,
  GuaranteedDatingStatus,
} from '@/api/guaranteedDating';
import { CITIES_BY_COUNTRY, COUNTRIES } from '@/constants/locationData';
import { TRIBES_BY_COUNTRY } from '@/constants/heritageData';

const PRICE = 100;
const GUARANTEE_DAYS = 30;

// App Store Product ID for Guaranteed Dating
const PRODUCT_ID = 'com.tribalmingle.com.concierge';

const LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Acts of Service',
  'Receiving Gifts',
  'Quality Time',
  'Physical Touch',
];

const EDUCATION_LEVELS = [
  'High School',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD/Doctorate',
  'Professional Certification',
  'No Preference',
];

const RELIGIONS = [
  'Christianity',
  'Islam',
  'Traditional African',
  'Judaism',
  'Hinduism',
  'Buddhism',
  'Spiritual but not religious',
  'Agnostic',
  'Atheist',
  'Other',
  'No Preference',
];

const BODY_TYPES = [
  'Slim',
  'Athletic',
  'Average',
  'Curvy',
  'Plus Size',
  'Muscular',
  'No Preference',
];

const RELATIONSHIP_GOALS = [
  'Marriage',
  'Long-term Relationship',
  'Companionship',
  'Dating with Intent',
  'Open to Possibilities',
];

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Cooking', 'Fitness', 'Reading',
  'Art', 'Sports', 'Gaming', 'Dancing', 'Photography', 'Fashion',
  'Business', 'Spirituality', 'Nature', 'Volunteering', 'Tech',
  'Food & Dining', 'Entrepreneurship', 'Family', 'Career', 'Culture',
];

interface MatchPreferences {
  gender: 'male' | 'female' | '';
  ageMin: string;
  ageMax: string;
  country: string;
  city: string;
  tribe: string;
  education: string;
  religion: string;
  bodyType: string;
  heightMin: string;
  heightMax: string;
  loveLanguages: string[];
  relationshipGoal: string;
  interests: string[];
  additionalNotes: string;
}

const initialPreferences: MatchPreferences = {
  gender: '',
  ageMin: '25',
  ageMax: '40',
  country: '',
  city: '',
  tribe: '',
  education: 'No Preference',
  religion: 'No Preference',
  bodyType: 'No Preference',
  heightMin: '',
  heightMax: '',
  loveLanguages: [],
  relationshipGoal: '',
  interests: [],
  additionalNotes: '',
};

export default function GuaranteedDatingScreen() {
  const [status, setStatus] = useState<GuaranteedDatingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [preferences, setPreferences] = useState<MatchPreferences>(initialPreferences);
  const [step, setStep] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getGuaranteedDatingStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err?.message || 'Could not load status');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!preferences.gender) {
      Alert.alert('Required', 'Please select the gender you are looking for');
      return false;
    }
    if (!preferences.country) {
      Alert.alert('Required', 'Please select preferred location');
      return false;
    }
    if (!preferences.relationshipGoal) {
      Alert.alert('Required', 'Please select your relationship goal');
      return false;
    }
    if (preferences.interests.length < 3) {
      Alert.alert('Required', 'Please select at least 3 interests');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) return;
    
    Alert.alert(
      'Confirm Payment',
      `You'll be charged $${PRICE} for our Guaranteed Dating service. If we don't find you a compatible match within ${GUARANTEE_DAYS} days, you'll receive a 100% refund - no questions asked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay $100', onPress: handleSubmit },
      ]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await submitGuaranteedDating({
        preferences: {
          ...preferences,
          ageRange: { min: parseInt(preferences.ageMin), max: parseInt(preferences.ageMax) },
          heightRange: preferences.heightMin && preferences.heightMax 
            ? { min: parseInt(preferences.heightMin), max: parseInt(preferences.heightMax) }
            : undefined,
        },
        notes: preferences.additionalNotes,
        paidAmount: PRICE,
      });
      setStatus(res);
      setShowForm(false);
      Alert.alert(
        'Payment Successful!',
        'Thank you! Our matchmaking team will start searching for your perfect match immediately. You will hear from us within 48 hours.',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!status?.requestId) return Alert.alert('Refund', 'No active request found.');
    Alert.alert(
      'Request Refund',
      `If we haven't delivered a date within ${GUARANTEE_DAYS} days, you're entitled to a full refund. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await requestGuaranteedRefund({ requestId: status.requestId!, reason: `Did not receive a match within ${GUARANTEE_DAYS} days` });
              Alert.alert('Refund Initiated', "Your $100 refund is being processed. You'll receive confirmation within 5 business days.");
              refreshStatus();
            } catch (err: any) {
              Alert.alert('Refund Failed', err?.message || 'Please contact support.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleFeedback = async () => {
    if (!status?.requestId) return Alert.alert('Feedback', 'Complete a date first to leave feedback.');
    Alert.prompt(
      'How did it go?',
      'Share how your date went so we can continue improving.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (feedback: string | undefined) => {
            try {
              setLoading(true);
              await submitGuaranteedFeedback({
                requestId: status.requestId!,
                rating: 5,
                feedback: feedback || 'Great experience!',
                wentOnDate: true,
              });
              Alert.alert('Thank You', 'Your feedback helps us create better matches for everyone.');
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Could not submit feedback.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text',
      'It was a wonderful experience!'
    );
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleLoveLanguage = (lang: string) => {
    setPreferences(prev => ({
      ...prev,
      loveLanguages: prev.loveLanguages.includes(lang)
        ? prev.loveLanguages.filter(l => l !== lang)
        : [...prev.loveLanguages, lang],
    }));
  };

  const hasActiveRequest = status?.status && status.status !== 'Not requested' && status.status !== 'none';

  const renderHero = () => (
    <GlassCard style={styles.heroCard} intensity={32} padding={spacing.xl}>
      <LinearGradient
        colors={['rgba(255,107,157,0.15)', 'rgba(166,77,255,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      />
      <View style={styles.heroContent}>
        <View style={styles.priceTag}>
          <Text style={styles.priceTagText}>$100</Text>
          <Text style={styles.priceTagSub}>one-time</Text>
        </View>
        <Text style={styles.heroTitle}>A Real Date.{'\n'}Guaranteed.</Text>
        <Text style={styles.heroSubtitle}>
          We personally find your perfect match and plan your first date. 
          If you don't go on a real date within {GUARANTEE_DAYS} days, get a full refund - no questions asked.
        </Text>
        <View style={styles.guaranteeBadges}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.trustText}>100% Money-Back</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="time" size={16} color={colors.success} />
            <Text style={styles.trustText}>{GUARANTEE_DAYS}-Day Guarantee</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );

  const renderBenefits = () => (
    <View style={styles.benefitsGrid}>
      {[
        { icon: 'people', title: 'Hand-Picked', desc: 'Personally matched by our team' },
        { icon: 'heart', title: 'Real Dates', desc: 'Not just matches - actual dates' },
        { icon: 'calendar', title: `${GUARANTEE_DAYS} Days`, desc: 'Or your money back' },
        { icon: 'chatbubbles', title: 'Concierge', desc: 'Dedicated matchmaker support' },
      ].map(b => (
        <View key={b.title} style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <Ionicons name={b.icon as any} size={22} color={colors.secondary} />
          </View>
          <Text style={styles.benefitTitle}>{b.title}</Text>
          <Text style={styles.benefitDesc}>{b.desc}</Text>
        </View>
      ))}
    </View>
  );

  const renderFormStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Basic Preferences</Text>
      
      <Text style={styles.label}>I'm looking for a:</Text>
      <View style={styles.genderButtons}>
        <TouchableOpacity
          style={[styles.genderBtn, preferences.gender === 'female' && styles.genderBtnActive]}
          onPress={() => setPreferences(p => ({ ...p, gender: 'female' }))}
        >
          <Ionicons name="female" size={24} color={preferences.gender === 'female' ? colors.primaryDark : colors.text.secondary} />
          <Text style={[styles.genderBtnText, preferences.gender === 'female' && styles.genderBtnTextActive]}>Woman</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderBtn, preferences.gender === 'male' && styles.genderBtnActive]}
          onPress={() => setPreferences(p => ({ ...p, gender: 'male' }))}
        >
          <Ionicons name="male" size={24} color={preferences.gender === 'male' ? colors.primaryDark : colors.text.secondary} />
          <Text style={[styles.genderBtnText, preferences.gender === 'male' && styles.genderBtnTextActive]}>Man</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Age Range</Text>
      <View style={styles.rangeRow}>
        <TextInput
          style={styles.rangeInput}
          placeholder="Min"
          placeholderTextColor={colors.text.tertiary}
          value={preferences.ageMin}
          onChangeText={(v) => setPreferences(p => ({ ...p, ageMin: v }))}
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.rangeTo}>to</Text>
        <TextInput
          style={styles.rangeInput}
          placeholder="Max"
          placeholderTextColor={colors.text.tertiary}
          value={preferences.ageMax}
          onChangeText={(v) => setPreferences(p => ({ ...p, ageMax: v }))}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <Text style={styles.label}>Preferred Country</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={preferences.country}
          onValueChange={(v) => setPreferences(p => ({ ...p, country: v, city: '', tribe: '' }))}
          style={styles.picker}
          dropdownIconColor={colors.secondary}
        >
          <Picker.Item label="Select country..." value="" color={colors.text.tertiary} />
          {COUNTRIES.map(c => (
            <Picker.Item key={c} label={c} value={c} color={colors.text.primary} />
          ))}
        </Picker>
      </View>

      {preferences.country && CITIES_BY_COUNTRY[preferences.country] && (
        <>
          <Text style={styles.label}>Preferred City (Optional)</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={preferences.city}
              onValueChange={(v) => setPreferences(p => ({ ...p, city: v }))}
              style={styles.picker}
              dropdownIconColor={colors.secondary}
            >
              <Picker.Item label="Any city" value="" color={colors.text.tertiary} />
              {CITIES_BY_COUNTRY[preferences.country].map(c => (
                <Picker.Item key={c} label={c} value={c} color={colors.text.primary} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {preferences.country && TRIBES_BY_COUNTRY[preferences.country] && (
        <>
          <Text style={styles.label}>Preferred Tribe/Ethnicity (Optional)</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={preferences.tribe}
              onValueChange={(v) => setPreferences(p => ({ ...p, tribe: v }))}
              style={styles.picker}
              dropdownIconColor={colors.secondary}
            >
              <Picker.Item label="No preference" value="" color={colors.text.tertiary} />
              {TRIBES_BY_COUNTRY[preferences.country].map(t => (
                <Picker.Item key={t} label={t} value={t} color={colors.text.primary} />
              ))}
            </Picker>
          </View>
        </>
      )}
    </View>
  );

  const renderFormStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Background & Lifestyle</Text>

      <Text style={styles.label}>Highest Qualification</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={preferences.education}
          onValueChange={(v) => setPreferences(p => ({ ...p, education: v }))}
          style={styles.picker}
          dropdownIconColor={colors.secondary}
        >
          {EDUCATION_LEVELS.map(e => (
            <Picker.Item key={e} label={e} value={e} color={colors.text.primary} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Religion/Faith</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={preferences.religion}
          onValueChange={(v) => setPreferences(p => ({ ...p, religion: v }))}
          style={styles.picker}
          dropdownIconColor={colors.secondary}
        >
          {RELIGIONS.map(r => (
            <Picker.Item key={r} label={r} value={r} color={colors.text.primary} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Body Type Preference</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={preferences.bodyType}
          onValueChange={(v) => setPreferences(p => ({ ...p, bodyType: v }))}
          style={styles.picker}
          dropdownIconColor={colors.secondary}
        >
          {BODY_TYPES.map(b => (
            <Picker.Item key={b} label={b} value={b} color={colors.text.primary} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Height Range (cm) - Optional</Text>
      <View style={styles.rangeRow}>
        <TextInput
          style={styles.rangeInput}
          placeholder="Min"
          placeholderTextColor={colors.text.tertiary}
          value={preferences.heightMin}
          onChangeText={(v) => setPreferences(p => ({ ...p, heightMin: v }))}
          keyboardType="numeric"
          maxLength={3}
        />
        <Text style={styles.rangeTo}>to</Text>
        <TextInput
          style={styles.rangeInput}
          placeholder="Max"
          placeholderTextColor={colors.text.tertiary}
          value={preferences.heightMax}
          onChangeText={(v) => setPreferences(p => ({ ...p, heightMax: v }))}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>

      <Text style={styles.label}>Relationship Goal</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={preferences.relationshipGoal}
          onValueChange={(v) => setPreferences(p => ({ ...p, relationshipGoal: v }))}
          style={styles.picker}
          dropdownIconColor={colors.secondary}
        >
          <Picker.Item label="Select goal..." value="" color={colors.text.tertiary} />
          {RELATIONSHIP_GOALS.map(g => (
            <Picker.Item key={g} label={g} value={g} color={colors.text.primary} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderFormStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>Personality & Interests</Text>

      <Text style={styles.label}>Their Love Language(s)</Text>
      <Text style={styles.labelHint}>Select all that matter to you</Text>
      <View style={styles.chipsContainer}>
        {LOVE_LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.chip, preferences.loveLanguages.includes(lang) && styles.chipActive]}
            onPress={() => toggleLoveLanguage(lang)}
          >
            <Text style={[styles.chipText, preferences.loveLanguages.includes(lang) && styles.chipTextActive]}>
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Shared Interests (Select at least 3)</Text>
      <Text style={styles.labelHint}>{preferences.interests.length} selected</Text>
      <View style={styles.chipsContainer}>
        {INTERESTS.map(interest => (
          <TouchableOpacity
            key={interest}
            style={[styles.chip, preferences.interests.includes(interest) && styles.chipActive]}
            onPress={() => toggleInterest(interest)}
          >
            <Text style={[styles.chipText, preferences.interests.includes(interest) && styles.chipTextActive]}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Anything else we should know?</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="E.g., dealbreakers, must-haves, personality traits, lifestyle preferences..."
        placeholderTextColor={colors.text.tertiary}
        multiline
        numberOfLines={4}
        value={preferences.additionalNotes}
        onChangeText={(v) => setPreferences(p => ({ ...p, additionalNotes: v }))}
      />
    </View>
  );

  const renderForm = () => (
    <GlassCard style={styles.formCard} intensity={28} padding={spacing.lg}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Tell Us About Your Ideal Match</Text>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
          ))}
        </View>
      </View>

      {step === 1 && renderFormStep1()}
      {step === 2 && renderFormStep2()}
      {step === 3 && renderFormStep3()}

      <View style={styles.formActions}>
        {step > 1 && (
          <GoldButton
            title="Back"
            variant="secondary"
            onPress={() => setStep(s => s - 1)}
            style={{ flex: 1 }}
          />
        )}
        {step < 3 ? (
          <GoldButton
            title="Next"
            onPress={() => setStep(s => s + 1)}
            style={{ flex: step > 1 ? 1 : undefined }}
          />
        ) : (
          <GoldButton
            title={`Pay $${PRICE} & Submit`}
            onPress={handleProceedToPayment}
            style={{ flex: 1 }}
            disabled={loading}
          />
        )}
      </View>

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={14} color={colors.text.tertiary} />
        <Text style={styles.securityText}>Secure payment - 100% refund if no date in {GUARANTEE_DAYS} days</Text>
      </View>
    </GlassCard>
  );

  const renderStatus = () => (
    <GlassCard style={styles.statusCard} intensity={28} padding={spacing.lg}>
      <View style={styles.statusHeader}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        <Text style={styles.statusTitle}>Your Request is Active</Text>
      </View>
      <View style={styles.statusContent}>
        <StatusRow icon="checkmark-circle" label="Status" value={status?.status || 'Processing'} />
        {status?.daysRemaining !== undefined && (
          <StatusRow icon="calendar" label="Days Remaining" value={`${status.daysRemaining} days`} />
        )}
        <StatusRow icon="cash" label="Amount Paid" value="$100" />
        {status?.match?.name && (
          <>
            <View style={styles.matchDivider} />
            <Text style={styles.matchLabel}>Your Match</Text>
            <StatusRow icon="person" label="Name" value={status.match.name} />
            {status.match.venue && <StatusRow icon="location" label="Venue" value={status.match.venue} />}
            {status.match.date && <StatusRow icon="calendar" label="Date" value={status.match.date} />}
          </>
        )}
      </View>
      <View style={styles.actionsRow}>
        <GoldButton title="Refresh" variant="secondary" onPress={refreshStatus} style={styles.actionBtn} />
        {status?.match?.name && (
          <GoldButton title="Feedback" variant="secondary" onPress={handleFeedback} style={styles.actionBtn} />
        )}
        <GoldButton title="Refund" variant="secondary" onPress={handleRefund} style={styles.actionBtn} />
      </View>
    </GlassCard>
  );

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Guaranteed Dating"
      showBottomNav
    >
      {renderHero()}
      {renderBenefits()}

      {loading && !showForm && <ActivityIndicator color={colors.secondary} style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {hasActiveRequest ? (
        renderStatus()
      ) : showForm ? (
        renderForm()
      ) : (
        <GlassCard style={styles.ctaCard} intensity={24} padding={spacing.lg}>
          <View style={styles.ctaPriceRow}>
            <Text style={styles.ctaPrice}>$100</Text>
            <Text style={styles.ctaPriceSub}>one-time payment</Text>
          </View>
          <Text style={styles.ctaText}>
            Ready to meet someone special? Fill out your preferences and let our matchmakers do the rest.
          </Text>
          <GoldButton
            title="Get Started"
            onPress={() => setShowForm(true)}
            disabled={loading}
          />
          <View style={styles.ctaGuarantee}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.ctaGuaranteeText}>
              100% refund if we don't find you a date within {GUARANTEE_DAYS} days
            </Text>
          </View>
        </GlassCard>
      )}

      {/* How It Works */}
      <GlassCard style={styles.card} intensity={20} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <Step number={1} title="Fill Your Preferences" desc="Tell us exactly what you're looking for in a partner." />
          <Step number={2} title="Pay $100" desc="One-time fee with 100% money-back guarantee." />
          <Step number={3} title="We Find Your Match" desc="Our team handpicks compatible partners from our verified community." />
          <Step number={4} title="Go On Your Date" desc={`Within ${GUARANTEE_DAYS} days, or your money back.`} />
        </View>
      </GlassCard>
    </UniversalBackground>
  );
}

const Step = ({ number, title, desc }: { number: number; title: string; desc: string }) => (
  <View style={styles.step}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  </View>
);

const StatusRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.statusRow}>
    <Ionicons name={icon} size={18} color={colors.secondary} />
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={styles.statusValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  heroContent: {
    gap: spacing.md,
  },
  priceTag: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  priceTagText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  priceTagSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 38,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  guaranteeBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  trustText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  ctaCard: {
    gap: spacing.md,
    alignItems: 'center',
  },
  ctaPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  ctaPrice: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.secondary,
  },
  ctaPriceSub: {
    ...typography.body,
    color: colors.text.secondary,
  },
  ctaText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  ctaGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ctaGuaranteeText: {
    ...typography.caption,
    color: colors.success,
  },
  formCard: {
    gap: spacing.lg,
  },
  formHeader: {
    gap: spacing.sm,
  },
  formTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: {
    backgroundColor: colors.secondary,
  },
  formSection: {
    gap: spacing.md,
  },
  formSectionTitle: {
    ...typography.h4,
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  labelHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  genderBtnText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  genderBtnTextActive: {
    color: colors.primaryDark,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    ...typography.body,
    textAlign: 'center',
  },
  rangeTo: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text.primary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: colors.secondary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.secondary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  securityText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  statusCard: {
    gap: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  statusContent: {
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  statusValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  matchDivider: {
    height: 1,
    backgroundColor: colors.glass.stroke,
    marginVertical: spacing.sm,
  },
  matchLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minWidth: 80,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  stepDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  loader: {
    marginTop: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});
