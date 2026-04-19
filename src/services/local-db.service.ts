import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PDFContent {
  book_id: string;
  title: string;
  content: string;
  total_pages: number;
  file_path: string;
  extracted_at: string;
  updated_at: string;
}

export interface QAKnowledge {
  question_number: number;
  question: string;
  answer: string;
  source_file: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  bookId: string;
  bookTitle: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  keywords: string[];
}

interface ThetaHealingDB extends DBSchema {
  pdf_contents: {
    key: string;
    value: PDFContent;
    indexes: { 'by-title': string };
  };
  qa_knowledge_base: {
    key: number;
    value: QAKnowledge;
    indexes: { 'by-category': string };
  };
  search_cache: {
    key: string;
    value: { query: string; results: SearchResult[]; timestamp: number };
    indexes: { 'by-query': string };
  };
}

export class LocalDatabase {
  private db: IDBPDatabase<ThetaHealingDB> | null = null;
  private static readonly DB_NAME = 'ThetaHealingDB';
  private static readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<ThetaHealingDB>(LocalDatabase.DB_NAME, LocalDatabase.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from ${oldVersion} to ${newVersion}`);

          if (oldVersion < 1) {
            // Create pdf_contents store
            const pdfStore = db.createObjectStore('pdf_contents', { keyPath: 'book_id' });
            pdfStore.createIndex('by-title', 'title', { unique: false });

            // Create qa_knowledge_base store
            const qaStore = db.createObjectStore('qa_knowledge_base', { keyPath: 'question_number' });
            qaStore.createIndex('by-category', 'category', { unique: false });

            // Create search_cache store
            const cacheStore = db.createObjectStore('search_cache', { keyPath: 'query' });
            cacheStore.createIndex('by-query', 'query', { unique: true });
          }
        },
        blocked() {
          console.warn('Database blocked - another connection is open');
        },
        blocking() {
          console.warn('Database blocking - closing other connections');
        },
      });

      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  // PDF Content operations
  async savePDFContent(content: PDFContent): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put('pdf_contents', content);
      console.log(`Saved PDF content for book ${content.book_id}`);
    } catch (error) {
      console.error(`Failed to save PDF content for book ${content.book_id}:`, error);
      throw error;
    }
  }

  async getPDFContent(bookId: string): Promise<PDFContent | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('pdf_contents', bookId);
  }

  async getAllPDFContents(): Promise<PDFContent[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('pdf_contents');
  }

  async searchPDFContent(query: string): Promise<PDFContent[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results: PDFContent[] = [];
    const tx = this.db.transaction('pdf_contents', 'readonly');
    const store = tx.objectStore('pdf_contents');
    const index = store.index('by-title');

    // Search by title
    for await (const cursor of index.iterate()) {
      const content = cursor.value;
      if (content.title.toLowerCase().includes(query.toLowerCase()) ||
          content.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(content);
      }
    }

    return results;
  }

  // Q&A Knowledge operations
  async saveQAKnowledge(knowledge: QAKnowledge): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put('qa_knowledge_base', knowledge);
      console.log(`Saved Q&A knowledge #${knowledge.question_number}`);
    } catch (error) {
      console.error(`Failed to save Q&A knowledge #${knowledge.question_number}:`, error);
      throw error;
    }
  }

  async getQAKnowledge(questionNumber: number): Promise<QAKnowledge | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.get('qa_knowledge_base', questionNumber);
  }

  async getAllQAKnowledge(): Promise<QAKnowledge[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAll('qa_knowledge_base');
  }

  async searchQAKnowledge(query: string): Promise<QAKnowledge[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results: QAKnowledge[] = [];
    const tx = this.db.transaction('qa_knowledge_base', 'readonly');
    const store = tx.objectStore('qa_knowledge_base');

    // Search by question and answer
    for await (const cursor of store.iterate()) {
      const knowledge = cursor.value;
      if (knowledge.question.toLowerCase().includes(query.toLowerCase()) ||
          knowledge.answer.toLowerCase().includes(query.toLowerCase())) {
        results.push(knowledge);
      }
    }

    return results;
  }

  // Search cache operations
  async getSearchCache(query: string): Promise<SearchResult[] | null> {
    if (!this.db) throw new Error('Database not initialized');

    const cache = await this.db.get('search_cache', query);
    if (!cache) return null;

    // Check if cache is still valid (5 minutes)
    if (Date.now() - cache.timestamp > 5 * 60 * 1000) {
      await this.deleteSearchCache(query);
      return null;
    }

    return cache.results;
  }

  async saveSearchCache(query: string, results: SearchResult[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('search_cache', {
      query,
      results,
      timestamp: Date.now(),
    });
  }

  async deleteSearchCache(query: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('search_cache', query);
  }

  async clearSearchCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('search_cache');
  }

  // Utility methods
  async getStats(): Promise<{ pdfCount: number; qaCount: number; cacheCount: number }> {
    if (!this.db) {
      return { pdfCount: 0, qaCount: 0, cacheCount: 0 };
    }

    const pdfCount = await this.db.count('pdf_contents');
    const qaCount = await this.db.count('qa_knowledge_base');
    const cacheCount = await this.db.count('search_cache');

    return { pdfCount, qaCount, cacheCount };
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.clear('pdf_contents');
    await this.db.clear('qa_knowledge_base');
    await this.db.clear('search_cache');

    console.log('All database data cleared');
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }
}

// Singleton instance
let localDatabaseInstance: LocalDatabase | null = null;

export function getLocalDatabase(): LocalDatabase {
  if (!localDatabaseInstance) {
    localDatabaseInstance = new LocalDatabase();
  }
  return localDatabaseInstance;
}

export function destroyLocalDatabase(): void {
  if (localDatabaseInstance) {
    localDatabaseInstance.close();
    localDatabaseInstance = null;
  }
}