import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../types/database';

/**
 * 计算等级
 * 根据总冥想分钟数计算等级
 */
export function calculateLevel(totalMinutes: number): number {
  // 等级公式：每 30 分钟升一级，最低 1 级
  return Math.floor(totalMinutes / 30) + 1;
}

/**
 * 计算连续打卡天数
 * 根据冥想会话记录计算连续打卡天数
 */
export async function calculateStreakDays(userId: string): Promise<number> {
  try {
    // 获取最近 365 天的已完成会话
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('completed_at', startDate.toISOString())
      .order('completed_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return 0;
    }

    // 获取所有完成日期（去除重复）
    const completedDates = new Set(
      data
        .map(session => {
          if (!session.completed_at) return null;
          const date = new Date(session.completed_at);
          return date.toISOString().split('T')[0];
        })
        .filter((date): date is string => date !== null)
    );

    if (completedDates.size === 0) {
      return 0;
    }

    // 计算连续打卡天数
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const today = currentDate.toISOString().split('T')[0];
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 检查今天或昨天是否有记录
    if (!completedDates.has(today) && !completedDates.has(yesterdayStr)) {
      return 0;
    }

    // 从今天或昨天开始计算
    let checkDate = completedDates.has(today) ? new Date() : yesterday;

    while (completedDates.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak days:', error);
    return 0;
  }
}

/**
 * 更新用户进度
 * 在冥想会话完成后调用
 */
export async function updateUserProgress(
  userId: string,
  meditationMinutes: number
): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    // 获取当前用户资料
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return { profile: null, error: fetchError };
    }

    if (!currentProfile) {
      return { profile: null, error: new Error('Profile not found') };
    }

    // 计算新的总冥想分钟数
    const newTotalMinutes = currentProfile.total_meditation_minutes + meditationMinutes;

    // 计算新等级
    const newLevel = calculateLevel(newTotalMinutes);

    // 计算新的连续打卡天数
    const newStreakDays = await calculateStreakDays(userId);

    // 更新用户资料
    const updates: ProfileUpdate = {
      total_meditation_minutes: newTotalMinutes,
      level: newLevel,
      streak_days: newStreakDays,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return { profile: null, error: updateError };
    }

    return { profile: updatedProfile, error: null };
  } catch (error) {
    console.error('Error updating user progress:', error);
    return { profile: null, error: error as Error };
  }
}

/**
 * 获取用户进度统计
 */
export async function getUserProgressStats(userId: string): Promise<{
  level: number;
  streakDays: number;
  totalMinutes: number;
  sessionsThisMonth: number;
  sessionsThisWeek: number;
  error: Error | null;
}> {
  try {
    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        level: 0,
        streakDays: 0,
        totalMinutes: 0,
        sessionsThisMonth: 0,
        sessionsThisWeek: 0,
        error: profileError || new Error('Profile not found'),
      };
    }

    // 计算本月和本周的会话数
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 本周日

    const [monthResult, weekResult] = await Promise.all([
      supabase
        .from('meditation_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', monthStart.toISOString()),
      supabase
        .from('meditation_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('completed_at', weekStart.toISOString()),
    ]);

    return {
      level: profile.level,
      streakDays: profile.streak_days,
      totalMinutes: profile.total_meditation_minutes,
      sessionsThisMonth: monthResult.data?.length || 0,
      sessionsThisWeek: weekResult.data?.length || 0,
      error: null,
    };
  } catch (error) {
    console.error('Error getting user progress stats:', error);
    return {
      level: 0,
      streakDays: 0,
      totalMinutes: 0,
      sessionsThisMonth: 0,
      sessionsThisWeek: 0,
      error: error as Error,
    };
  }
}

/**
 * 获取下一等级所需冥想分钟数
 */
export function getMinutesToNextLevel(currentMinutes: number): number {
  const currentLevel = calculateLevel(currentMinutes);
  const nextLevelMinutes = currentLevel * 30;
  return Math.max(0, nextLevelMinutes - currentMinutes);
}

/**
 * 获取当前等级进度百分比
 */
export function getLevelProgress(currentMinutes: number): number {
  const currentLevel = calculateLevel(currentMinutes);
  const levelStartMinutes = (currentLevel - 1) * 30;
  const levelEndMinutes = currentLevel * 30;
  const progress = currentMinutes - levelStartMinutes;
  const totalLevelMinutes = levelEndMinutes - levelStartMinutes;
  return Math.min(100, Math.max(0, (progress / totalLevelMinutes) * 100));
}