import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

const SPORTS = [
  { id: 'Padel', name: 'Padel', icon: '🎾' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [level, setLevel] = useState(profile?.level || '');
  const [selectedSports, setSelectedSports] = useState<string[]>(profile?.sports || []);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check if photo_url is a real URL (not a predefined avatar ID like "Avatar1")
  const currentPhotoUrl = profile?.photo_url?.startsWith('http') ? profile.photo_url : null;

  const toggleSport = (sportId: string) => {
    setSelectedSports(prev =>
      prev.includes(sportId) ? prev.filter(s => s !== sportId) : [...prev, sportId]
    );
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setSaving(true);
    try {
      // Upload avatar if a new image was picked
      let photoUrl: string | undefined;
      if (avatarUri) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        const fileName = `${user.id}/profile.${ext}`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          phone_number: phoneNumber.trim(),
          location: location.trim(),
          level,
          sports: selectedSports,
          ...(photoUrl && { photo_url: photoUrl }),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <Pressable style={styles.avatarSection} onPress={pickAvatar}>
            <View style={styles.avatar}>
              {avatarUri || currentPhotoUrl ? (
                <Image
                  source={{ uri: avatarUri || currentPhotoUrl! }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={40} color={Colors.primary} />
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color={Colors.text} />
              </View>
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>

          {/* Form */}
          <Input
            label="Display Name"
            placeholder="Your name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            style={styles.bioInput}
          />
          <Input
            label="Phone Number"
            placeholder="Your phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <Input
            label="Location"
            placeholder="Your city"
            value={location}
            onChangeText={setLocation}
          />

          {/* Level Selector */}
          <Text style={styles.sectionLabel}>Skill Level</Text>
          <View style={styles.levelRow}>
            {LEVELS.map(l => (
              <Pressable
                key={l}
                style={[styles.levelChip, level === l && styles.levelChipActive]}
                onPress={() => setLevel(l)}
              >
                <Text style={[styles.levelChipText, level === l && styles.levelChipTextActive]}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sports Selector */}
          <Text style={styles.sectionLabel}>Sports</Text>
          <View style={styles.sportsGrid}>
            {SPORTS.map(sport => (
              <Pressable
                key={sport.id}
                style={[
                  styles.sportCard,
                  selectedSports.includes(sport.id) && styles.sportCardActive,
                ]}
                onPress={() => toggleSport(sport.id)}
              >
                <Text style={styles.sportCardIcon}>{sport.icon}</Text>
                <Text
                  style={[
                    styles.sportCardText,
                    selectedSports.includes(sport.id) && styles.sportCardTextActive,
                  ]}
                >
                  {sport.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  saveText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  levelChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBgSubtle,
  },
  levelChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  levelChipTextActive: {
    color: Colors.primary,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  sportCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sportCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBgSubtle,
  },
  sportCardIcon: { fontSize: 28 },
  sportCardText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  sportCardTextActive: { color: Colors.primary },
  saveButton: {
    marginTop: Spacing.md,
  },
});
