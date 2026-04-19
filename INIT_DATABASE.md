# 数据库初始化指南

## 📋 前提条件

- ✅ Supabase 项目已创建
- ✅ 环境变量已配置 (.env 文件)
- ⏳ 需要初始化数据库表结构

## 🚀 初始化步骤

### 1. 访问 Supabase Dashboard

打开浏览器，访问：
```
https://cbwxsmtfgxwotwudpkfe.supabase.co
```

### 2. 打开 SQL Editorif

在左侧菜单中，点击 **SQL Editor**（图标看起来像一个终端）。

### 3. 创建新查询

点击 **"New query"** 按钮。

### 4. 执行初始化脚本

复制以下 SQL 脚本并粘贴到 SQL Editor 中：

```sql
-- Celestial Sanctuary 初始数据库架构
-- 运行顺序：在 Supabase SQL Editor 中按顺序执行

-- ============================================
-- 1. 用户表 (profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  total_meditation_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. 日记表 (journal_entries)
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  mood_before TEXT,
  mood_after TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- ============================================
-- 3. 用户设置表 (user_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'zh-CN',
  audio_speed DECIMAL(3, 1) DEFAULT 1.0,
  default_ambient_sound TEXT DEFAULT 'forest',
  notification_enabled BOOLEAN DEFAULT true,
  meditation_reminder_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 4. 冥想进度表 (meditation_sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  session_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  ambient_sound TEXT,
  completed BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  ai_chat_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 启用 RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON meditation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own sessions" ON meditation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own sessions" ON meditation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_created_at ON meditation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_session_type ON meditation_sessions(session_type);

-- ============================================
-- 5. 书签表 (bookmarks)
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  book_id TEXT NOT NULL,
  page_number INTEGER,
  title TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own bookmarks" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id);

-- ============================================
-- 6. 笔记表 (notes)
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  book_id TEXT NOT NULL,
  page_number INTEGER,
  text_content TEXT NOT NULL,
  highlight_text TEXT,
  highlight_start_position INTEGER,
  highlight_end_position INTEGER,
  color TEXT DEFAULT '#ffff00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY IF NOT EXISTS "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);

-- ============================================
-- 7. 触发器函数
-- ============================================

-- 更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. 触发器
-- ============================================

-- 为 profiles 表创建触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 journal_entries 表创建触发器
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 user_settings 表创建触发器
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 notes 表创建触发器
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动创建 profile
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

-- 为 auth.users 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. 视图
-- ============================================

-- 用户统计视图
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

-- ============================================
-- 10. 实时订阅
-- ============================================

-- 为需要实时功能的表启用实时
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE meditation_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- ============================================
-- 完成
-- ============================================

-- 输出完成信息
SELECT 'Database schema initialized successfully!' AS status;
```

### 5. 运行脚本

点击右上角的 **"Run"** 按钮（或按 `Ctrl + Enter`）执行 SQL 脚本。

### 6. 验证数据库创建

执行完成后，检查以下表是否已创建：

1. 点击左侧菜单的 **Table Editor**
2. 你应该能看到以下表：
   - ✅ `profiles` - 用户资料
   - ✅ `journal_entries` - 日记条目
   - ✅ `user_settings` - 用户设置
   - ✅ `meditation_sessions` - 冥想会话
   - ✅ `bookmarks` - 书签
   - ✅ `notes` - 笔记

## 🎉 初始化完成

数据库初始化完成后，你可以：

### 启动应用

```bash
cd celestial-sanctuary
npm install
npm run dev
```

### 测试功能

1. 访问 `http://localhost:3000`
2. 点击"立即注册"创建账户
3. 登录后开始使用应用

## ⚠️ 重要提示

### Gemini API Key

如果你想使用 AI 冥想引导功能，需要添加 Gemini API Key：

1. 访问 [Google AI Studio](https://ai.studio/)
2. 创建账户并获取 API Key
3. 更新 `.env` 文件：
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

### 安全注意事项

- ✅ `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
- ✅ 使用的是 anon public key，可以安全地在客户端使用
- ✅ RLS 策略确保用户只能访问自己的数据

## 📚 相关文档

- `BACKEND_SETUP.md` - 详细的后端设置指南
- `DATABASE_SCHEMA.md` - 完整的数据库设计文档
- `DEVELOPMENT_PLAN.md` - 开发计划

## 🆘 遇到问题？

如果遇到任何问题，请检查：

1. **环境变量** - 确认 `.env` 文件配置正确
2. **数据库连接** - 确认 Supabase 项目可访问
3. **SQL 执行** - 确认所有 SQL 语句成功执行
4. **浏览器控制台** - 检查是否有错误信息

---

**初始化时间**: 约 2-3 分钟
**难度**: ⭐⭐☆☆☆
**状态**: ⏳ 等待执行

祝你使用愉快！🎊