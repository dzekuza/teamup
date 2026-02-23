import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface EventPlayer {
  id: string;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  level: string | null;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  level: string;
  maxPlayers: number;
  createdBy: string;
  price: number;
  status: 'active' | 'completed';
  isPrivate: boolean;
  password?: string;
  sportType: string;
  description?: string;
  coverImageUrl?: string;
  customLocationLat?: number;
  customLocationLng?: number;
  createdAt: string;
  players: EventPlayer[];
  playerCount: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) throw eventsError;

      const eventIds = eventsData.map(e => e.id);

      const { data: playersData, error: playersError } = await supabase
        .from('event_players')
        .select('*')
        .in('event_id', eventIds);

      if (playersError) throw playersError;

      const playersByEvent: Record<string, EventPlayer[]> = {};
      for (const p of playersData || []) {
        if (!playersByEvent[p.event_id]) playersByEvent[p.event_id] = [];
        playersByEvent[p.event_id].push({
          id: p.id,
          user_id: p.user_id,
          display_name: p.display_name,
          photo_url: p.photo_url,
          level: p.level,
        });
      }

      const mapped: AppEvent[] = eventsData.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        endTime: e.end_time,
        location: e.location,
        level: e.level,
        maxPlayers: e.max_players,
        createdBy: e.created_by,
        price: Number(e.price),
        status: e.status,
        isPrivate: e.is_private,
        password: e.password ?? undefined,
        sportType: e.sport_type,
        description: e.description ?? undefined,
        coverImageUrl: e.cover_image_url ?? undefined,
        customLocationLat: e.custom_location_lat ?? undefined,
        customLocationLng: e.custom_location_lng ?? undefined,
        createdAt: e.created_at,
        players: playersByEvent[e.id] || [],
        playerCount: (playersByEvent[e.id] || []).length,
      }));

      setEvents(mapped);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
};
