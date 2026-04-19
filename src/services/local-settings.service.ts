// 本地设置缓存服务
// 作为 Supabase 设置查询失败时的后备方案

const SETTINGS_CACHE_KEY = 'user_settings_cache';
const SETTINGS_TIMESTAMP_KEY = 'user_settings_timestamp';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

export interface LocalUserSettings {
  user_id: string;
  theme: string;
  language: string;
  audio_speed: number;
  default_ambient_sound: string;
  notification_enabled: boolean;
  meditation_reminder_time: string | null;
}

const DEFAULT_SETTINGS: LocalUserSettings = {
  user_id: '',
  theme: 'light',
  language: 'zh-CN',
  audio_speed: 1.0,
  default_ambient_sound: 'forest',
  notification_enabled: true,
  meditation_reminder_time: null,
};

// 保存设置到缓存
export function saveSettingsToCache(settings: LocalUserSettings): void {
  try {
    const cacheData = {
      settings,
      timestamp: Date.now()
    };
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(SETTINGS_TIMESTAMP_KEY, Date.now().toString());
    console.log('已保存用户设置到缓存');
  } catch (error) {
    console.error('保存设置缓存失败:', error);
  }
}

// 从缓存获取设置
export function getSettingsFromCache(): LocalUserSettings | null {
  try {
    const cachedData = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!cachedData) return null;

    const { settings, timestamp } = JSON.parse(cachedData);

    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_DURATION) {
      console.log('设置缓存已过期');
      localStorage.removeItem(SETTINGS_CACHE_KEY);
      localStorage.removeItem(SETTINGS_TIMESTAMP_KEY);
      return null;
    }

    console.log('从缓存加载用户设置');
    return settings;
  } catch (error) {
    console.error('读取设置缓存失败:', error);
    return null;
  }
}

// 获取默认设置
export function getDefaultSettings(userId: string): LocalUserSettings {
  return {
    ...DEFAULT_SETTINGS,
    user_id: userId,
  };
}

// 清除设置缓存
export function clearSettingsCache(): void {
  try {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
    localStorage.removeItem(SETTINGS_TIMESTAMP_KEY);
    console.log('已清除设置缓存');
  } catch (error) {
    console.error('清除设置缓存失败:', error);
  }
}

// 检查缓存是否存在且有效
export function isSettingsCacheValid(): boolean {
  try {
    const timestamp = localStorage.getItem(SETTINGS_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge < CACHE_DURATION;
  } catch (error) {
    return false;
  }
}

// 获取设置缓存信息
export function getSettingsCacheInfo(): { exists: boolean; age: number } {
  try {
    const timestamp = localStorage.getItem(SETTINGS_TIMESTAMP_KEY);
    if (!timestamp) {
      return { exists: false, age: 0 };
    }

    const age = Date.now() - parseInt(timestamp);
    return { exists: true, age };
  } catch (error) {
    return { exists: false, age: 0 };
  }
}