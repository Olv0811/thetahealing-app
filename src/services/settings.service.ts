import { supabase } from '../lib/supabase';
import type { UserSettings, UserSettingsInsert, UserSettingsUpdate } from '../types/database';

export interface UpdateSettingsData {
  theme?: string;
  language?: string;
  audio_speed?: number;
  default_ambient_sound?: string;
  notification_enabled?: boolean;
  meditation_reminder_time?: string;
}

// 获取用户设置
export async function getUserSettings(userId: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 如果没有找到设置，创建默认设置
      if (error.code === 'PGRST116') {
        return await createDefaultSettings(userId);
      }
      return { settings: null, error };
    }

    return { settings: data, error: null };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
}

// 创建默认设置
export async function createDefaultSettings(userId: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        theme: 'light',
        language: 'zh-CN',
        audio_speed: 1.0,
        default_ambient_sound: 'forest',
        notification_enabled: true,
        meditation_reminder_time: null,
      } as UserSettingsInsert)
      .select()
      .single();

    if (error) {
      return { settings: null, error };
    }

    return { settings: data, error: null };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
}

// 更新用户设置
export async function updateUserSettings(
  userId: string,
  updates: UpdateSettingsData
): Promise<{ settings: UserSettings | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates as UserSettingsUpdate)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { settings: null, error };
    }

    return { settings: data, error: null };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
}

// 更新主题
export async function updateTheme(userId: string, theme: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { theme });
}

// 更新语言
export async function updateLanguage(userId: string, language: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { language });
}

// 更新音频速度
export async function updateAudioSpeed(userId: string, speed: number): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { audio_speed: speed });
}

// 更新默认背景音
export async function updateDefaultAmbientSound(userId: string, sound: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { default_ambient_sound: sound });
}

// 更新通知设置
export async function updateNotificationEnabled(userId: string, enabled: boolean): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { notification_enabled: enabled });
}

// 更新冥想提醒时间
export async function updateMeditationReminderTime(userId: string, time: string): Promise<{ settings: UserSettings | null; error: Error | null }> {
  return updateUserSettings(userId, { meditation_reminder_time: time });
}