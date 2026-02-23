import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manages the saved (favourited) events for the current user.
 * Returns a set of saved event IDs + toggle/check helpers.
 *
 * Usage:
 *   const { savedIds, toggleSave, isSaved } = useSavedEvents();
 *   <EventCard isSaved={isSaved(event.id)} onSave={() => toggleSave(event.id)} />
 */
export function useSavedEvents() {
    const { user } = useAuth();
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);

    // Fetch all saved event IDs for this user on mount / login change
    useEffect(() => {
        if (!user) {
            setSavedIds(new Set());
            return;
        }
        supabase
            .from('saved_events')
            .select('event_id')
            .eq('user_id', user.id)
            .then(({ data }) => {
                if (data) {
                    setSavedIds(new Set(data.map(r => r.event_id)));
                }
            });
    }, [user]);

    const isSaved = useCallback(
        (eventId: string) => savedIds.has(eventId),
        [savedIds]
    );

    const toggleSave = useCallback(
        async (eventId: string) => {
            if (!user) {
                Alert.alert('Sign in required', 'Please sign in to save events.');
                return;
            }
            if (savingId === eventId) return; // already in-flight

            setSavingId(eventId);
            const alreadySaved = savedIds.has(eventId);

            // Optimistic update
            setSavedIds(prev => {
                const next = new Set(prev);
                if (alreadySaved) {
                    next.delete(eventId);
                } else {
                    next.add(eventId);
                }
                return next;
            });

            try {
                if (alreadySaved) {
                    const { error } = await supabase
                        .from('saved_events')
                        .delete()
                        .match({ user_id: user.id, event_id: eventId });
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('saved_events')
                        .insert({ user_id: user.id, event_id: eventId });
                    if (error) throw error;
                }
            } catch (err: any) {
                // Roll back optimistic update on error
                setSavedIds(prev => {
                    const next = new Set(prev);
                    if (alreadySaved) {
                        next.add(eventId);
                    } else {
                        next.delete(eventId);
                    }
                    return next;
                });
                Alert.alert('Error', err.message || 'Failed to update saved events.');
            } finally {
                setSavingId(null);
            }
        },
        [user, savedIds, savingId]
    );

    return { savedIds, isSaved, toggleSave, savingId };
}
