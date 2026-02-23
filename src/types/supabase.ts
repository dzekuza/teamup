export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    PostgrestVersion: "12";
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          first_name: string;
          last_name: string;
          photo_url: string;
          phone_number: string;
          level: string;
          location: string;
          sports: string[];
          bio: string;
          description: string;
          is_admin: boolean;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          first_name?: string;
          last_name?: string;
          photo_url?: string;
          phone_number?: string;
          level?: string;
          location?: string;
          sports?: string[];
          bio?: string;
          description?: string;
          is_admin?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          first_name?: string;
          last_name?: string;
          photo_url?: string;
          phone_number?: string;
          level?: string;
          location?: string;
          sports?: string[];
          bio?: string;
          description?: string;
          is_admin?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string;
          end_time: string;
          location: string;
          level: string;
          max_players: number;
          created_by: string;
          price: number;
          status: 'active' | 'completed';
          is_private: boolean;
          password: string | null;
          sport_type: string;
          description: string | null;
          cover_image_url: string | null;
          custom_location_lat: number | null;
          custom_location_lng: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          time: string;
          end_time: string;
          location: string;
          level?: string;
          max_players?: number;
          created_by: string;
          price?: number;
          status?: 'active' | 'completed';
          is_private?: boolean;
          password?: string | null;
          sport_type?: string;
          description?: string | null;
          cover_image_url?: string | null;
          custom_location_lat?: number | null;
          custom_location_lng?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          time?: string;
          end_time?: string;
          location?: string;
          level?: string;
          max_players?: number;
          created_by?: string;
          price?: number;
          status?: 'active' | 'completed';
          is_private?: boolean;
          password?: string | null;
          sport_type?: string;
          description?: string | null;
          cover_image_url?: string | null;
          custom_location_lat?: number | null;
          custom_location_lng?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_players: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          display_name: string | null;
          photo_url: string | null;
          level: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          display_name?: string | null;
          photo_url?: string | null;
          level?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          display_name?: string | null;
          photo_url?: string | null;
          level?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      match_results: {
        Row: {
          id: string;
          event_id: string;
          team_a_score: string;
          team_b_score: string;
          winner: 'Team A' | 'Team B';
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          team_a_score: string;
          team_b_score: string;
          winner: 'Team A' | 'Team B';
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          team_a_score?: string;
          team_b_score?: string;
          winner?: 'Team A' | 'Team B';
          created_at?: string;
        };
        Relationships: [];
      };
      friends: {
        Row: {
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: 'new_event' | 'event_joined' | 'event_cancelled';
          event_id: string | null;
          event_title: string | null;
          created_by: string | null;
          user_id: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'new_event' | 'event_joined' | 'event_cancelled';
          event_id?: string | null;
          event_title?: string | null;
          created_by?: string | null;
          user_id: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'new_event' | 'event_joined' | 'event_cancelled';
          event_id?: string | null;
          event_title?: string | null;
          created_by?: string | null;
          user_id?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_events: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          saved_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          event_id: string | null;
          event_title: string | null;
          description: string | null;
          image_url: string;
          created_by: string;
          sport_type: string | null;
          date: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          event_title?: string | null;
          description?: string | null;
          image_url: string;
          created_by: string;
          sport_type?: string | null;
          date?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          event_title?: string | null;
          description?: string | null;
          image_url?: string;
          created_by?: string;
          sport_type?: string | null;
          date?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memory_likes: {
        Row: {
          memory_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          memory_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          memory_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      events_with_player_count: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string;
          end_time: string;
          location: string;
          level: string;
          max_players: number;
          created_by: string;
          price: number;
          status: 'active' | 'completed';
          is_private: boolean;
          password: string | null;
          sport_type: string;
          description: string | null;
          cover_image_url: string | null;
          custom_location_lat: number | null;
          custom_location_lng: number | null;
          created_at: string;
          player_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventPlayer = Database['public']['Tables']['event_players']['Row'];
export type MatchResult = Database['public']['Tables']['match_results']['Row'];
export type Friend = Database['public']['Tables']['friends']['Row'];
export type FriendRequest = Database['public']['Tables']['friend_requests']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SavedEvent = Database['public']['Tables']['saved_events']['Row'];
export type Memory = Database['public']['Tables']['memories']['Row'];
export type MemoryLike = Database['public']['Tables']['memory_likes']['Row'];
