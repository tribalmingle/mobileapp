import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StepProgressHeader from '@/components/StepProgressHeader';
import { HERITAGE_COUNTRIES, getTribesForCountry } from '@/constants/heritageData';

interface Props {
  heritage: { country: string; tribe: string };
  onUpdate: (heritage: { country: string; tribe: string }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const HeritageStep: React.FC<Props> = ({ heritage, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [country, setCountry] = useState(heritage.country);
  const [tribe, setTribe] = useState(heritage.tribe);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showTribePicker, setShowTribePicker] = useState(false);
  const [tribeSearch, setTribeSearch] = useState('');

  const tribesForCountry = useMemo(() => getTribesForCountry(country), [country]);
  const filteredTribes = useMemo(() => {
    if (!tribeSearch.trim()) return tribesForCountry;
    const term = tribeSearch.toLowerCase();
    return tribesForCountry.filter((t) => t.toLowerCase().includes(term));
  }, [tribeSearch, tribesForCountry]);

  const handleContinue = () => {
    onUpdate({ country, tribe });
    onNext();
  };

  const selectCountry = (value: string) => {
    setCountry(value);
    setTribe('');
    setShowCountryPicker(false);
  };

  const selectTribe = (value: string) => {
    setTribe(value);
    setShowTribePicker(false);
  };

  return (
    <View style={styles.container}>
      <StepProgressHeader
        currentStep={currentStep}
        title="Heritage"
        onBack={onBack}
        onSkip={onSkip}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Where is your heritage from?</Text>
        <Text style={styles.description}>Select your country of origin and tribe/ethnicity (optional)</Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country/Origin</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowCountryPicker(true)}>
              <Text style={[styles.dropdownText, !country && styles.placeholderText]}>
                {country || 'Select your country'}
              </Text>
              <Svg width="20" height="20" viewBox="0 0 20 20">
                <Path d="M5 7.5L10 12.5L15 7.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tribe / Ethnicity</Text>
            {country && tribesForCountry.length > 0 ? (
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowTribePicker(true)}>
                <Text style={[styles.dropdownText, !tribe && styles.placeholderText]}>
                  {tribe || 'Select your tribe/ethnicity'}
                </Text>
                <Svg width="20" height="20" viewBox="0 0 20 20">
                  <Path d="M5 7.5L10 12.5L15 7.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Type your tribe/ethnicity"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={tribe}
                onChangeText={setTribe}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={HERITAGE_COUNTRIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => selectCountry(item)}>
                  <Text style={styles.countryText}>{item}</Text>
                  {country === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTribePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTribePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tribe / Ethnicity</Text>
              <TouchableOpacity onPress={() => setShowTribePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                style={styles.searchInput}
                value={tribeSearch}
                onChangeText={setTribeSearch}
              />
            </View>
            <FlatList
              data={filteredTribes}
              keyExtractor={(item) => item}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No suggestions found. You can type your tribe manually.</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => selectTribe(item)}>
                  <Text style={styles.countryText}>{item}</Text>
                  {tribe === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <LinearGradient
            colors={['#FF6B9D', '#F97316']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  skipText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  subtitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 24, lineHeight: 20 },
  card: {
    backgroundColor: 'rgba(157, 78, 221, 0.25)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: { fontSize: 16, color: '#FFFFFF' },
  placeholderText: { color: 'rgba(255, 255, 255, 0.5)' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F1B3D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  modalClose: { fontSize: 24, color: '#FFFFFF', fontWeight: '300' },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryText: { fontSize: 16, color: '#FFFFFF' },
  checkmark: { fontSize: 20, color: '#FF6B9D', fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyState: { padding: 20 },
  emptyText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, textAlign: 'center' },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(49, 46, 129, 0.95)',
  },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default HeritageStep;
