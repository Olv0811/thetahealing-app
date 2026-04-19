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
