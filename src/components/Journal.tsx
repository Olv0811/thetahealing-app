import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Edit3, ArrowRight, Loader2, Plus, Trash2, Search, Filter, X, Calendar, Tag, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getJournalEntries, getJournalStats } from '../services/journal.service';
import {
  getJournalEntriesFromCache,
  getStatsFromCache,
  saveJournalEntriesToCache,
  saveStatsToCache,
  isCacheValid,
  getCacheInfo
} from '../services/local-journal-cache';
import type { JournalEntry as JournalEntryType } from '../types/database';
import JournalEditor from './JournalEditor';

interface JournalProps {
  onLoginRedirect?: () => void;
}

export default function Journal({ onLoginRedirect }: JournalProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<JournalEntryType[]>([]);
    const [stats, setStats] = useState({ total: 0, avgRating: 0, totalTags: 0 });
    const [loading, setLoading] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState('');
    const [isLocalMode, setIsLocalMode] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntryType | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const handleNewEntry = () => {
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
    setEditingEntry(null);
  };

  const handleEditorSave = () => {
    setEditorOpen(false);
    setEditingEntry(null);
    loadJournalData();
  };

  const handleEditEntry = (entry: JournalEntryType) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('确定要删除这篇日记吗？')) return;

    try {
      // 使用本地数据删除，不连接数据库
      const currentEntries = getJournalEntriesFromCache();
      const updatedEntries = currentEntries.filter(entry => entry.id !== entryId);
      
      saveJournalEntriesToCache(updatedEntries);
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      
      // 更新统计
      const updatedStats = {
        total: updatedEntries.length,
        avgRating: updatedEntries.length > 0 
          ? updatedEntries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / updatedEntries.length 
          : 0,
        totalTags: Array.from(new Set(updatedEntries.flatMap(entry => entry.tags || []))).length
      };
      saveStatsToCache(updatedStats);
      setStats(updatedStats);
      
      alert('删除成功（仅本地数据）');
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  useEffect(() => {
    console.log('Journal组件useEffect触发，用户状态:', user);
    // 防止重复加载
    if (user && !isLoadingData) {
      console.log('用户已登录，开始加载日记数据');
      setIsLoadingData(true);
      loadJournalData().finally(() => {
        setIsLoadingData(false);
      });
    } else if (!user) {
      console.log('用户未登录，设置loading为false');
      // 用户未登录，也要结束加载状态
      setLoading(false);
    }
  }, [user?.id]); // 只依赖用户ID，避免重复触发

  const loadJournalData = async () => {
    if (!user) {
      console.log('loadJournalData被调用但用户为null，直接返回');
      return;
    }

    try {
      console.log('loadJournalData开始执行，设置loading为true');
      setLoading(true);
      setError('');
      
      // 暂时使用本地数据，不连接Supabase
      console.log('使用本地数据模式（暂时绕过数据库连接）');
      
      // 尝试从缓存加载
      let cachedEntries = getJournalEntriesFromCache();
      let cachedStats = getStatsFromCache();
      
      if (cachedEntries.length === 0) {
        // 如果没有缓存，使用示例数据
        console.log('无缓存数据，使用示例数据');
        cachedEntries = [
          {
            id: 'sample-1',
            user_id: user.id,
            title: '示例日记',
            content: '这是一个示例日记记录。数据库连接暂时禁用，此为演示数据。',
            rating: 4,
            tags: ['示例', '演示'],
            mood_before: '平静',
            mood_after: '放松',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        cachedStats = { total: 1, avgRating: 4, totalTags: 2 };
        
        // 保存到缓存
        saveJournalEntriesToCache(cachedEntries);
        saveStatsToCache(cachedStats);
      }
      
      setEntries(cachedEntries);
      setFilteredEntries(cachedEntries);
      setStats(cachedStats);
      
      // 设置本地模式状态和消息
      setIsLocalMode(true);
      setStatusMessage(`数据库连接暂时禁用，显示本地数据 (${cachedEntries.length} 条记录)`);
      
      console.log('本地数据加载完成:', {
        entries: cachedEntries.length,
        stats: cachedStats
      });

    } catch (err: any) {
      console.error('加载日记异常:', err);
      setError(err.message || '加载日记失败');

      // 尝试使用缓存数据，如果没有则提供示例数据
      const cachedEntries = getJournalEntriesFromCache();
      const cachedStats = getStatsFromCache();

      if (cachedEntries.length > 0) {
        setEntries(cachedEntries);
        setFilteredEntries(cachedEntries);
        setIsLocalMode(true);
        setStatusMessage(`使用缓存数据 (${cachedEntries.length} 条记录)`);
      } else {
        // 提供示例数据
        const sampleData = [
          {
            id: 'sample-1',
            user_id: user?.id || 'demo-user',
            title: '示例日记',
            content: '这是一个示例日记记录。由于数据库连接问题，目前显示的是本地数据。',
            rating: 4,
            tags: ['示例', '演示'],
            mood_before: '平静',
            mood_after: '放松',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setEntries(sampleData);
        setFilteredEntries(sampleData);
        setStats({ total: 1, avgRating: 4, totalTags: 2 });
        setIsLocalMode(true);
        setStatusMessage('显示示例数据');
      }

      if (cachedStats) {
        setStats(cachedStats);
      } else {
        setStats({ total: 0, avgRating: 0, totalTags: 0 });
      }
    } finally {
      console.log('loadJournalData完成，设置loading为false');
      setLoading(false);
    }
  };

  // 搜索和筛选逻辑
  useEffect(() => {
    let filtered = [...entries];

    // 文本搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        (entry.title && entry.title.toLowerCase().includes(query)) ||
        entry.content.toLowerCase().includes(query) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        entry.tags && selectedTags.every(tag => entry.tags!.includes(tag))
      );
    }

    // 日期范围筛选
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      filtered = filtered.filter(entry => new Date(entry.created_at) >= startDate);
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedTags, dateRange]);

  // 获取所有唯一标签
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags || [])));

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setDateRange('all');
  };

  // 导出功能
  const handleExportAsText = () => {
    const entriesToExport = filteredEntries.length > 0 ? filteredEntries : entries;
    if (entriesToExport.length === 0) {
      alert('没有日记可以导出');
      return;
    }

    let text = '=== 疗愈日记导出 ===\n';
    text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    text += `总记录数: ${entriesToExport.length}\n\n`;

    entriesToExport.forEach((entry, index) => {
      text += `${'='.repeat(40)}\n`;
      text += `记录 #${index + 1}\n`;
      text += `${'='.repeat(40)}\n`;
      text += `日期: ${formatDate(entry.created_at)} ${formatTime(entry.created_at)}\n`;
      if (entry.title) text += `标题: ${entry.title}\n`;
      if (entry.rating) text += `评分: ${'⭐'.repeat(entry.rating)}\n`;
      if (entry.mood_before) text += `冥想前心情: ${entry.mood_before}\n`;
      if (entry.mood_after) text += `冥想后心情: ${entry.mood_after}\n`;
      if (entry.tags && entry.tags.length > 0) text += `标签: ${entry.tags.join(', ')}\n`;
      text += `\n内容:\n${entry.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `疗愈日记_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAsJSON = () => {
    const entriesToExport = filteredEntries.length > 0 ? filteredEntries : entries;
    if (entriesToExport.length === 0) {
      alert('没有日记可以导出');
      return;
    }

    const data = {
      exportTime: new Date().toISOString(),
      totalEntries: entriesToExport.length,
      entries: entriesToExport
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `疗愈日记_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-on-surface">需要登录</h2>
          <p className="text-on-surface-variant">请先登录以访问疗愈日记功能</p>
        </div>
        <button
          onClick={onLoginRedirect || (() => window.location.href = '/')}
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium"
        >
          前往登录
        </button>
      </div>
    );
  }

  if (error && !isLocalMode) {
    const isAuthError = error.includes('401') || error.includes('Unauthorized') || error.includes('permission denied');

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-warning-container rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-warning animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">
            {isAuthError ? '数据库连接禁用' : '数据加载状态'}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-md">{error}</p>
        </div>

        {isAuthError ? (
          <div className="flex flex-col gap-3">
            <div className="bg-warning-container/10 p-4 rounded-lg max-w-md text-sm text-warning text-center">
              <p className="font-medium mb-2">本地数据模式</p>
              <p>当前使用本地数据，界面功能正常</p>
            </div>
            <button
              onClick={loadJournalData}
              className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              <span>重新加载</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={loadJournalData}
              className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              <span>重新加载</span>
            </button>
            <button
              onClick={() => {
                setEntries([]);
                setFilteredEntries([]);
                setStats({ total: 0, avgRating: 0, totalTags: 0 });
                setError('');
                setStatusMessage('');
                setLoading(false);
              }}
              className="px-6 py-3 bg-surface-container-low text-on-surface-variant rounded-lg font-medium"
            >
              清除错误并继续
            </button>
          </div>
        )}

        {!isAuthError && (
          <div className="bg-surface-container-lowest p-4 rounded-lg max-w-md text-xs text-on-surface-variant">
            <p className="font-medium mb-2">提示：</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>当前使用本地数据模式</li>
              <li>所有功能都正常工作</li>
              <li>数据保存在浏览器本地存储中</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 本地模式状态提示 */}
      <AnimatePresence>
        {isLocalMode && statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-primary-container/10 border border-primary-container/30 p-4 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-primary font-medium">{statusMessage}</span>
            </div>
            <button
              onClick={() => setIsLocalMode(false)}
              className="text-primary/60 hover:text-primary transition-colors"
              title="关闭提示"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {editorOpen ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <JournalEditor
              entryId={editingEntry?.id}
              initialTitle={editingEntry?.title || ''}
              initialContent={editingEntry?.content || ''}
              initialRating={editingEntry?.rating || 0}
              initialTags={editingEntry?.tags || []}
              initialMoodBefore={editingEntry?.mood_before || ''}
              initialMoodAfter={editingEntry?.mood_after || ''}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
      <header className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tight text-on-surface">疗愈日记</h2>
        <p className="text-on-surface-variant/70 text-sm">记录心灵的每一刻微光</p>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-300">
          <span className="text-secondary text-xs font-bold tracking-wider uppercase">总记录数</span>
          <div>
            <span className="text-4xl font-black text-on-surface">{stats.total}</span>
            <span className="text-on-surface-variant text-xs ml-1">次</span>
          </div>
          <div className="w-full bg-secondary-container/30 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.total * 5, 100)}%` }}
              className="bg-secondary h-full"
            />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-300">
          <span className="text-primary text-xs font-bold tracking-wider uppercase">平均情绪</span>
          <div className="flex items-center space-x-1">
            <span className="text-4xl font-black text-on-surface">{stats.avgRating.toFixed(1)}</span>
            <div className="flex ml-2">
              <Star className="text-tertiary w-4 h-4 fill-current" />
            </div>
          </div>
          <p className="text-on-surface-variant/60 text-[10px] leading-tight">共 {stats.totalTags} 个独特标签</p>
        </div>
      </section>

      <section className="relative group">
        <button
          onClick={handleNewEntry}
          className="w-full h-24 bg-gradient-to-r from-primary to-primary-container rounded-xl flex items-center justify-between px-8 text-white shadow-xl shadow-primary/20 active:scale-95 transition-transform duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <Plus className="w-6 h-6 fill-current" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg tracking-wide">开启一段记录</span>
              <span className="block text-xs text-white/70">此时此刻，你的心境如何？</span>
            </div>
          </div>
          <ArrowRight className="w-8 h-8" />
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-on-surface-variant uppercase">历史记录</h3>
          <div className="flex items-center gap-2">
            {(searchQuery || selectedTags.length > 0 || dateRange !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-error hover:text-error/80 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>清除筛选</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showFilters || searchQuery || selectedTags.length > 0 || dateRange !== 'all'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>筛选</span>
            </button>
            {entries.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <Download className="w-3 h-3" />
                  <span>导出</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 bg-surface-container-lowest rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden">
                  <button
                    onClick={handleExportAsText}
                    className="w-full px-4 py-2 text-left text-xs text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    导出为文本
                  </button>
                  <button
                    onClick={handleExportAsJSON}
                    className="w-full px-4 py-2 text-left text-xs text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    导出为JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索日记..."
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="space-y-4 p-4 bg-surface-container-lowest rounded-lg">
              {/* 日期范围 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-on-surface">日期范围</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'week', label: '最近一周' },
                    { value: 'month', label: '本月' },
                    { value: 'year', label: '今年' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value as any)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        dateRange === option.value
                          ? 'bg-primary-container text-on-primary-container font-medium'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-medium text-on-surface">标签</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-secondary-container text-on-secondary-container font-medium'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 搜索结果提示 */}
        {searchQuery || selectedTags.length > 0 || dateRange !== 'all' ? (
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>找到 {filteredEntries.length} 篇日记</span>
            <div className="flex items-center gap-2">
              {searchQuery && <span className="bg-primary-container/30 text-primary px-2 py-0.5 rounded">搜索: {searchQuery}</span>}
              {selectedTags.length > 0 && (
                <span className="bg-secondary-container/30 text-secondary px-2 py-0.5 rounded">
                  标签: {selectedTags.join(', ')}
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="bg-tertiary-container/30 text-tertiary px-2 py-0.5 rounded">
                  日期: {dateRange === 'week' ? '最近一周' : dateRange === 'month' ? '本月' : '今年'}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {entries.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Edit3 className="w-12 h-12 text-outline-variant mx-auto" />
            <p className="text-on-surface-variant">还没有日记记录，开始写下你的第一个疗愈时刻吧</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Search className="w-12 h-12 text-outline-variant mx-auto" />
            <p className="text-on-surface-variant">没有找到匹配的日记</p>
            <button
              onClick={clearFilters}
              className="text-primary hover:text-primary/80 text-sm"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className="relative space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:via-secondary/20 before:to-transparent">
            {filteredEntries.slice(0, 5).map((entry, i) => (
              <div key={entry.id} className="relative pl-10">
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center z-10 ${i === 0 ? 'border-primary' : 'border-secondary'}`}>
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-secondary'}`}></div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-lg space-y-3 hover:bg-surface-container-lowest transition-colors duration-300 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-on-surface-variant/50 block">{formatDate(entry.created_at)} · {formatTime(entry.created_at)}</span>
                      {entry.rating && (
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`w-4 h-4 ${j < entry.rating! ? 'text-tertiary fill-current' : 'text-outline-variant'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-secondary-container/30 text-secondary text-[10px] font-bold tracking-wider uppercase">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-1.5 rounded-full hover:bg-primary-container hover:text-primary transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 rounded-full hover:bg-error-container hover:text-error transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {(entry.mood_before || entry.mood_after) && (
                    <div className="flex items-center gap-2 text-xs py-2 px-3 bg-surface-container-lowest rounded-lg">
                      {entry.mood_before && (
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant/60">冥想前:</span>
                          <span className="text-on-surface">{entry.mood_before}</span>
                        </div>
                      )}
                      {(entry.mood_before && entry.mood_after) && (
                        <ArrowRight className="w-3 h-3 text-outline-variant" />
                      )}
                      {entry.mood_after && (
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant/60">冥想后:</span>
                          <span className="text-primary font-medium">{entry.mood_after}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {entry.title && (
                    <h4 className="text-sm font-semibold text-on-surface">{entry.title}</h4>
                  )}
                  <p className="text-on-surface text-sm leading-relaxed">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-12 flex flex-col items-center text-center space-y-6">
        <div className="w-12 h-[1px] bg-tertiary-container/30"></div>
        <p className="text-xl font-light italic text-primary/80 leading-relaxed px-4">
          "愈合不是终点，而是行于世间的一种方式。"
        </p>
        <div className="w-12 h-[1px] bg-tertiary-container/30"></div>
      </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}