import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface PersonalDetails {
  height: string;
  bodyType: string;
  maritalStatus: string;
  education: string;
}

interface Props {
  personalDetails: PersonalDetails;
  onUpdate: (personalDetails: PersonalDetails) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const options = {
  height: ["Under 5'0\"", "5'0\" - 5'4\"", "5'5\" - 5'9\"", "5'10\" - 6'2\"", "Over 6'2\""],
  bodyType: ['Slim', 'Athletic', 'Average', 'Curvy', 'Muscular'],
  maritalStatus: ['Single', 'Divorced', 'Widowed'],
  education: ["High School", "Bachelor's", "Master's", 'PhD', 'Other'],
};

const PersonalDetailsStep: React.FC<Props> = ({ personalDetails, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [selected, setSelected] = useState(personalDetails);

  const handleSelect = (key: keyof PersonalDetails, value: string) => {
    setSelected({ ...selected, [key]: value });
  };

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
        <Text style={styles.title}>Personal Details</Text>
        <TouchableOpacity onPress={onSkip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {Object.entries(options).map(([key, values]) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
            <View style={styles.optionsRow}>
              {values.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.option, selected[key as keyof PersonalDetails] === value && styles.optionSelected]}
                  onPress={() => handleSelect(key as keyof PersonalDetails, value)}
                >
                  <Text style={[styles.optionText, selected[key as keyof PersonalDetails] === value && styles.optionTextSelected]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '600', marginBottom: 12 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  option: {
    marginHorizontal: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  optionText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default PersonalDetailsStep;
