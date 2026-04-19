import { supabase } from '../lib/supabase';
import type { MeditationSession, MeditationSessionInsert, MeditationSessionUpdate } from '../types/database';
import { updateUserProgress } from './progress.service';

export interface CreateMeditationSessionData {
  user_id: string;
  session_type: string;
  duration: number;
  ambient_sound?: string;
  ai_chat_history?: any;
}

export interface CompleteMeditationSessionData {
  id: string;
  rating?: number;
  notes?: string;
  ai_chat_history?: any;
}

// 创建冥想会话
export async function createMeditationSession(
  data: CreateMeditationSessionData
): Promise<{ session: MeditationSession | null; error: Error | null }> {
  try {
    const { data: newSession, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: data.user_id,
        session_type: data.session_type,
        duration: data.duration,
        ambient_sound: data.ambient_sound || null,
        ai_chat_history: data.ai_chat_history || null,
        completed: false,
      } as MeditationSessionInsert)
      .select()
      .single();

    if (error) {
      return { session: null, error };
    }

    return { session: newSession, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
}

// 完成冥想会话
export async function completeMeditationSession(
  data: CompleteMeditationSessionData
): Promise<{ session: MeditationSession | null; error: Error | null }> {
  try {
    const { data: completedSession, error } = await supabase
      .from('meditation_sessions')
      .update({
        completed: true,
        rating: data.rating || null,
        notes: data.notes || null,
        ai_chat_history: data.ai_chat_history || null,
        completed_at: new Date().toISOString(),
      } as MeditationSessionUpdate)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      return { session: null, error };
    }

    // 更新用户进度
    if (completedSession && completedSession.user_id) {
      try {
        await updateUserProgress(completedSession.user_id, completedSession.duration);
      } catch (progressError) {
        console.error('Failed to update user progress:', progressError);
        // 不影响会话完成的返回结果
      }
    }

    return { session: completedSession, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
}

// 获取所有冥想会话
export async function getMeditationSessions(
  userId: string
): Promise<{ sessions: MeditationSession[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { sessions: [], error };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    return { sessions: [], error: error as Error };
  }
}

// 获取已完成的冥想会话
export async function getCompletedMeditationSessions(
  userId: string
): Promise<{ sessions: MeditationSession[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (error) {
      return { sessions: [], error };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    return { sessions: [], error: error as Error };
  }
}

// 按类型获取冥想会话
export async function getMeditationSessionsByType(
  userId: string,
  sessionType: string
): Promise<{ sessions: MeditationSession[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', sessionType)
      .order('created_at', { ascending: false });

    if (error) {
      return { sessions: [], error };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    return { sessions: [], error: error as Error };
  }
}

// 更新冥想会话
export async function updateMeditationSession(
  sessionId: string,
  updates: Partial<MeditationSessionUpdate>
): Promise<{ session: MeditationSession | null; error: Error | null }> {
  try {
    const { data: updatedSession, error } = await supabase
      .from('meditation_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return { session: null, error };
    }

    return { session: updatedSession, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
}

// 删除冥想会话
export async function deleteMeditationSession(sessionId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('meditation_sessions')
      .delete()
      .eq('id', sessionId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 获取冥想统计
export async function getMeditationStats(userId: string): Promise<{
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  avgRating: number;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('completed, duration, rating')
      .eq('user_id', userId);

    if (error) {
      return { totalSessions: 0, completedSessions: 0, totalMinutes: 0, avgRating: 0, error };
    }

    const sessions = data || [];
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    const totalMinutes = sessions
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);

    const ratings = sessions
      .filter(s => s.completed && s.rating)
      .map(s => s.rating!);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    return { totalSessions, completedSessions, totalMinutes, avgRating, error: null };
  } catch (error) {
    return { totalSessions: 0, completedSessions: 0, totalMinutes: 0, avgRating: 0, error: error as Error };
  }
}

// 获取最近 7 天的冥想记录
export async function getRecentMeditationSessions(
  userId: string,
  days: number = 7
): Promise<{ sessions: MeditationSession[]; error: Error | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return { sessions: [], error };
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    return { sessions: [], error: error as Error };
  }
}

// 获取按天分组的冥想记录
export async function getMeditationByDay(userId: string, days: number = 30): Promise<{
  data: Record<string, { count: number; totalMinutes: number }>;
  error: Error | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('created_at, duration, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', startDate.toISOString());

    if (error) {
      return { data: {}, error };
    }

    const sessions = data || [];
    const result: Record<string, { count: number; totalMinutes: number }> = {};

    sessions.forEach(session => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      if (!result[date]) {
        result[date] = { count: 0, totalMinutes: 0 };
      }
      result[date].count += 1;
      result[date].totalMinutes += session.duration;
    });

    return { data: result, error: null };
  } catch (error) {
    return { data: {}, error: error as Error };
  }
}