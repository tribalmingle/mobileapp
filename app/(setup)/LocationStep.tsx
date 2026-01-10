import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';

import { COUNTRIES, CITIES_BY_COUNTRY } from '../../src/constants/locationData';

interface Props {
  location: { country: string; city: string };
  onUpdate: (location: { country: string; city: string }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const LocationStep: React.FC<Props> = ({
  location,
  onUpdate,
  onNext,
  onBack,
  onSkip,
  currentStep,
  totalSteps,
}) => {
  const [country, setCountry] = useState(location.country);
  const [city, setCity] = useState(location.city);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!country.trim() || !city.trim()) {
      setError('Please add both country and city (or use detect location).');
      return;
    }
    setError(null);
    onUpdate({ country, city });
    onNext();
  };

  const detectLocation = async () => {
    try {
      setError(null);
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please fill manually.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync(position.coords);
      if (geo) {
        const detectedCountry = geo.country || country;
        const detectedCity = geo.city || geo.subregion || city;
        setCountry(detectedCountry || '');
        setCity(detectedCity || '');
        onUpdate({ country: detectedCountry || '', city: detectedCity || '' });
      }
    } catch (err: any) {
      const message = err?.message || 'Could not detect location. Please fill manually.';
      setError(message);
    } finally {
      setLocating(false);
    }
  };

  const selectCountry = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setCity('');
    setShowCountryPicker(false);
  };

  const selectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCityPicker(false);
  };

  const availableCities = country && CITIES_BY_COUNTRY[country] ? CITIES_BY_COUNTRY[country] : [];

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
            <Path
              d="M15 18L9 12L15 6"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Location</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Where do you live?</Text>
        <Text style={styles.description}>
          This helps us connect you with people nearby
        </Text>

        <TouchableOpacity style={styles.detectButton} onPress={detectLocation} disabled={locating}>
          <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.detectGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.detectText}>{locating ? 'Detecting...' : 'Use my current location'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={[styles.dropdownText, !country && styles.placeholderText]}>
                {country || 'Select your country'}
              </Text>
              <Svg width="20" height="20" viewBox="0 0 20 20">
                <Path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City</Text>
            {country && availableCities.length > 0 ? (
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCityPicker(true)}
              >
                <Text style={[styles.dropdownText, !city && styles.placeholderText]}>
                  {city || 'Select your city'}
                </Text>
                <Svg width="20" height="20" viewBox="0 0 20 20">
                  <Path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter your city"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={city}
                onChangeText={setCity}
              />
            )}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
              data={COUNTRIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => selectCountry(item)}
                >
                  <Text style={styles.countryText}>{item}</Text>
                  {country === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => selectCity(item)}
                >
                  <Text style={styles.countryText}>{item}</Text>
                  {city === item && <Text style={styles.checkmark}>✓</Text>}
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    lineHeight: 20,
  },
  detectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detectGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  detectText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(157, 78, 221, 0.25)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
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
  dropdownText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 20,
    color: '#FF6B9D',
    fontWeight: '700',
  },
  errorText: {
    color: '#F87171',
    marginTop: 8,
    fontSize: 13,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(49, 46, 129, 0.95)',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LocationStep;
