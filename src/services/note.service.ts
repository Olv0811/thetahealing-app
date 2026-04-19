import { supabase } from '../lib/supabase';
import type { Note, NoteInsert, NoteUpdate } from '../types/database';

export interface CreateNoteData {
  user_id: string;
  book_id: string;
  page_number?: number;
  text_content: string;
  highlight_text?: string;
  highlight_start_position?: number;
  highlight_end_position?: number;
  color?: string;
}

export interface UpdateNoteData {
  id: string;
  text_content?: string;
  highlight_text?: string;
  highlight_start_position?: number;
  highlight_end_position?: number;
  color?: string;
}

// 获取所有笔记
export async function getNotes(userId: string): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

// 按书籍获取笔记
export async function getNotesByBook(userId: string, bookId: string): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('page_number', { ascending: true });

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

// 按页码获取笔记
export async function getNotesByPage(userId: string, bookId: string, pageNumber: number): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('page_number', pageNumber)
      .order('created_at', { ascending: false });

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

// 创建笔记
export async function createNote(data: CreateNoteData): Promise<{ note: Note | null; error: Error | null }> {
  try {
    const { data: newNote, error } = await supabase
      .from('notes')
      .insert({
        user_id: data.user_id,
        book_id: data.book_id,
        page_number: data.page_number || null,
        text_content: data.text_content,
        highlight_text: data.highlight_text || null,
        highlight_start_position: data.highlight_start_position || null,
        highlight_end_position: data.highlight_end_position || null,
        color: data.color || '#ffff00',
      } as NoteInsert)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: newNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

// 更新笔记
export async function updateNote(data: UpdateNoteData): Promise<{ note: Note | null; error: Error | null }> {
  try {
    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update({
        text_content: data.text_content,
        highlight_text: data.highlight_text,
        highlight_start_position: data.highlight_start_position,
        highlight_end_position: data.highlight_end_position,
        color: data.color,
      } as NoteUpdate)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: updatedNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

// 删除笔记
export async function deleteNote(noteId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

// 搜索笔记
export async function searchNotes(userId: string, query: string): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .or(`text_content.ilike.%${query}%,highlight_text.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

// 获取笔记统计
export async function getNoteStats(userId: string): Promise<{
  total: number;
  byBook: Record<string, number>;
  byColor: Record<string, number>;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('book_id, color')
      .eq('user_id', userId);

    if (error) {
      return { total: 0, byBook: {}, byColor: {}, error };
    }

    const notes = data || [];
    const total = notes.length;
    const byBook: Record<string, number> = {};
    const byColor: Record<string, number> = {};

    notes.forEach(note => {
      const bookId = note.book_id;
      const color = note.color || '#ffff00';

      byBook[bookId] = (byBook[bookId] || 0) + 1;
      byColor[color] = (byColor[color] || 0) + 1;
    });

    return { total, byBook, byColor, error: null };
  } catch (error) {
    return { total: 0, byBook: {}, byColor: {}, error: error as Error };
  }
}

// 批量创建笔记
export async function createNotes(notes: CreateNoteData[]): Promise<{ notes: Note[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert(notes as NoteInsert[])
      .select();

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}