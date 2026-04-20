import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bookmark, X, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { BOOKS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { getBookmarks, getBookmarkStats } from '../services/bookmark.service';
import { getNotes, getNoteStats } from '../services/note.service';
import { simpleFuzzySearch, MatchedItem } from '../services/simple-search.service';
import PDFReader from './PDFReader';
import type { Book, BookmarkType, NoteType } from '../types';

// 缓存键
const CACHE_KEYS = {
  BOOKMARKS: 'knowledge_bookmarks_cache',
  NOTES: 'knowledge_notes_cache',
  BOOKMARK_STATS: 'knowledge_bookmark_stats_cache',
  NOTE_STATS: 'knowledge_note_stats_cache',
  CACHE_TIMESTAMP: 'knowledge_cache_timestamp',
};

// 缓存有效期（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000;

// 书籍 ID 到 PDF 文件的映射
const PDF_FILE_MAP: Record<string, string> = {
  '1': '/basic-dna-manual.pdf',
  '2': '/advanced-dna-practitioner.pdf',
  '3': '/dig-deeper-guide.pdf',
  '4': '/theta-healing-knowledge-base.pdf',
};

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [bookmarkStats, setBookmarkStats] = useState({ total: 0, byBook: {} as Record<string, number> });
  const [noteStats, setNoteStats] = useState({ total: 0, byBook: {} as Record<string, number> });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showPDFReader, setShowPDFReader] = useState(false);

  // 本地搜索相关状态
  const [matchedItems, setMatchedItems] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  // 初始化搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 缓存辅助函数
  const getCache = useCallback(<T,>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data as T;
    } catch {
      return null;
    }
  }, []);

  const setCache = useCallback(<T,>(key: string, data: T): void => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // 加载书签和笔记数据（仅在用户登录时）
  const loadKnowledgeData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('用户未登录，跳过加载');
      return;
    }

    try {
      console.log('开始加载知识库数据...');
      setLoading(true);
      setError('');

      // 如果不是强制刷新，尝试从缓存加载
      if (!forceRefresh) {
        const cachedBookmarks = getCache<BookmarkType[]>(CACHE_KEYS.BOOKMARKS);
        const cachedNotes = getCache<NoteType[]>(CACHE_KEYS.NOTES);
        const cachedBookmarkStats = getCache<{ total: number; byBook: Record<string, number> }>(CACHE_KEYS.BOOKMARK_STATS);
        const cachedNoteStats = getCache<{ total: number; byBook: Record<string, number> }>(CACHE_KEYS.NOTE_STATS);

        if (cachedBookmarks && cachedNotes && cachedBookmarkStats && cachedNoteStats) {
          console.log('使用缓存数据');
          setBookmarks(cachedBookmarks);
          setNotes(cachedNotes);
          setBookmarkStats(cachedBookmarkStats);
          setNoteStats(cachedNoteStats);
          setLoading(false);
          return;
        }
      }

      // 从服务器加载数据
      console.log('从服务器加载数据');
      const [bookmarksData, bookmarkStatsData, notesData, noteStatsData] = await Promise.all([
        getBookmarks(user.id),
        getBookmarkStats(user.id),
        getNotes(user.id),
        getNoteStats(user.id),
      ]);

      console.log('数据加载完成:', {
        bookmarks: bookmarksData.bookmarks?.length || 0,
        notes: notesData.notes?.length || 0,
        bookmarkStats: bookmarkStatsData.total,
        noteStats: noteStatsData.total,
      });

      if (!bookmarksData.error && bookmarksData.bookmarks) {
        setBookmarks(bookmarksData.bookmarks);
        setCache(CACHE_KEYS.BOOKMARKS, bookmarksData.bookmarks);
      }

      if (!bookmarkStatsData.error) {
        setBookmarkStats(bookmarkStatsData);
        setCache(CACHE_KEYS.BOOKMARK_STATS, bookmarkStatsData);
      }

      if (!notesData.error && notesData.notes) {
        setNotes(notesData.notes);
        setCache(CACHE_KEYS.NOTES, notesData.notes);
      }

      if (!noteStatsData.error) {
        setNoteStats(noteStatsData);
        setCache(CACHE_KEYS.NOTE_STATS, noteStatsData);
      }

      // 更新缓存时间戳
      setCache(CACHE_KEYS.CACHE_TIMESTAMP, Date.now());
    } catch (err: any) {
      console.error('加载知识库数据失败:', err);
      console.error('错误详情:', {
        message: err.message,
        stack: err.stack,
      });
      
      // 如果网络请求失败，尝试使用缓存数据
      const cachedBookmarks = getCache<BookmarkType[]>(CACHE_KEYS.BOOKMARKS);
      const cachedNotes = getCache<NoteType[]>(CACHE_KEYS.NOTES);
      const cachedBookmarkStats = getCache<{ total: number; byBook: Record<string, number> }>(CACHE_KEYS.BOOKMARK_STATS);
      const cachedNoteStats = getCache<{ total: number; byBook: Record<string, number> }>(CACHE_KEYS.NOTE_STATS);

      if (cachedBookmarks && cachedNotes && cachedBookmarkStats && cachedNoteStats) {
        console.log('使用离线缓存数据');
        setBookmarks(cachedBookmarks);
        setNotes(cachedNotes);
        setBookmarkStats(cachedBookmarkStats);
        setNoteStats(cachedNoteStats);
      } else {
        setError(err.message || '加载知识库数据失败');
      }
    } finally {
      console.log('加载完成，设置 loading 为 false');
      setLoading(false);
    }
  }, [user, getCache, setCache]);

  useEffect(() => {
    console.log('useEffect 触发，用户状态:', !!user);
    if (user) {
      loadKnowledgeData();
    } else {
      // 用户未登录时，确保不显示加载状态
      setLoading(false);
    }
  }, [user, loadKnowledgeData]);

  const handleBookClick = (book: Book) => {
    const pdfFile = PDF_FILE_MAP[book.id];
    if (pdfFile) {
      setSelectedBook(book);
      setShowPDFReader(true);
    } else {
      alert('暂无 PDF 文件');
    }
  };

  const handlePDFClose = () => {
    setShowPDFReader(false);
    setSelectedBook(null);
  };

  // 保存搜索历史到 localStorage
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;

    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowHistory(e.target.value === '');
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    saveToHistory(searchQuery);
    setShowHistory(false);

    // 进行本地搜索
    setIsMatching(true);
    setShowMatches(true);

    try {
      console.log('开始本地搜索:', searchQuery);
      const { matches, error } = await simpleFuzzySearch(searchQuery);

      if (error) {
        console.error('本地搜索失败:', error);
        setMatchedItems([]);
        setError(`搜索失败: ${error}`);
      } else {
        console.log('本地搜索成功，找到', matches.length, '个匹配项');
        setMatchedItems(matches);
        setError('');
      }
    } catch (err) {
      console.error('本地搜索时发生错误:', err);
      setMatchedItems([]);
      setError(`搜索时发生错误: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsMatching(false);
    }
  };
  
  // 处理用户选择匹配项 - 直接显示详情
  const handleMatchSelect = (match: MatchedItem) => {
    console.log('用户选择了匹配项:', match);
    // 可以在这里添加显示详情的逻辑，比如打开PDF或显示完整答案
    alert(`已选择: ${match.title}\n\n${match.snippet}`);
  };

  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <div className="relative min-h-screen">
      {/* 背景图片层 */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2079&auto=format&fit=crop")' }}
      />
      
      {/* 半透明背景遮罩层 */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-slate-900/90" />
      
      {/* 内容层 */}
      <div className="relative z-10 max-w-4xl mx-auto p-6 md:p-12">
        {/* Header */}
        <header className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface-container-low rounded-full text-sm text-on-surface-variant">
            <Search className="w-4 h-4 text-tertiary" />
            <span>知识库搜索</span>
            <span>•</span>
            <span className="text-xs">{bookmarkStats.total} 书签</span>
          </div>
          <div>
            <h1 className="text-4xl font-headline font-bold text-white tracking-wide mb-3">希塔疗愈知识库</h1>
            <p className="text-white/80 text-lg">输入关键词，AI 将从知识库中为你找到最相关的答案</p>
          </div>
        </header>

        {/* Error 状态显示 */}
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6">
            <p className="text-center">{error}</p>
            <button
              onClick={loadKnowledgeData}
              className="mt-2 mx-auto block px-4 py-2 bg-error text-on-error rounded-lg text-sm"
            >
              重试
            </button>
          </div>
        )}

        {/* 搜索框 */}
        <section className="relative">
          <div className="relative group max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/60 w-5 h-5" />
                <input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowHistory(searchQuery === '')}
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-5 pl-16 pr-28 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                  placeholder="搜索疗愈文档、经文或技巧..."
                  type="text"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    搜索
                  </button>
                </div>
              </div>
            </form>

            {/* 搜索历史 */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden z-10">
                <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-sm font-medium text-on-surface">搜索历史</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    清空
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryItemClick(query)}
                      className="w-full px-4 py-3 text-left hover:bg-surface-container-high transition-colors flex items-center gap-3"
                    >
                      <Clock className="w-4 h-4 text-on-surface-variant" />
                      <span className="text-sm text-on-surface">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 模糊查询匹配结果 */}
        {showMatches && (
          <section className="mt-12">
            {isMatching ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl">
                <Loader2 className="w-12 h-12 text-white/60 animate-spin mb-4" />
                <div className="text-center">
                  <p className="text-lg text-white mb-2">正在搜索匹配内容...</p>
                  <p className="text-sm text-white/70">这可能需要几秒钟时间</p>
                </div>
              </div>
            ) : matchedItems.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">找到 {matchedItems.length} 个匹配项</h2>
                  <button
                    onClick={() => {
                      setShowMatches(false);
                      setMatchedItems([]);
                    }}
                    className="px-4 py-2 bg-surface-container-low text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors"
                  >
                    取消
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {matchedItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl p-6 shadow-lg border border-white/20 backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => handleMatchSelect(item)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Bookmark className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-full">
                              {item.bookTitle}
                            </span>
                            <span className="text-xs px-2 py-1 bg-primary/20 text-white/80 rounded-full">
                              相关性: {Math.round(item.relevanceScore * 10)}%
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
                          <p className="text-sm text-white/70 leading-relaxed mb-3">{item.snippet}</p>
                          {item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.keywords.slice(0, 5).map((keyword, kidx) => (
                                <span
                                  key={kidx}
                                  className="text-xs px-2 py-1 bg-white/5 text-white/60 rounded"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl">
                <AlertCircle className="w-16 h-16 text-white/40 mb-4" />
                <div className="text-center">
                  <p className="text-lg text-white mb-2">没有找到匹配内容</p>
                  <p className="text-sm text-white/70">请尝试使用其他关键词</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 空状态提示 */}
        {!showMatches && !searchQuery && (
          <div className="text-center py-16 rounded-2xl">
            <Search className="w-16 h-16 text-primary/20 mx-auto mb-4" />
            <div className="text-center">
              <p className="text-lg text-white/90 mb-2">在上方搜索框输入关键词</p>
              <p className="text-sm text-white/70">将从希塔疗愈知识库中为你找到最相关的答案</p>
            </div>
          </div>
        )}
        
        {/* PDF 阅读器 */}
        {showPDFReader && selectedBook && (
          <PDFReader
            fileUrl={PDF_FILE_MAP[selectedBook.id]}
            fileName={selectedBook.title}
            bookId={selectedBook.id}
            onClose={handlePDFClose}
          />
        )}
      </div>
    </div>
  );
}