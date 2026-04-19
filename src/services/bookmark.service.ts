import { supabase } from '../lib/supabase';
import type { Bookmark, BookmarkInsert, BookmarkUpdate } from '../types/database';

export interface CreateBookmarkData {
  user_id: string;
  book_id: string;
  page_number?: number;
  title?: string;
  note?: string;
}

export interface UpdateBookmarkData {
  id: string;
  page_number?: number;
  title?: string;
  note?: string;
}

// 获取所有书签
export async function getBookmarks(userId: string): Promise<{ bookmarks: Bookmark[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { bookmarks: [], error };
    }

    return { bookmarks: data || [], error: null };
  } catch (error) {
    return { bookmarks: [], error: error as Error };
  }
}

// 按书籍获取书签
export async function getBookmarksByBook(userId: string, bookId: string): Promise<{ bookmarks: Bookmark[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('page_number', { ascending: true });

    if (error) {
      return { bookmarks: [], error };
    }

    return { bookmarks: data || [], error: null };
  } catch (error) {
    return { bookmarks: [], error: error as Error };
  }
}

// 创建书签
export async function createBookmark(data: CreateBookmarkData): Promise<{ bookmark: Bookmark | null; error: Error | null }> {
  try {
    const { data: newBookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: data.user_id,
        book_id: data.book_id,
        page_number: data.page_number || null,
        title: data.title || null,
        note: data.note || null,
      } as BookmarkInsert)
      .select()
      .single();

    if (error) {
      return { bookmark: null, error };
    }

    return { bookmark: newBookmark, error: null };
  } catch (error) {
    return { bookmark: null, error: error as Error };
  }
}

// 更新书签
export async function updateBookmark(data: UpdateBookmarkData): Promise<{ bookmark: Bookmark | null; error: Error | null }> {
  try {
    const { data: updatedBookmark, error } = await supabase
      .from('bookmarks')
      .update({
        page_number: data.page_number,
        title: data.title,
        note: data.note,
      } as BookmarkUpdate)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      return { bookmark: null, error };
    }

    return { bookmark: updatedBookmark, error: null };
  } catch (error) {
    return { bookmark: null, error: error as Error };
  }
}

// 删除书签
export async function deleteBookmark(bookmarkId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 检查书签是否存在
export async function checkBookmarkExists(userId: string, bookId: string, pageNumber?: number): Promise<{ exists: boolean; error: Error | null }> {
  try {
    let query = supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (pageNumber !== undefined) {
      query = query.eq('page_number', pageNumber);
    }

    const { data, error } = await query;

    if (error) {
      return { exists: false, error };
    }

    return { exists: (data?.length || 0) > 0, error: null };
  } catch (error) {
    return { exists: false, error: error as Error };
  }
}

// 获取书签统计
export async function getBookmarkStats(userId: string): Promise<{
  total: number;
  byBook: Record<string, number>;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('book_id')
      .eq('user_id', userId);

    if (error) {
      return { total: 0, byBook: {}, error };
    }

    const bookmarks = data || [];
    const total = bookmarks.length;
    const byBook: Record<string, number> = {};

    bookmarks.forEach(bookmark => {
      const bookId = bookmark.book_id;
      byBook[bookId] = (byBook[bookId] || 0) + 1;
    });

    return { total, byBook, error: null };
  } catch (error) {
    return { total: 0, byBook: {}, error: error as Error };
  }
}