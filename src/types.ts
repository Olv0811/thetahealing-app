export type View = 'home' | 'wisdom' | 'journal' | 'profile' | 'ai-session';

export interface Session {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  category: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  time: string;
  rating: number;
  tags: string[];
  content: string;
  sessionId?: string | null;
  moodBefore?: string;
  moodAfter?: string;
}

export interface Book {
  id: string;
  title: string;
  image: string;
  bookmarks: number;
  marks: number;
  category: string;
  isNew?: boolean;
}

// 添加缺失的JSX类型支持
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// 定义缺失的类型
export interface BookmarkType {
  id: string;
  book_id: string;
  page_number: number;
  title: string;
  note?: string;
  created_at?: string;
}

export interface NoteType {
  id: string;
  book_id: string;
  page_number: number;
  text_content: string;
  highlight_text?: string;
  created_at?: string;
}

export interface MatchedItem {
  bookId: string;
  bookTitle: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  keywords: string[];
}

// 数据库相关类型
export interface CachedJournalEntry {
  id: string;
  user_id: string;
  session_id: string | null;
  title: string;
  content: string;
  rating: number;
  tags: string[];
  mood_before?: string;
  mood_after?: string;
  created_at: string;
  updated_at: string;
}
