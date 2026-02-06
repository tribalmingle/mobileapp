import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/api/upload';

interface Props {
  selfieUrl: string;
  onUpdate: (selfiePhoto: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const SelfieVerificationStep: React.FC<Props> = ({ selfieUrl, onUpdate, onNext, onBack, onSkip, currentStep, totalSteps }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState(selfieUrl);

  const uploadSelfie = async (source: 'camera' | 'gallery') => {
    try {
      setError(null);
      const permissionResult =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') return;

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsMultipleSelection: false,
              quality: 0.8,
              allowsEditing: false,
            });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;

      setUploading(true);
      const uploadedUrl = await uploadImageAsync(pickerResult.assets[0].uri, 'selfie');
      setLocalUrl(uploadedUrl);
      onUpdate(uploadedUrl);
    } catch (err: any) {
      const message = err?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    onUpdate(localUrl);
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
        <Text style={styles.title}>Selfie Verification</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>If you uploaded an ID, add a quick selfie to complete verification. This step is optional.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Capture or Upload</Text>
          <Text style={styles.sectionHint}>Good lighting, no filters, face fully visible.</Text>

          <TouchableOpacity style={[styles.actionButton, uploading && styles.actionButtonDisabled]} onPress={() => uploadSelfie('camera')} disabled={uploading}>
            <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {uploading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>Take a Selfie</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, uploading && styles.actionButtonDisabled]} onPress={() => uploadSelfie('gallery')} disabled={uploading}>
            <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
          </TouchableOpacity>

          {localUrl ? <Text style={styles.statusSuccess}>Selfie uploaded ✔</Text> : <Text style={styles.statusPending}>No selfie yet</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.primaryCta, (uploading || !localUrl) && styles.primaryCtaDisabled]} onPress={handleContinue} disabled={uploading || !localUrl}>
          <LinearGradient colors={localUrl && !uploading ? ['#FF6B9D', '#F97316'] : ['#9CA3AF', '#6B7280']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.primaryText}>{uploading ? 'Uploading...' : localUrl ? 'Continue' : 'Add a selfie'}</Text>
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
  card: {
    backgroundColor: 'rgba(157, 78, 221, 0.25)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
  },
  sectionTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 16 },
  actionButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  actionButtonDisabled: { opacity: 0.85 },
  buttonGradient: { paddingVertical: 14, alignItems: 'center' },
  actionText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  statusSuccess: { color: '#34D399', fontSize: 13, fontWeight: '600', marginTop: 4 },
  statusPending: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, marginTop: 4 },
  errorText: { color: '#F87171', fontSize: 13, marginTop: 6 },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(49, 46, 129, 0.95)' },
  primaryCta: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  primaryCtaDisabled: { opacity: 0.9 },
  primaryGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default SelfieVerificationStep;
