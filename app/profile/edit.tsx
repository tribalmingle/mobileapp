import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { uploadImageAsync } from '@/api/upload';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [education, setEducation] = useState(user?.education || '');
  const [photos, setPhotos] = useState<string[]>(
    user?.photos ||
      user?.profilePhotos ||
      ((user as any)?.profilePhoto ? [(user as any).profilePhoto] : [])
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePickPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum photos', 'You can upload up to 6 photos');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploading(true);
        try {
          const uploadedUrl = await uploadImageAsync(result.assets[0].uri, 'profile');
          setPhotos([...photos, uploadedUrl]);
        } catch (err) {
          Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error('Photo picker error:', err);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name');
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        bio: bio.trim(),
        occupation: occupation.trim(),
        education: education.trim(),
        photos,
        profilePhotos: photos,
      });
      router.back();
    } catch (err) {
      Alert.alert('Save failed', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <UniversalBackground scrollable title="Edit Profile">
      <View style={styles.container}>
        {/* Header with back and save */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
            <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photos section */}
        <GlassCard style={styles.section} intensity={24} padding={spacing.lg}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionHint}>Add up to 6 photos. Tap a photo to remove it.</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <TouchableOpacity key={`${uri}-${index}`} onPress={() => handleRemovePhoto(index)} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} />
                <View style={styles.photoRemove}>
                  <Ionicons name="close" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity onPress={handlePickPhoto} style={styles.addPhotoButton} disabled={uploading}>
                <Ionicons name={uploading ? 'hourglass' : 'add'} size={28} color={colors.secondary} />
                <Text style={styles.addPhotoText}>{uploading ? 'Uploading...' : 'Add'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Basic info section */}
        <GlassCard style={styles.section} intensity={24} padding={spacing.lg}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.textArea]}
              placeholder="Tell others about yourself..."
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Occupation</Text>
            <TextInput
              value={occupation}
              onChangeText={setOccupation}
              style={styles.input}
              placeholder="What do you do?"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Education</Text>
            <TextInput
              value={education}
              onChangeText={setEducation}
              style={styles.input}
              placeholder="Your education"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </GlassCard>

        {/* Link to full onboarding for deeper changes */}
        <TouchableOpacity onPress={() => router.push('/setup')} style={styles.fullEditButton}>
          <Ionicons name="settings-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.fullEditText}>Update location, interests, or preferences</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveText: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
    width: 100,
    height: 133,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 133,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    ...typography.body,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  fullEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullEditText: {
    flex: 1,
    ...typography.body,
    color: colors.text.secondary,
  },
});
