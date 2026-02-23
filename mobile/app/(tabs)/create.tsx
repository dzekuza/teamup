import React, { useState } from 'react';
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
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { PADEL_LOCATIONS } from '../../constants/locations';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const SPORT_TYPES = ['Padel', 'Tennis', 'Running', 'Soccer', 'Basketball', 'Cycling'];

const SPORT_ICONS: Record<string, string> = {
  Padel: 'tennisball-outline',
  Tennis: 'tennisball',
  Running: 'walk-outline',
  Soccer: 'football-outline',
  Basketball: 'basketball-outline',
  Cycling: 'bicycle-outline',
};

const PADEL_LEVELS = ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
const GENERAL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function getDateShortcuts() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfter2 = new Date(today);
  dayAfter2.setDate(dayAfter2.getDate() + 3);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const label = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return [
    { label: 'Today', value: fmt(today) },
    { label: 'Tomorrow', value: fmt(tomorrow) },
    { label: label(dayAfter), value: fmt(dayAfter) },
    { label: label(dayAfter2), value: fmt(dayAfter2) },
  ];
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? '00' : '30';
  if (hour > 23) return null;
  return `${hour.toString().padStart(2, '0')}:${min}`;
}).filter(Boolean) as string[];

export function CreateEventSheet({
  visible,
  onDismiss,
  asScreen = false,
}: {
  visible: boolean;
  onDismiss: () => void;
  asScreen?: boolean;
}) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0); // 0=sport, 1=details, 2=location, 3=level, 4=review
  const [submitting, setSubmitting] = useState(false);
  const [showPublishedSheet, setShowPublishedSheet] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const dateShortcuts = getDateShortcuts();
  const levels = sportType === 'Padel' ? PADEL_LEVELS : GENERAL_LEVELS;

  const selectedVenue = PADEL_LOCATIONS.find(l => l.id === selectedLocationId);

  const canProceed = () => {
    switch (step) {
      case 0: return !!sportType;
      case 1: return !!date && !!startTime;
      case 2: return !!location;
      case 3: return !!level;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const resetForm = () => {
    setStep(0);
    setSportType('');
    setTitle('');
    setDescription('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setSelectedLocationId('');
    setLevel('');
    setMaxPlayers(4);
    setIsPrivate(false);
    setPassword('');
    setPrice('');
    setCoverImageUri(null);
  };

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

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    setSubmitting(true);
    try {
      const eventTitle = title || `${sportType} Event at ${location}`;
      const computedEndTime = endTime || (() => {
        const [h, m] = startTime.split(':').map(Number);
        const endH = h + 1;
        return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      })();

      // Upload cover image if selected
      let coverImageUrl: string | null = null;
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
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventTitle,
          date,
          time: `${startTime}:00`,
          end_time: `${computedEndTime}:00`,
          location,
          level,
          max_players: maxPlayers,
          created_by: user.id,
          price: price ? Number(price) : 0,
          status: 'active',
          is_private: isPrivate,
          password: isPrivate ? password : null,
          sport_type: sportType,
          description: description || null,
          cover_image_url: coverImageUrl,
          custom_location_lat: selectedVenue?.lat ?? null,
          custom_location_lng: selectedVenue?.lng ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as creator
      await supabase.from('event_players').insert({
        event_id: data.id,
        user_id: user.id,
        display_name: profile?.display_name ?? null,
        photo_url: profile?.photo_url ?? null,
        level: profile?.level ?? null,
      });

      setCreatedEventId(data.id);
      setLinkCopied(false);
      setShowPublishedSheet(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {[0, 1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[styles.stepDot, i <= step && styles.stepDotActive]}
        />
      ))}
    </View>
  );

  const renderSportStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose a sport</Text>
      <Text style={styles.stepSubtitle}>What are you playing?</Text>
      <View style={styles.sportGrid}>
        {SPORT_TYPES.map(sport => (
          <Pressable
            key={sport}
            style={[styles.sportCard, sportType === sport && styles.sportCardSelected]}
            onPress={() => setSportType(sport)}
          >
            <Ionicons
              name={SPORT_ICONS[sport] as any}
              size={28}
              color={sportType === sport ? Colors.textOnPrimary : Colors.primary}
            />
            <Text style={[styles.sportCardText, sportType === sport && styles.sportCardTextSelected]}>
              {sport}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Event details</Text>

      <Text style={styles.label}>Title (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder={`${sportType} Event`}
        placeholderTextColor={Colors.inputText}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Cover image (optional)</Text>
      <Pressable style={styles.coverImagePicker} onPress={pickCoverImage}>
        {coverImageUri ? (
          <View style={styles.coverImagePreviewWrapper}>
            <Image
              source={{ uri: coverImageUri }}
              style={styles.coverImagePreview}
              contentFit="cover"
            />
            <Pressable
              style={styles.coverImageRemove}
              onPress={() => setCoverImageUri(null)}
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

      <Text style={styles.label}>Date *</Text>
      <View style={styles.chipRow}>
        {dateShortcuts.map(d => (
          <Pressable
            key={d.value}
            style={[styles.chip, date === d.value && styles.chipSelected]}
            onPress={() => setDate(d.value)}
          >
            <Text style={[styles.chipText, date === d.value && styles.chipTextSelected]}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Start time *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
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

      <Text style={styles.label}>End time (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
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

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Add details about your event..."
        placeholderTextColor={Colors.inputText}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Price (EUR)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={Colors.inputText}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepSubtitle}>Where are you playing?</Text>

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
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationAddress}>{loc.address}</Text>
              </View>
              {selectedLocationId === loc.id && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter location name or address..."
            placeholderTextColor={Colors.inputText}
            value={location}
            onChangeText={setLocation}
          />
        </>
      )}
    </View>
  );

  const renderLevelStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Level & players</Text>

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
            placeholder="Set a password for your event"
            placeholderTextColor={Colors.inputText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </>
      )}
    </View>
  );

  const renderReviewStep = () => {
    const displayTitle = title || `${sportType} Event at ${location}`;
    const displayDate = (() => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    })();
    const computedEndTime = endTime || (() => {
      const [h, m] = startTime.split(':').map(Number);
      return `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    })();

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review & create</Text>
        <Text style={styles.stepSubtitle}>Here's how your event will look</Text>

        {/* Cover Image */}
        {coverImageUri && (
          <Image
            source={{ uri: coverImageUri }}
            style={styles.reviewCoverImage}
            contentFit="cover"
          />
        )}

        {/* Sport + Level Badges */}
        <View style={styles.reviewBadgeRow}>
          <View style={styles.reviewSportBadge}>
            <Text style={styles.reviewSportText}>{sportType}</Text>
          </View>
          <View style={styles.reviewLevelBadge}>
            <Text style={styles.reviewLevelText}>{level}</Text>
          </View>
          {isPrivate && (
            <View style={styles.reviewPrivateBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.warning} />
              <Text style={styles.reviewPrivateText}>Private</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.reviewTitle}>{displayTitle}</Text>
        <Text style={styles.reviewOrganizer}>Organized by you</Text>

        {/* Description */}
        {description ? (
          <Text style={styles.reviewDescription}>{description}</Text>
        ) : null}

        {/* Details Card */}
        <View style={styles.reviewDetailsCard}>
          <View style={styles.reviewDetailItem}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.reviewDetailLabel}>Date</Text>
              <Text style={styles.reviewDetailValue}>{displayDate}</Text>
            </View>
          </View>
          <View style={styles.reviewDetailItem}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.reviewDetailLabel}>Time</Text>
              <Text style={styles.reviewDetailValue}>{startTime} - {computedEndTime}</Text>
            </View>
          </View>
          <View style={styles.reviewDetailItem}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewDetailLabel}>Location</Text>
              <Text style={styles.reviewDetailValue}>{location}</Text>
            </View>
          </View>
          {Number(price) > 0 && (
            <View style={styles.reviewDetailItem}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.reviewDetailLabel}>Price</Text>
                <Text style={styles.reviewDetailValue}>{'\u20AC'}{price} per person</Text>
              </View>
            </View>
          )}
        </View>

        {/* Players Section */}
        <View style={styles.reviewPlayersSection}>
          <View style={styles.reviewPlayersHeader}>
            <Text style={styles.reviewSectionTitle}>Players</Text>
            <Text style={styles.reviewPlayerCount}>1/{maxPlayers}</Text>
          </View>
          <View style={styles.reviewPlayerGrid}>
            {Array.from({ length: maxPlayers }).map((_, index) => {
              const isCreatorSlot = index === 0;
              return (
                <View key={index} style={styles.reviewPlayerSlot}>
                  <View
                    style={[
                      styles.reviewPlayerAvatar,
                      isCreatorSlot ? styles.reviewPlayerAvatarFilled : styles.reviewPlayerAvatarEmpty,
                    ]}
                  >
                    <Ionicons
                      name={isCreatorSlot ? 'person' : 'add'}
                      size={20}
                      color={isCreatorSlot ? Colors.primary : Colors.textMuted}
                    />
                  </View>
                  <Text style={styles.reviewPlayerName} numberOfLines={1}>
                    {isCreatorSlot ? (profile?.display_name || 'You') : 'Open'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const steps = [renderSportStep, renderDetailsStep, renderLocationStep, renderLevelStep, renderReviewStep];
  const stepTitles = ['Sport', 'Details', 'Location', 'Level', 'Review'];
  const sheetHeight = Math.round(Dimensions.get('window').height * 0.92);

  // When rendered as a full-screen modal route, skip the BottomSheet wrapper.
  if (asScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.backgroundDark }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.sheetContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: Spacing.md }]}>
            {step > 0 ? (
              <Pressable style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={22} color={Colors.text} />
              </Pressable>
            ) : (
              <Pressable style={styles.headerButton} onPress={onDismiss}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            )}
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={styles.headerButton} />
          </View>

          {renderStepIndicator()}

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {steps[step]()}
          </ScrollView>

          {/* Bottom action */}
          <View style={styles.bottomBar}>
            <Pressable
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step === 4 ? 'Create Event' : 'Continue'}
                  </Text>
                  {step < 4 && <Ionicons name="arrow-forward" size={18} color={Colors.textOnPrimary} />}
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Published Event Sheet */}
        <BottomSheet
          visible={showPublishedSheet}
          onDismiss={() => {
            setShowPublishedSheet(false);
            resetForm();
          }}
          snapHeight={isPrivate ? 400 : 340}
        >
          <View style={sheetStyles.container}>
            <Pressable
              style={sheetStyles.closeButton}
              onPress={() => {
                setShowPublishedSheet(false);
                resetForm();
              }}
            >
              <Ionicons name="close-circle-outline" size={40} color={Colors.textMuted} />
            </Pressable>
            <View style={sheetStyles.content}>
              <Text style={sheetStyles.title}>
                Your {isPrivate ? 'private' : 'public'} event published successfully!
              </Text>
              <Text style={sheetStyles.body}>
                {title || `${sportType} Event at ${location}`} on{' '}
                {date && new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                , {startTime}.
              </Text>
              {isPrivate && createdEventId && (
                <Pressable
                  style={sheetStyles.linkRow}
                  onPress={async () => {
                    if (createdEventId) {
                      await Share.share({
                        message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                      });
                      setLinkCopied(true);
                    }
                  }}
                >
                  <Text style={sheetStyles.linkText} numberOfLines={1}>
                    weteamup.app/event/{createdEventId}
                  </Text>
                  <Ionicons
                    name={linkCopied ? 'checkmark-circle' : 'copy-outline'}
                    size={20}
                    color={linkCopied ? Colors.success : Colors.inputText}
                  />
                </Pressable>
              )}
            </View>
            <View style={sheetStyles.buttonRow}>
              {isPrivate ? (
                <Pressable
                  style={[sheetStyles.button, sheetStyles.primaryButton]}
                  onPress={async () => {
                    if (createdEventId) {
                      await Share.share({
                        message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                      });
                    }
                  }}
                >
                  <Ionicons name="share-outline" size={18} color={Colors.textOnPrimary} />
                  <Text style={sheetStyles.primaryButtonText}>Share</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[sheetStyles.button, sheetStyles.secondaryButton]}
                    onPress={async () => {
                      if (createdEventId) {
                        await Share.share({
                          message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                        });
                      }
                    }}
                  >
                    <Text style={sheetStyles.secondaryButtonText}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={[sheetStyles.button, sheetStyles.primaryButton]}
                    onPress={() => {
                      setShowPublishedSheet(false);
                      resetForm();
                      if (createdEventId) {
                        router.push(`/event/${createdEventId}`);
                      }
                    }}
                  >
                    <Text style={sheetStyles.primaryButtonText}>Continue</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </BottomSheet>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BottomSheet
        visible={visible}
        onDismiss={onDismiss}
        snapHeight={sheetHeight}
      >
        <KeyboardAvoidingView
          style={styles.sheetContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Sheet Header */}
          <View style={[styles.header, { paddingTop: Spacing.md + insets.top }]}>
            {step > 0 ? (
              <Pressable style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={22} color={Colors.text} />
              </Pressable>
            ) : (
              <Pressable style={styles.headerButton} onPress={onDismiss}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            )}
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={styles.headerButton} />
          </View>

          {renderStepIndicator()}

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {steps[step]()}
          </ScrollView>

          {/* Bottom action */}
          <View style={styles.bottomBar}>
            <Pressable
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step === 4 ? 'Create Event' : 'Continue'}
                  </Text>
                  {step < 4 && <Ionicons name="arrow-forward" size={18} color={Colors.textOnPrimary} />}
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* Published Event Sheet */}
      <BottomSheet
        visible={showPublishedSheet}
        onDismiss={() => {
          setShowPublishedSheet(false);
          resetForm();
        }}
        snapHeight={isPrivate ? 400 : 340}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.closeButton}
            onPress={() => {
              setShowPublishedSheet(false);
              resetForm();
            }}
          >
            <Ionicons name="close-circle-outline" size={40} color={Colors.textMuted} />
          </Pressable>
          <View style={sheetStyles.content}>
            <Text style={sheetStyles.title}>
              Your {isPrivate ? 'private' : 'public'} event published successfully!
            </Text>
            <Text style={sheetStyles.body}>
              {title || `${sportType} Event at ${location}`} on{' '}
              {date && new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              , {startTime}.
            </Text>
            {isPrivate && createdEventId && (
              <Pressable
                style={sheetStyles.linkRow}
                onPress={async () => {
                  if (createdEventId) {
                    await Share.share({
                      message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                    });
                    setLinkCopied(true);
                  }
                }}
              >
                <Text style={sheetStyles.linkText} numberOfLines={1}>
                  weteamup.app/event/{createdEventId}
                </Text>
                <Ionicons
                  name={linkCopied ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={linkCopied ? Colors.success : Colors.inputText}
                />
              </Pressable>
            )}
          </View>
          <View style={sheetStyles.buttonRow}>
            {isPrivate ? (
              <Pressable
                style={[sheetStyles.button, sheetStyles.primaryButton]}
                onPress={async () => {
                  if (createdEventId) {
                    await Share.share({
                      message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                    });
                  }
                }}
              >
                <Ionicons name="share-outline" size={18} color={Colors.textOnPrimary} />
                <Text style={sheetStyles.primaryButtonText}>Share</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={[sheetStyles.button, sheetStyles.secondaryButton]}
                  onPress={async () => {
                    if (createdEventId) {
                      await Share.share({
                        message: `Join my ${sportType} event! https://weteamup.app/event/${createdEventId}`,
                      });
                    }
                  }}
                >
                  <Text style={sheetStyles.secondaryButtonText}>Share</Text>
                </Pressable>
                <Pressable
                  style={[sheetStyles.button, sheetStyles.primaryButton]}
                  onPress={() => {
                    setShowPublishedSheet(false);
                    resetForm();
                    if (createdEventId) {
                      router.push(`/event/${createdEventId}`);
                    }
                  }}
                >
                  <Text style={sheetStyles.primaryButtonText}>Continue</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

export default function CreateEventScreen() {
  const [open, setOpen] = useState(true);
  return (
    <CreateEventSheet
      visible={open}
      onDismiss={() => {
        setOpen(false);
        router.replace('/(tabs)');
      }}
    />
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.sm,
  },
  content: {
    flex: 1,
    gap: Spacing.md,
  },
  title: {
    color: Colors.textLight,
    fontSize: 24,
    fontWeight: '600',
  },
  body: {
    color: Colors.inputText,
    fontSize: FontSize.lg,
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  linkText: {
    color: Colors.inputText,
    fontSize: FontSize.md,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  primaryButton: {
    backgroundColor: Colors.mainColor,
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.darkGreen,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sheetContainer: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
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

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: Spacing.md,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceLighter,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { paddingBottom: 40 },

  // Step content
  stepContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  stepTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.xxl,
  },

  // Sport grid
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  sportCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sportCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sportCardText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  sportCardTextSelected: {
    color: Colors.textOnPrimary,
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

  // Review — event page preview
  reviewCoverImage: {
    width: '100%',
    height: 200,
    marginBottom: Spacing.lg,
  },
  reviewBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reviewSportBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  reviewSportText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  reviewLevelBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  reviewLevelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  reviewPrivateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  reviewPrivateText: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  reviewTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  reviewOrganizer: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  reviewDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  reviewDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  reviewDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewDetailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  reviewDetailValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  reviewPlayersSection: {
    marginBottom: Spacing.xxl,
  },
  reviewPlayersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reviewSectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  reviewPlayerCount: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  reviewPlayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  reviewPlayerSlot: {
    alignItems: 'center',
    width: 70,
  },
  reviewPlayerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  reviewPlayerAvatarFilled: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  reviewPlayerAvatarEmpty: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  reviewPlayerName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
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

  // Time scroll
  timeScroll: {
    marginBottom: Spacing.xs,
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
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  locationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.darkGreen,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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


  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
