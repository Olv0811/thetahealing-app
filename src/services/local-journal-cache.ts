// 本地日记缓存服务
// 作为 Supabase 查询失败时的后备方案

const CACHE_KEY = 'journal_entries_cache';
const CACHE_STATS_KEY = 'journal_stats_cache';
const CACHE_TIMESTAMP_KEY = 'journal_cache_timestamp';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

export interface CachedJournalEntry {
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
}

export interface CachedStats {
  total: number;
  avgRating: number;
  totalTags: number;
}

// 保存日记条目到缓存
export function saveJournalEntriesToCache(entries: CachedJournalEntry[]): void {
  try {
    const cacheData = {
      entries,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`已缓存 ${entries.length} 条日记记录`);
  } catch (error) {
    console.error('保存日记缓存失败:', error);
  }
}

// 从缓存获取日记条目
export function getJournalEntriesFromCache(): CachedJournalEntry[] {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return [];

    const { entries, timestamp } = JSON.parse(cachedData);

    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_DURATION) {
      console.log('日记缓存已过期');
      localStorage.removeItem(CACHE_KEY);
      return [];
    }

    console.log(`从缓存加载 ${entries.length} 条日记记录`);
    return entries;
  } catch (error) {
    console.error('读取日记缓存失败:', error);
    return [];
  }
}

// 保存统计数据到缓存
export function saveStatsToCache(stats: CachedStats): void {
  try {
    localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
    console.log('已缓存统计数据:', stats);
  } catch (error) {
    console.error('保存统计缓存失败:', error);
  }
}

// 从缓存获取统计数据
export function getStatsFromCache(): CachedStats | null {
  try {
    const cachedStats = localStorage.getItem(CACHE_STATS_KEY);
    if (!cachedStats) return null;

    const stats = JSON.parse(cachedStats);
    console.log('从缓存加载统计数据:', stats);
    return stats;
  } catch (error) {
    console.error('读取统计缓存失败:', error);
    return null;
  }
}

// 清除缓存
export function clearJournalCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_STATS_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('已清除日记缓存');
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

// 检查缓存是否存在且有效
export function isCacheValid(): boolean {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge < CACHE_DURATION;
  } catch (error) {
    return false;
  }
}

// 获取缓存信息
export function getCacheInfo(): { exists: boolean; age: number; entries: number } {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (!timestamp || !cachedData) {
      return { exists: false, age: 0, entries: 0 };
    }

    const { entries } = JSON.parse(cachedData);
    const age = Date.now() - parseInt(timestamp);

    return {
      exists: true,
      age,
      entries: entries?.length || 0
    };
  } catch (error) {
    return { exists: false, age: 0, entries: 0 };
  }
}