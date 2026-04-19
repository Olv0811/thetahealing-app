# Celestial Sanctuary 数据库设计

## 概述

本文档描述了 Celestial Sanctuary 应用的 Supabase 数据库结构。

## 数据库表结构

### 1. 用户表 (profiles)

扩展 Supabase 默认的 `auth.users` 表，存储用户额外信息。

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,  -- 灵性等级
  streak_days INTEGER DEFAULT 0,  -- 连续打卡天数
  total_meditation_minutes INTEGER DEFAULT 0,  -- 总冥想分钟数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS（行级安全）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. 日记表 (journal_entries)

存储用户的疗愈日记。

```sql
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 1-5 星评分
  tags TEXT[] DEFAULT '{}',  -- 标签数组
  mood_before TEXT,  -- 冥想前心情
  mood_after TEXT,   -- 冥想后心情
  session_id TEXT,   -- 关联的疗愈会话 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的日记
CREATE POLICY "Users can view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);
```

### 3. 用户设置表 (user_settings)

存储用户的个人设置。

```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  theme TEXT DEFAULT 'light',  -- light, dark, auto
  language TEXT DEFAULT 'zh-CN',
  audio_speed DECIMAL(3, 1) DEFAULT 1.0,  -- 音频播放速度
  default_ambient_sound TEXT DEFAULT 'forest',  -- 默认背景音
  notification_enabled BOOLEAN DEFAULT true,
  meditation_reminder_time TIME,  -- 冥想提醒时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

### 4. 冥想进度表 (meditation_sessions)

记录用户的冥想会话历史。

```sql
CREATE TABLE meditation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  session_type TEXT NOT NULL,  -- meditation, chakra, purification, dna
  duration INTEGER NOT NULL,  -- 实际时长（分钟）
  ambient_sound TEXT,  -- 背景音类型
  completed BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 用户评分
  notes TEXT,  -- 用户笔记
  ai_chat_history JSONB,  -- AI 对话历史
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 启用 RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON meditation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON meditation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON meditation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_created_at ON meditation_sessions(created_at DESC);
CREATE INDEX idx_meditation_sessions_session_type ON meditation_sessions(session_type);
```

### 5. 书签表 (bookmarks)

存储用户在知识库中的书签。

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  book_id TEXT NOT NULL,  -- 知识库书籍 ID
  page_number INTEGER,
  title TEXT,
  note TEXT,  -- 书签备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_book_id ON bookmarks(book_id);
```

### 6. 笔记表 (notes)

存储用户在阅读知识库时的笔记。

```sql
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  book_id TEXT NOT NULL,  -- 知识库书籍 ID
  page_number INTEGER,
  text_content TEXT NOT NULL,  -- 笔记内容
  highlight_text TEXT,  -- 高亮的文本
  highlight_start_position INTEGER,  -- 高亮起始位置
  highlight_end_position INTEGER,    -- 高亮结束位置
  color TEXT DEFAULT '#ffff00',  -- 高亮颜色
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_book_id ON notes(book_id);
```

## 触发器

### 自动更新 updated_at 字段

```sql
-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 自动创建 profile

```sql
-- 用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 视图

### 用户统计视图

```sql
CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.level,
  p.streak_days,
  p.total_meditation_minutes,
  COUNT(DISTINCT je.id) AS journal_count,
  AVG(je.rating) AS avg_journal_rating,
  COUNT(DISTINCT ms.id) AS meditation_count,
  SUM(ms.duration) AS total_meditation_duration,
  COUNT(DISTINCT b.id) AS bookmark_count,
  COUNT(DISTINCT n.id) AS note_count
FROM profiles p
LEFT JOIN journal_entries je ON p.id = je.user_id
LEFT JOIN meditation_sessions ms ON p.id = ms.user_id AND ms.completed = true
LEFT JOIN bookmarks b ON p.id = b.user_id
LEFT JOIN notes n ON p.id = n.user_id
GROUP BY p.id;
```

## 实时订阅

Supabase 支持实时订阅，可以订阅以下表的变更：

- `profiles` - 用户信息变更
- `journal_entries` - 日记变更
- `meditation_sessions` - 冥想会话变更
- `bookmarks` - 书签变更
- `notes` - 笔记变更

启用实时功能：

```sql
-- 为需要实时功能的表启用实时
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE meditation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

## 数据迁移

### 版本 1.0 初始化

```sql
-- 运行上述所有 SQL 语句
```

### 版本 1.1 添加通知功能（未来）

```sql
ALTER TABLE user_settings ADD COLUMN daily_reminder_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN reminder_time TIME DEFAULT '09:00:00';
```

## 性能优化

### 分区策略

对于大型表（如 journal_entries, meditation_sessions），考虑按时间分区：

```sql
-- 按月分区 journal_entries
CREATE TABLE journal_entries_2024_01 PARTITION OF journal_entries
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 缓存策略

- 使用 Supabase Edge Functions 实现缓存层
- 对频繁查询的数据使用 PostgreSQL 缓存
- 考虑使用 Redis 进行会话缓存

## 备份策略

- Supabase 自动备份（每天）
- 关键数据导出为 JSON
- 定期测试备份恢复

## 安全建议

1. **RLS 策略**：确保所有表都启用了行级安全
2. **API 密钥**：使用服务端密钥进行管理操作
3. **输入验证**：在应用层验证所有输入
4. **SQL 注入**：使用参数化查询（Supabase 自动处理）
5. **速率限制**：在 Edge Functions 中实现速率限制

## 监控

监控以下指标：
- 数据库连接数
- 查询性能
- 存储使用量
- API 请求频率
- 错误率

使用 Supabase Dashboard 查看实时监控数据。

---

**最后更新**: 2026年4月8日
**文档版本**: 1.0