import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/api/upload';
import StepProgressHeader from '@/components/StepProgressHeader';

const { width } = Dimensions.get('window');

interface Props {
  photos: string[];
  onUpdate: (photos: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const PhotoUploadStep: React.FC<Props> = ({ photos, onUpdate, onNext, onBack, currentStep, totalSteps }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inFlightTotal, setInFlightTotal] = useState(0);
  const [inFlightIndex, setInFlightIndex] = useState(0);
  const [lastUris, setLastUris] = useState<string[]>([]);

  const uploadSelectedImages = async (uris: string[]) => {
    setUploading(true);
    setError(null);
    setInFlightTotal(uris.length);
    setInFlightIndex(0);
    setLastUris(uris);
    const uploaded: string[] = [];

    for (const uri of uris) {
      try {
        setInFlightIndex((prev) => prev + 1);
        const url = await uploadImageAsync(uri, 'profile');
        uploaded.push(url);
      } catch (err: any) {
        const message = err?.message || 'Upload failed. Please try again.';
        setError(message);
        break;
      }
    }

    if (uploaded.length) {
      onUpdate([...photos, ...uploaded].slice(0, 10));
    }

    setUploading(false);
    setInFlightTotal(0);
    setInFlightIndex(0);
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onUpdate(next);
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    movePhoto(index, 0);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map((asset) => asset.uri).filter(Boolean);
        if (uris.length) {
          await uploadSelectedImages(uris);
        }
      }
    } catch (error: any) {
      const message = error?.message || 'Error picking image. Please try again.';
      setError(message);
    }
  };

  const handlePhotoSlotPress = (index: number) => {
    if (photos[index]) {
      setPrimary(index);
      return;
    }
    if (photos.length < 10 && !photos[index]) {
      pickImage();
    }
  };

  return (
    <View style={styles.container}>
      <StepProgressHeader
        currentStep={currentStep}
        title="Add Photos"
        onBack={onBack}
        showSkip={false}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Upload 1-10 photos to complete your profile</Text>
        <Text style={styles.description}>Add photos that show your personality. You can upload between 1 and 10 photos.</Text>

        <View style={styles.photoGrid}>
          {[...Array(10)].map((_, index) => (
            <TouchableOpacity key={index} style={styles.photoSlot} onPress={() => handlePhotoSlotPress(index)} activeOpacity={0.7}>
              {photos[index] ? (
                <View style={styles.photoWrapper}>
                  <Image source={{ uri: photos[index] }} style={styles.photoPreview} />
                  {index === 0 ? <View style={styles.primaryBadge}><Text style={styles.primaryText}>PRIMARY</Text></View> : null}
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, index === 0 && styles.actionDisabled]}
                      onPress={() => setPrimary(index)}
                      disabled={index === 0}
                    >
                      <Text style={styles.actionText}>Set primary</Text>
                    </TouchableOpacity>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.moveButton, index === 0 && styles.actionDisabled]}
                        onPress={() => movePhoto(index, index - 1)}
                        disabled={index === 0}
                      >
                        <Text style={styles.moveText}>←</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.moveButton, index === photos.length - 1 && styles.actionDisabled]}
                        onPress={() => movePhoto(index, index + 1)}
                        disabled={index === photos.length - 1}
                      >
                        <Text style={styles.moveText}>→</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : index === 0 ? (
                <View style={styles.addPhotoButton}>
                  <Text style={styles.plusIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </View>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.plusIconSmall}>+</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>{photos.length}/10 photos uploaded</Text>
        {uploading && (
          <View style={styles.uploadRow}>
            <ActivityIndicator color="#FF6B9D" size="small" />
            <Text style={styles.uploadText}>
              Uploading photos... {Math.min(inFlightIndex, inFlightTotal)}/{inFlightTotal || ' ?'}
            </Text>
          </View>
        )}
        {error && (
          <View style={{ gap: 6 }}>
            <Text style={styles.errorText}>{error}</Text>
            {lastUris.length > 0 && !uploading ? (
              <TouchableOpacity style={styles.retryButton} onPress={() => uploadSelectedImages(lastUris)}>
                <Text style={styles.retryText}>Retry last upload</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.buttonDisabled]} onPress={onNext} disabled={photos.length === 0 || uploading}>
          <LinearGradient
            colors={photos.length > 0 && !uploading ? ['#FF6B9D', '#F97316'] : ['#9CA3AF', '#6B7280']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{uploading ? 'Uploading...' : photos.length > 0 ? 'Continue' : 'Add at least 1 photo'}</Text>
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
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  subtitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 24, lineHeight: 20 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 16 },
  photoSlot: { width: (width - 60) / 3, height: (width - 60) / 3, borderRadius: 12, overflow: 'hidden', marginHorizontal: 6, marginBottom: 12 },
  addPhotoButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 157, 0.3)',
    borderWidth: 2,
    borderColor: '#FF6B9D',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptySlot: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  photoWrapper: { flex: 1 },
  photoPreview: { flex: 1, width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  photoActions: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    gap: 6,
  },
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  moveButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  moveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  actionDisabled: { opacity: 0.35 },
  plusIcon: { fontSize: 32, color: '#FF6B9D', marginBottom: 4 },
  plusIconSmall: { fontSize: 24, color: 'rgba(255, 255, 255, 0.6)' },
  addPhotoText: { fontSize: 12, color: '#FF6B9D', fontWeight: '600' },
  note: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 8 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  uploadText: { fontSize: 13, color: '#FFFFFF', marginLeft: 8 },
  errorText: { fontSize: 12, color: '#F87171', marginTop: 6 },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  retryText: { color: '#FF6B9D', fontWeight: '700', fontSize: 12 },
  actions: { padding: 20 },
  button: { borderRadius: 12, overflow: 'hidden' },
  buttonDisabled: { opacity: 1 },
  buttonGradient: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});

export default PhotoUploadStep;
