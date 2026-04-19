import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalEntryInsert, JournalEntryUpdate } from '../types/database';

// 简单的连接测试
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; duration: number }> {
  try {
    const startTime = Date.now();
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      }
    });
    const duration = Date.now() - startTime;

    if (response.ok) {
      return { success: true, message: '连接成功', duration };
    } else {
      return { success: false, message: `HTTP ${response.status}: ${response.statusText}`, duration };
    }
  } catch (error: any) {
    return { success: false, message: error.message, duration: 0 };
  }
}

export interface CreateJournalData {
  user_id: string;
  title?: string;
  content: string;
  rating?: number;
  tags?: string[];
  mood_before?: string;
  mood_after?: string;
  session_id?: string;
}

export interface UpdateJournalData {
  id: string;
  title?: string;
  content?: string;
  rating?: number;
  tags?: string[];
  mood_before?: string;
  mood_after?: string;
  session_id?: string;
}

// 获取所有日记
export async function getJournalEntries(userId: string): Promise<{ entries: JournalEntry[]; error: Error | null }> {
  try {
    console.log('getJournalEntries开始执行，userId:', userId);

    console.log('开始执行 Supabase 查询...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const duration = Date.now() - startTime;
    console.log(`getJournalEntries Supabase查询完成，耗时: ${duration}ms`);
    console.log('getJournalEntries 查询结果:', { data: data?.length, error });

    if (error) {
      console.error('getJournalEntries错误:', error);
      console.error('错误详情:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { entries: [], error };
    }

    console.log('getJournalEntries成功，返回', data?.length || 0, '条记录');
    return { entries: data || [], error: null };
  } catch (error: any) {
    console.error('getJournalEntries异常:', error);
    console.error('异常类型:', error.constructor.name);
    console.error('异常消息:', error.message);
    console.error('异常堆栈:', error.stack);
    return { entries: [], error: error as Error };
  }
}

// 获取单个日记
export async function getJournalEntry(entryId: string): Promise<{ entry: JournalEntry | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) {
      return { entry: null, error };
    }

    return { entry: data, error: null };
  } catch (error) {
    return { entry: null, error: error as Error };
  }
}

// 创建日记
export async function createJournalEntry(data: CreateJournalData): Promise<{ entry: JournalEntry | null; error: Error | null }> {
  try {
    const { data: newEntry, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: data.user_id,
        title: data.title || null,
        content: data.content,
        rating: data.rating || null,
        tags: data.tags || [],
        mood_before: data.mood_before || null,
        mood_after: data.mood_after || null,
        session_id: data.session_id || null,
      } as JournalEntryInsert)
      .select()
      .single();

    if (error) {
      return { entry: null, error };
    }

    return { entry: newEntry, error: null };
  } catch (error) {
    return { entry: null, error: error as Error };
  }
}

// 更新日记
export async function updateJournalEntry(data: UpdateJournalData): Promise<{ entry: JournalEntry | null; error: Error | null }> {
  try {
    const { data: updatedEntry, error } = await supabase
      .from('journal_entries')
      .update({
        title: data.title,
        content: data.content,
        rating: data.rating,
        tags: data.tags,
        mood_before: data.mood_before,
        mood_after: data.mood_after,
        session_id: data.session_id,
      } as JournalEntryUpdate)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      return { entry: null, error };
    }

    return { entry: updatedEntry, error: null };
  } catch (error) {
    return { entry: null, error: error as Error };
  }
}

// 删除日记
export async function deleteJournalEntry(entryId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 按标签搜索日记
export async function searchJournalByTags(
  userId: string,
  tags: string[]
): Promise<{ entries: JournalEntry[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', tags)
      .order('created_at', { ascending: false });

    if (error) {
      return { entries: [], error };
    }

    return { entries: data || [], error: null };
  } catch (error) {
    return { entries: [], error: error as Error };
  }
}

// 全文搜索日记
export async function searchJournalEntries(
  userId: string,
  query: string
): Promise<{ entries: JournalEntry[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return { entries: [], error };
    }

    return { entries: data || [], error: null };
  } catch (error) {
    return { entries: [], error: error as Error };
  }
}

// 获取日记统计
export async function getJournalStats(userId: string): Promise<{
  total: number;
  avgRating: number;
  totalTags: number;
  error: Error | null;
}> {
  try {
    console.log('getJournalStats开始执行，userId:', userId);

    console.log('getJournalStats 开始执行 Supabase 查询...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('rating, tags')
      .eq('user_id', userId);

    const duration = Date.now() - startTime;
    console.log(`getJournalStats Supabase查询完成，耗时: ${duration}ms`);
    console.log('getJournalStats 查询结果:', { data: data?.length, error });

    if (error) {
      console.error('getJournalStats错误:', error);
      // 统计数据失败不影响主要功能，返回默认值
      return { total: 0, avgRating: 0, totalTags: 0, error: null };
    }

    const entries = data || [];
    const total = entries.length;
    const ratings = entries.filter(e => e.rating).map(e => e.rating!);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    // 计算唯一标签数
    const allTags = entries.flatMap(e => e.tags || []);
    const uniqueTags = new Set(allTags);
    const totalTags = uniqueTags.size;

    console.log('getJournalStats成功:', { total, avgRating, totalTags });
    return { total, avgRating, totalTags, error: null };
  } catch (error: any) {
    console.error('getJournalStats异常:', error);
    console.error('异常类型:', error.constructor.name);
    console.error('异常消息:', error.message);

    // 统计数据失败不影响主要功能，返回默认值
    return { total: 0, avgRating: 0, totalTags: 0, error: null };
  }
}

// 获取最近的日记
export async function getRecentJournalEntries(
  userId: string,
  limit: number = 5
): Promise<{ entries: JournalEntry[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { entries: [], error };
    }

    return { entries: data || [], error: null };
  } catch (error) {
    return { entries: [], error: error as Error };
  }
}

// 按日期范围获取日记
export async function getJournalEntriesByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ entries: JournalEntry[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      return { entries: [], error };
    }

    return { entries: data || [], error: null };
  } catch (error) {
    return { entries: [], error: error as Error };
  }
}