import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ScreenEnter } from '../../components/ScreenEnter';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline' as const, label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { icon: 'calendar-outline' as const, label: 'My Events', onPress: () => { } },
    { icon: 'people-outline' as const, label: 'Friends', onPress: () => { } },
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => { } },
    { icon: 'settings-outline' as const, label: 'Settings', onPress: () => { } },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => { } },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenEnter>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {profile?.photo_url?.startsWith('http') ? (
                <Image
                  source={{ uri: profile.photo_url }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={40} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.displayName}>
              {profile?.display_name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.level ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{profile.level}</Text>
              </View>
            ) : null}
            {profile?.sports && profile.sports.length > 0 && (
              <View style={styles.sportsRow}>
                {profile.sports.map(sport => (
                  <View key={sport} style={styles.sportChip}>
                    <Text style={styles.sportChipText}>{sport}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Memories</Text>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Sign Out */}
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Text style={styles.version}>TeamUp v1.0.0</Text>
        </ScrollView>
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  profileHeader: {
    alignItems: 'center', paddingVertical: Spacing.xxl,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%', height: '100%',
  },
  displayName: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  email: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.xs },
  levelBadge: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.md,
  },
  levelText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  sportsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    justifyContent: 'center', marginTop: Spacing.md,
  },
  sportChip: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: BorderRadius.full,
  },
  sportChipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xxl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.primary, fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.xs },
  statDivider: { width: 1, backgroundColor: Colors.border },
  menu: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  menuLabel: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.xl, marginTop: Spacing.xxl,
  },
  signOutText: { color: Colors.error, fontSize: FontSize.lg, fontWeight: '600' },
  version: {
    color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.md,
  },
});
