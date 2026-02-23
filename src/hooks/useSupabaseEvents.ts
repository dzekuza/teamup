import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Event as AppEvent, Player, MatchResult } from '../types/index';

// Transform Supabase event row + players into the app's Event shape
export function toAppEvent(row: any, players: any[]): AppEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    location: row.location,
    level: row.level,
    players: players.map(p => ({
      id: p.user_id,
      name: p.display_name || '',
      photoURL: p.photo_url,
      displayName: p.display_name,
      level: p.level,
      uid: p.user_id,
    })),
    maxPlayers: row.max_players,
    createdBy: row.created_by,
    price: Number(row.price),
    status: row.status,
    isPrivate: row.is_private,
    password: row.password ?? undefined,
    sportType: row.sport_type,
    description: row.description ?? undefined,
    coverImageURL: row.cover_image_url ?? undefined,
    createdAt: row.created_at,
    customLocationCoordinates: row.custom_location_lat != null
      ? { lat: row.custom_location_lat, lng: row.custom_location_lng }
      : undefined,
  };
}

export const useSupabaseEvents = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch all events ordered by date
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (eventsError) throw eventsError;

        // Fetch all event players in one query
        const eventIds = eventsData.map(e => e.id);
        const { data: playersData, error: playersError } = await supabase
          .from('event_players')
          .select('*')
          .in('event_id', eventIds);

        if (playersError) throw playersError;

        // Group players by event_id
        const playersByEvent: Record<string, any[]> = {};
        for (const player of playersData || []) {
          if (!playersByEvent[player.event_id]) {
            playersByEvent[player.event_id] = [];
          }
          playersByEvent[player.event_id].push(player);
        }

        const mapped = eventsData.map(e =>
          toAppEvent(e, playersByEvent[e.id] || [])
        );

        setEvents(mapped);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};

export const useSupabaseUpdateMatchResult = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMatchResult = async (eventId: string, results: MatchResult[]) => {
    setLoading(true);
    setError(null);
    try {
      // Insert match results
      const inserts = results.map(r => ({
        event_id: eventId,
        team_a_score: r.teamAScore,
        team_b_score: r.teamBScore,
        winner: r.winner,
      }));

      const { error: insertError } = await supabase
        .from('match_results')
        .insert(inserts);

      if (insertError) throw insertError;

      // Mark event as completed
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'completed' as const })
        .eq('id', eventId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error('Error updating match results:', err);
      setError(err.message || 'Failed to update match results');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateMatchResult, loading, error };
};
