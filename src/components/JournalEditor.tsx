import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, X, Save, Loader2, Plus, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createJournalEntry, updateJournalEntry } from '../services/journal.service';

interface JournalEditorProps {
  entryId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialRating?: number;
  initialTags?: string[];
  initialMoodBefore?: string;
  initialMoodAfter?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const COMMON_TAGS = ['平静', '焦虑', '喜悦', '疲惫', '感激', '困惑', '充满能量', '悲伤', '放松', '压力'];

const MOOD_OPTIONS = ['😊 很好', '🙂 还可以', '😐 一般', '😙 不太好', '😞 很差'];

export default function JournalEditor({
  entryId,
  initialTitle = '',
  initialContent = '',
  initialRating = 0,
  initialTags = [],
  initialMoodBefore = '',
  initialMoodAfter = '',
  onSave,
  onCancel,
}: JournalEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [moodBefore, setMoodBefore] = useState(initialMoodBefore);
  const [moodAfter, setMoodAfter] = useState(initialMoodAfter);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState('');

  // 自动保存
  useEffect(() => {
    if (content || title) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        handleSave(true);
      }, 2000); // 2秒后自动保存
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [title, content, rating, tags, moodBefore, moodAfter]);

  const handleSave = async (isAutoSave = false) => {

      if (!user) return;

      if (!content.trim()) {

        if (!isAutoSave) setError('请输入日记内容');

        return;

      }

  

      try {

        setSaving(true);

        setError('');

  

        const data = {

          user_id: user.id,

          title: title.trim() || null,

          content: content.trim(),

          rating: rating || null,

          tags: tags.length > 0 ? tags : null,

          mood_before: moodBefore || null,

          mood_after: moodAfter || null,

        };

  

        if (entryId) {

          // 更新现有日记

          const { error: updateError } = await updateJournalEntry({

            id: entryId,

            ...data,

          });

          if (updateError) throw updateError;

        } else {

          // 创建新日记

          const { error: createError } = await createJournalEntry(data);

          if (createError) throw createError;

        }

  

        if (!isAutoSave && onSave) {

          onSave();

        }

      } catch (err: any) {

        console.error('Save error:', err);

        

        // 回退到本地缓存保存

        try {

          const { saveJournalEntriesToCache, getJournalEntriesFromCache, getStatsFromCache, saveStatsToCache } = await import('../services/local-journal-cache');

          

          let currentEntries = getJournalEntriesFromCache();

          let updatedEntry;

  

          if (entryId) {

            // 更新本地缓存中的现有日记

            currentEntries = currentEntries.map(entry => 

              entry.id === entryId

                ? {

                    ...entry,

                    title: data.title || '',

                    content: data.content || '',

                    rating: data.rating || 0,

                    tags: data.tags || [],

                    mood_before: data.mood_before || '',

                    mood_after: data.mood_after || '',

                    session_id: entry.session_id || null,

                    updated_at: new Date().toISOString()

                  }

                : entry

            );

            updatedEntry = currentEntries.find(e => e.id === entryId);

          } else {

            // 在本地缓存中创建新日记

            updatedEntry = {

              id: `local-${Date.now()}`,

              user_id: user.id,

              title: data.title,

              content: data.content,

              rating: data.rating,

              tags: data.tags || [],

              mood_before: data.mood_before,

              mood_after: data.mood_after,

              session_id: null,

              created_at: new Date().toISOString(),

              updated_at: new Date().toISOString()

            };

            currentEntries.unshift(updatedEntry);

          }

  

          // 更新统计数据

          const updatedStats = {

            total: currentEntries.length,

            avgRating: currentEntries.length > 0 

              ? currentEntries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / currentEntries.length 

              : 0,

            totalTags: Array.from(new Set(currentEntries.flatMap(entry => entry.tags || []))).length

          };

  

          // 保存到缓存

          saveJournalEntriesToCache(currentEntries);

          saveStatsToCache(updatedStats);

  

          console.log('数据已保存到本地缓存');

          

          if (!isAutoSave) {

            // 显示本地保存成功消息

            setError('已保存到本地缓存');

            setTimeout(() => setError(''), 2000);

            

            if (onSave) {

              onSave();

            }

          }

        } catch (localError: any) {

          console.error('本地缓存保存失败:', localError);

          if (!isAutoSave) {

            setError('数据库和本地缓存均保存失败');

          }

        }

  

      } finally {

        setSaving(false);

      }

    };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">
          {entryId ? '编辑日记' : '新建日记'}
        </h2>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>保存中...</span>
            </div>
          )}
          <button
            onClick={() => onCancel?.()}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/10 text-error px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Mood Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-on-surface">冥想前心情</label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood}
              onClick={() => setMoodBefore(mood)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                moodBefore === mood
                  ? 'bg-primary-container text-on-primary-container font-medium'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-on-surface">冥想后心情</label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood}
              onClick={() => setMoodAfter(mood)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                moodAfter === mood
                  ? 'bg-primary-container text-on-primary-container font-medium'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（可选）"
          className="w-full px-4 py-3 bg-surface-container-lowest rounded-lg text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-on-surface">今日心情评分</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating ? 'text-tertiary fill-current' : 'text-outline-variant'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-on-surface">标签</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                tags.includes(tag)
                  ? 'bg-secondary-container text-on-secondary-container font-medium'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Custom Tag Input */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag(customTag);
              }
            }}
            placeholder="自定义标签"
            className="flex-1 px-3 py-2 bg-surface-container-lowest rounded-lg text-sm text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => handleAddTag(customTag)}
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-medium hover:bg-primary-container/80 transition-colors"
          >
            添加
          </button>
        </div>

        {/* Selected Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-secondary-container-high rounded-full p-0.5 transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记录你的疗愈时刻..."
          rows={10}
          className="w-full px-4 py-3 bg-surface-container-lowest rounded-lg text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onCancel?.()}
          className="flex-1 py-3 bg-surface-container-low text-on-surface-variant rounded-lg font-medium hover:bg-surface-container-high transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={loading || !content.trim()}
          className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>保存</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}