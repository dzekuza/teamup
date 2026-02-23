import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PADEL_LOCATIONS } from '../../constants/locations';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const SPORT_TYPES = ['Padel', 'Tennis', 'Running', 'Soccer', 'Basketball', 'Cycling'];

const PADEL_LEVELS = ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
const GENERAL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  if (hour > 23) return null;
  return `${hour.toString().padStart(2, '0')}:${min}`;
}).filter(Boolean) as string[];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sportType, setSportType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [level, setLevel] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [price, setPrice] = useState('');
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  const levels = sportType === 'Padel' ? PADEL_LEVELS : GENERAL_LEVELS;

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverImageUri(result.assets[0].uri);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return;

        setSportType(data.sport_type || '');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDate(data.date || '');
        setStartTime(data.time ? data.time.slice(0, 5) : '');
        setEndTime(data.end_time ? data.end_time.slice(0, 5) : '');
        setLocation(data.location || '');
        setLevel(data.level || '');
        setMaxPlayers(data.max_players || 4);
        setIsPrivate(data.is_private || false);
        setPassword(data.password || '');
        setPrice(data.price > 0 ? String(data.price) : '');
        if (data.cover_image_url) setExistingCoverUrl(data.cover_image_url);

        // Match location to known venue
        const venue = PADEL_LOCATIONS.find(l => l.name === data.location);
        if (venue) setSelectedLocationId(venue.id);
      } catch (err: any) {
        Alert.alert('Error', 'Could not load event');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const selectedVenue = PADEL_LOCATIONS.find(l => l.id === selectedLocationId);

  const handleSave = async () => {
    if (!user || !id) return;
    if (!title && !location) {
      Alert.alert('Error', 'Please fill in the required fields');
      return;
    }

    setSubmitting(true);
    try {
      const computedEndTime = endTime || (() => {
        const [h, m] = startTime.split(':').map(Number);
        const endH = h + 1;
        return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      })();

      // Upload new cover image if changed
      let coverImageUrl: string | null | undefined = undefined;
      if (coverImageUri) {
        const ext = coverImageUri.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const response = await fetch(coverImageUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('event-covers')
          .getPublicUrl(fileName);
        coverImageUrl = urlData.publicUrl;
      } else if (!existingCoverUrl) {
        coverImageUrl = null;
      }

      const updatePayload: Record<string, any> = {
        title: title || `${sportType} Event at ${location}`,
        date,
        time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: computedEndTime.length === 5 ? `${computedEndTime}:00` : computedEndTime,
        location,
        level,
        max_players: maxPlayers,
        price: price ? Number(price) : 0,
        is_private: isPrivate,
        password: isPrivate ? password : null,
        sport_type: sportType,
        description: description || null,
        custom_location_lat: selectedVenue?.lat ?? null,
        custom_location_lng: selectedVenue?.lng ?? null,
      };
      if (coverImageUrl !== undefined) {
        updatePayload.cover_image_url = coverImageUrl;
      }

      const { error } = await supabase
        .from('events')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Saved', 'Event updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('event_players').delete().eq('event_id', id);
              await supabase.from('events').delete().eq('id', id);
              Alert.alert('Deleted', 'Event has been deleted.', [
                { text: 'OK', onPress: () => router.replace('/') },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sport Type */}
          <Text style={styles.label}>Sport</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {SPORT_TYPES.map(sport => (
                <Pressable
                  key={sport}
                  style={[styles.chip, sportType === sport && styles.chipSelected]}
                  onPress={() => setSportType(sport)}
                >
                  <Text style={[styles.chipText, sportType === sport && styles.chipTextSelected]}>
                    {sport}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={Colors.inputText}
            value={title}
            onChangeText={setTitle}
          />

          {/* Cover Image */}
          <Text style={styles.label}>Cover image</Text>
          <Pressable style={styles.coverImagePicker} onPress={pickCoverImage}>
            {coverImageUri || existingCoverUrl ? (
              <View style={styles.coverImagePreviewWrapper}>
                <Image
                  source={{ uri: coverImageUri || existingCoverUrl! }}
                  style={styles.coverImagePreview}
                  contentFit="cover"
                />
                <Pressable
                  style={styles.coverImageRemove}
                  onPress={() => {
                    setCoverImageUri(null);
                    setExistingCoverUrl(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.text} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={Colors.inputText} />
                <Text style={styles.coverImagePlaceholderText}>Tap to add cover image</Text>
              </View>
            )}
          </Pressable>

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.inputText}
            value={date}
            onChangeText={setDate}
          />

          {/* Start Time */}
          <Text style={styles.label}>Start time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TIME_OPTIONS.map(t => (
                <Pressable
                  key={t}
                  style={[styles.chip, startTime === t && styles.chipSelected]}
                  onPress={() => setStartTime(t)}
                >
                  <Text style={[styles.chipText, startTime === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* End Time */}
          <Text style={styles.label}>End time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TIME_OPTIONS.filter(t => t > startTime).map(t => (
                <Pressable
                  key={t}
                  style={[styles.chip, endTime === t && styles.chipSelected]}
                  onPress={() => setEndTime(t)}
                >
                  <Text style={[styles.chipText, endTime === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Location */}
          <Text style={styles.label}>Location</Text>
          {sportType === 'Padel' ? (
            <View style={styles.locationList}>
              {PADEL_LOCATIONS.map(loc => (
                <Pressable
                  key={loc.id}
                  style={[styles.locationCard, selectedLocationId === loc.id && styles.locationCardSelected]}
                  onPress={() => {
                    setSelectedLocationId(loc.id);
                    setLocation(loc.name);
                  }}
                >
                  <View style={styles.locationIcon}>
                    <Ionicons name="location" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{loc.name}</Text>
                    <Text style={styles.locationAddress}>{loc.address}</Text>
                  </View>
                  {selectedLocationId === loc.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Location name or address"
              placeholderTextColor={Colors.inputText}
              value={location}
              onChangeText={setLocation}
            />
          )}

          {/* Level */}
          <Text style={styles.label}>Skill level</Text>
          <View style={styles.chipRow}>
            {levels.map(l => (
              <Pressable
                key={l}
                style={[styles.chip, level === l && styles.chipSelected]}
                onPress={() => setLevel(l)}
              >
                <Text style={[styles.chipText, level === l && styles.chipTextSelected]}>{l}</Text>
              </Pressable>
            ))}
          </View>

          {/* Max Players */}
          <Text style={styles.label}>Max players</Text>
          <View style={styles.counterRow}>
            <Pressable
              style={styles.counterButton}
              onPress={() => setMaxPlayers(Math.max(1, maxPlayers - 1))}
            >
              <Ionicons name="remove" size={20} color={Colors.text} />
            </Pressable>
            <Text style={styles.counterValue}>{maxPlayers}</Text>
            <Pressable
              style={styles.counterButton}
              onPress={() => setMaxPlayers(Math.min(100, maxPlayers + 1))}
            >
              <Ionicons name="add" size={20} color={Colors.text} />
            </Pressable>
          </View>

          {/* Price */}
          <Text style={styles.label}>Price (EUR)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.inputText}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Event description..."
            placeholderTextColor={Colors.inputText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Privacy */}
          <Text style={styles.label}>Privacy</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, !isPrivate && styles.chipSelected]}
              onPress={() => setIsPrivate(false)}
            >
              <Text style={[styles.chipText, !isPrivate && styles.chipTextSelected]}>Public</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, isPrivate && styles.chipSelected]}
              onPress={() => setIsPrivate(true)}
            >
              <Text style={[styles.chipText, isPrivate && styles.chipTextSelected]}>Private</Text>
            </Pressable>
          </View>

          {isPrivate && (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Event password"
                placeholderTextColor={Colors.inputText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}

          {/* Delete */}
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </Pressable>
        </ScrollView>

        {/* Save button */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },

  // Labels / inputs
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Cover image picker
  coverImagePicker: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  coverImagePlaceholder: {
    height: 140,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  coverImagePlaceholderText: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
  },
  coverImagePreviewWrapper: {
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.xl,
  },
  coverImageRemove: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Colors.textOnPrimary,
  },

  // Location
  locationList: {
    gap: Spacing.sm,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  locationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.darkGreen,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  locationAddress: {
    color: Colors.inputText,
    fontSize: FontSize.sm,
    marginTop: 2,
  },

  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },

  // Delete
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.md,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
