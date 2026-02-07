import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StepProgressHeader from '@/components/StepProgressHeader';

interface Props {
  interests: string[];
  loveLanguage: string[];
  onUpdate: (interests: string[], loveLanguage: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const INTEREST_OPTIONS = [
  'African Music', 'Dance', 'Fashion', 'Culture', 'Cooking', 'Travel',
  'Art', 'Sports', 'Reading', 'Movies', 'Photography', 'Fitness'
];

const LOVE_LANGUAGE_OPTIONS = [
  'Words of Affirmation',
  'Quality Time',
  'Acts of Service',
  'Physical Touch',
  'Receiving Gifts'
];

const InterestsStep: React.FC<Props> = ({ interests, loveLanguage, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [selected, setSelected] = useState<string[]>(interests);
  const [selectedLoveLanguage, setSelectedLoveLanguage] = useState<string[]>(loveLanguage);

  const toggle = (interest: string) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter((i) => i !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  };

  const handleContinue = () => {
    onUpdate(selected, selectedLoveLanguage);
    onNext();
  };

  const toggleLoveLanguage = (language: string) => {
    if (selectedLoveLanguage.includes(language)) {
      setSelectedLoveLanguage(selectedLoveLanguage.filter((item) => item !== language));
      return;
    }
    if (selectedLoveLanguage.length >= 3) {
      return;
    }
    setSelectedLoveLanguage([...selectedLoveLanguage, language]);
  };

  return (
    <View style={styles.container}>
      <StepProgressHeader
        currentStep={currentStep}
        title="Interests"
        onBack={onBack}
        onSkip={onSkip}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>What are you interested in?</Text>
        <Text style={styles.description}>Select at least 3 interests</Text>

        <View style={styles.optionsContainer}>
          {INTEREST_OPTIONS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[styles.option, selected.includes(interest) && styles.optionSelected]}
              onPress={() => toggle(interest)}
            >
              <Text style={[styles.optionText, selected.includes(interest) && styles.optionTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subtitle, styles.sectionSpacing]}>Love language</Text>
        <Text style={styles.description}>Select up to 3 ways you prefer to receive love.</Text>
        <View style={styles.optionsContainer}>
          {LOVE_LANGUAGE_OPTIONS.map((language) => (
            <TouchableOpacity
              key={language}
              style={[styles.option, selectedLoveLanguage.includes(language) && styles.optionSelected]}
              onPress={() => toggleLoveLanguage(language)}
            >
              <Text style={[styles.optionText, selectedLoveLanguage.includes(language) && styles.optionTextSelected]}>
                {language}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helperText}>{selectedLoveLanguage.length}/3 selected{selectedLoveLanguage.length >= 3 ? ' (max reached)' : ''}</Text>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  progressBar: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#FF6B9D', borderRadius: 2 },
  progressText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  skipText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  subtitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16 },
  helperText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 8 },
  sectionSpacing: { marginTop: 24 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  option: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 6, marginBottom: 10 },
  optionSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  optionText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default InterestsStep;
