import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface Props {
  lookingFor: string;
  onUpdate: (lookingFor: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const OPTIONS = [
  { value: 'Marriage', label: 'Marriage', emoji: '💍' },
  { value: 'Longterm relationship', label: 'Longterm relationship', emoji: '❤️' },
  { value: 'Friendship', label: 'Friendship', emoji: '🤝' },
  { value: 'Casual Dating', label: 'Casual Dating', emoji: '😊' },
  { value: 'Not sure yet', label: 'Not sure yet', emoji: '🤔' },
];

const LookingForStep: React.FC<Props> = ({ lookingFor, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [selected, setSelected] = useState(lookingFor);

  const handleContinue = () => {
    onUpdate(selected);
    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Looking For</Text>
        <TouchableOpacity onPress={onSkip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>What are you looking for?</Text>
        <Text style={styles.description}>Let people know your relationship goals</Text>

        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, selected === option.value && styles.optionSelected]}
            onPress={() => setSelected(option.value)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.optionText, selected === option.value && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>Complete Profile</Text>
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
  description: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 24, lineHeight: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  optionSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  emoji: { fontSize: 24, marginRight: 12 },
  optionText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', flex: 1 },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default LookingForStep;
