import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/api/upload';

interface IDVerification {
  url: string;
  type: string;
}

interface Props {
  idVerification: IDVerification;
  onUpdate: (idVerification: IDVerification) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const ID_TYPES: IDVerification['type'][] = ['national_id', 'passport', 'driver_license'];

const IDVerificationStep: React.FC<Props> = ({ idVerification, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [selectedType, setSelectedType] = useState<IDVerification['type']>(idVerification.type || 'national_id');
  const [documentUrl, setDocumentUrl] = useState(idVerification.url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploading(true);
        setError(null);
        try {
          const uploadedUrl = await uploadImageAsync(result.assets[0].uri, 'id');
          setDocumentUrl(uploadedUrl);
          onUpdate({ url: uploadedUrl, type: selectedType });
        } catch (err: any) {
          const message = err?.message || 'Upload failed. Please try again.';
          setError(message);
        } finally {
          setUploading(false);
        }
      }
    } catch (error: any) {
      const message = error?.message || 'Error selecting document. Please try again.';
      setError(message);
    }
  };

  const handleContinue = () => {
    onUpdate({ url: documentUrl, type: selectedType });
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
        <Text style={styles.title}>Verify Your ID</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Upload a government-issued ID to keep the community safe.</Text>

        <Text style={styles.sectionLabel}>Select ID Type</Text>
        <View style={styles.pillRow}>
          {ID_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, selectedType === type && styles.pillSelected]}
              onPress={() => {
                setSelectedType(type);
                onUpdate({ url: documentUrl, type });
              }}
            >
              <Text style={[styles.pillText, selectedType === type && styles.pillTextSelected]}>
                {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.uploadCard}>
          <Text style={styles.uploadTitle}>Upload ID Photo</Text>
          <Text style={styles.uploadHint}>Clear photo of the front of your selected ID type.</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument} disabled={uploading}>
            <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.uploadGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.uploadButtonText}>{documentUrl ? 'Replace Upload' : 'Upload ID'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          {documentUrl ? <Text style={styles.uploadStatus}>ID uploaded ✔</Text> : <Text style={styles.uploadStatusPending}>No document yet</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, (uploading || !documentUrl) && styles.buttonDisabled]} onPress={handleContinue} disabled={uploading || !documentUrl}>
          <LinearGradient
            colors={documentUrl && !uploading ? ['#FF6B9D', '#F97316'] : ['#9CA3AF', '#6B7280']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{uploading ? 'Uploading...' : documentUrl ? 'Continue' : 'Upload your ID'}</Text>
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
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 16, lineHeight: 22 },
  sectionLabel: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 6,
    marginBottom: 10,
  },
  pillSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  pillText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  pillTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  uploadCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
  },
  uploadTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', marginBottom: 6 },
  uploadHint: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 12 },
  uploadButton: { borderRadius: 12, overflow: 'hidden' },
  uploadGradient: { paddingVertical: 14, alignItems: 'center' },
  uploadButtonText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  uploadStatus: { marginTop: 10, color: '#34D399', fontSize: 13, fontWeight: '600' },
  uploadStatusPending: { marginTop: 10, color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 },
  errorText: { color: '#F87171', marginTop: 6, fontSize: 13 },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  button: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.8 },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default IDVerificationStep;
