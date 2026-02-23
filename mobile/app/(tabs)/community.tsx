import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { ScreenEnter } from '../../components/ScreenEnter';

interface Memory {
  id: string;
  event_title: string | null;
  description: string | null;
  image_url: string;
  created_by: string;
  sport_type: string | null;
  date: string | null;
  location: string | null;
  created_at: string;
  creator_name?: string;
  like_count: number;
  liked_by_me: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CommunityScreen() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!memoriesData) return;

      // Fetch like counts and creator info
      const memoryIds = memoriesData.map(m => m.id);
      const creatorIds = [...new Set(memoriesData.map(m => m.created_by))];

      const [{ data: likes }, { data: profiles }] = await Promise.all([
        supabase.from('memory_likes').select('memory_id, user_id').in('memory_id', memoryIds),
        supabase.from('profiles').select('id, display_name').in('id', creatorIds),
      ]);

      const profileMap: Record<string, string> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = p.display_name || 'Unknown';
      }

      const likesByMemory: Record<string, string[]> = {};
      for (const l of likes || []) {
        if (!likesByMemory[l.memory_id]) likesByMemory[l.memory_id] = [];
        likesByMemory[l.memory_id].push(l.user_id);
      }

      setMemories(
        memoriesData.map(m => ({
          ...m,
          creator_name: profileMap[m.created_by],
          like_count: (likesByMemory[m.id] || []).length,
          liked_by_me: user ? (likesByMemory[m.id] || []).includes(user.id) : false,
        }))
      );
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [user]);

  const toggleLike = async (memory: Memory) => {
    if (!user) return;
    if (memory.liked_by_me) {
      await supabase.from('memory_likes').delete().match({ memory_id: memory.id, user_id: user.id });
    } else {
      await supabase.from('memory_likes').insert({ memory_id: memory.id, user_id: user.id });
    }
    // Optimistic update
    setMemories(prev =>
      prev.map(m =>
        m.id === memory.id
          ? {
            ...m,
            liked_by_me: !m.liked_by_me,
            like_count: m.liked_by_me ? m.like_count - 1 : m.like_count + 1,
          }
          : m
      )
    );
  };

  const renderMemory = ({ item }: { item: Memory }) => (
    <View style={styles.memoryCard}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.memoryImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.memoryInfo}>
        <View style={styles.memoryHeader}>
          <Text style={styles.memoryCreator}>{item.creator_name}</Text>
          {item.sport_type && (
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{item.sport_type}</Text>
            </View>
          )}
        </View>
        {item.event_title && (
          <Text style={styles.memoryTitle} numberOfLines={1}>{item.event_title}</Text>
        )}
        {item.description && (
          <Text style={styles.memoryDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.memoryFooter}>
          <Pressable style={styles.likeButton} onPress={() => toggleLike(item)}>
            <Ionicons
              name={item.liked_by_me ? 'heart' : 'heart-outline'}
              size={22}
              color={item.liked_by_me ? Colors.error : Colors.textMuted}
            />
            <Text style={styles.likeCount}>{item.like_count}</Text>
          </Pressable>
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenEnter>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          renderItem={renderMemory}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchMemories} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="images-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No memories yet</Text>
                <Text style={styles.emptySubtext}>Share your first post-event photo!</Text>
              </View>
            ) : null
          }
        />
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  headerTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  memoryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  memoryImage: {
    width: SCREEN_WIDTH - Spacing.xl * 2 - 2,
    height: 220,
  },
  memoryInfo: { padding: Spacing.lg },
  memoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  memoryCreator: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  sportBadge: {
    backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  sportBadgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },
  memoryTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  memoryDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  memoryFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm,
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  likeCount: { color: Colors.textSecondary, fontSize: FontSize.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  locationText: { color: Colors.textMuted, fontSize: FontSize.xs, flexShrink: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.md },
});
