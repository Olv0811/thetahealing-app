// Supabase 数据库类型定义

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          level: number;
          streak_days: number;
          total_meditation_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          streak_days?: number;
          total_meditation_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          level?: number;
          streak_days?: number;
          total_meditation_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          rating: number | null;
          tags: string[];
          mood_before: string | null;
          mood_after: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content: string;
          rating?: number | null;
          tags?: string[];
          mood_before?: string | null;
          mood_after?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          rating?: number | null;
          tags?: string[];
          mood_before?: string | null;
          mood_after?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          language: string;
          audio_speed: number;
          default_ambient_sound: string;
          notification_enabled: boolean;
          meditation_reminder_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          language?: string;
          audio_speed?: number;
          default_ambient_sound?: string;
          notification_enabled?: boolean;
          meditation_reminder_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          language?: string;
          audio_speed?: number;
          default_ambient_sound?: string;
          notification_enabled?: boolean;
          meditation_reminder_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meditation_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: string;
          duration: number;
          ambient_sound: string | null;
          completed: boolean;
          rating: number | null;
          notes: string | null;
          ai_chat_history: Json | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: string;
          duration: number;
          ambient_sound?: string | null;
          completed?: boolean;
          rating?: number | null;
          notes?: string | null;
          ai_chat_history?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: string;
          duration?: number;
          ambient_sound?: string | null;
          completed?: boolean;
          rating?: number | null;
          notes?: string | null;
          ai_chat_history?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          page_number: number | null;
          title: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          page_number?: number | null;
          title?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          page_number?: number | null;
          title?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          page_number: number | null;
          text_content: string;
          highlight_text: string | null;
          highlight_start_position: number | null;
          highlight_end_position: number | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          page_number?: number | null;
          text_content: string;
          highlight_text?: string | null;
          highlight_start_position?: number | null;
          highlight_end_position?: number | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          page_number?: number | null;
          text_content?: string;
          highlight_text?: string | null;
          highlight_start_position?: number | null;
          highlight_end_position?: number | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// 导出常用类型
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type MeditationSession = Database['public']['Tables']['meditation_sessions']['Row'];
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];

// Insert 类型
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type MeditationSessionInsert = Database['public']['Tables']['meditation_sessions']['Insert'];
export type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];

// Update 类型
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];
export type MeditationSessionUpdate = Database['public']['Tables']['meditation_sessions']['Update'];
export type BookmarkUpdate = Database['public']['Tables']['bookmarks']['Update'];
export type NoteUpdate = Database['public']['Tables']['notes']['Update'];