import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface Work {
  occupation: string;
  workType: string;
}

interface Props {
  work: Work;
  onUpdate: (work: Work) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const WORK_TYPES = ['Full-time', 'Part-time', 'Self-employed', 'Freelance', 'Student', 'Retired'];

const WorkStep: React.FC<Props> = ({ work, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [occupation, setOccupation] = useState(work.occupation);
  const [workType, setWorkType] = useState(work.workType);

  const handleContinue = () => {
    onUpdate({ occupation, workType });
    onNext();
  };

  const handleOccupationChange = (value: string) => {
    setOccupation(value);
    onUpdate({ occupation: value, workType });
  };

  const handleWorkTypeChange = (value: string) => {
    setWorkType(value);
    onUpdate({ occupation, workType: value });
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
        <Text style={styles.title}>Work</Text>
        <TouchableOpacity onPress={onSkip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you do?"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={occupation}
              onChangeText={handleOccupationChange}
            />
          </View>

          <Text style={styles.label}>Work Type</Text>
          <View style={styles.optionsRow}>
            {WORK_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.option, workType === type && styles.optionSelected]}
                onPress={() => handleWorkTypeChange(type)}
              >
                <Text style={[styles.optionText, workType === type && styles.optionTextSelected]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  card: { backgroundColor: 'rgba(157, 78, 221, 0.25)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', padding: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  option: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 6, marginBottom: 10 },
  optionSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  optionText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default WorkStep;
