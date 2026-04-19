# Celestial Sanctuary 后端设置指南

本文档将指导你如何设置和使用 Celestial Sanctuary 的 Supabase 后端。

## 📋 目录

1. [先决条件](#先决条件)
2. [创建 Supabase 项目](#创建-supabase-项目)
3. [配置环境变量](#配置环境变量)
4. [初始化数据库](#初始化数据库)
5. [安装依赖](#安装依赖)
6. [后端服务使用](#后端服务使用)
7. [实时功能](#实时功能)
8. [常见问题](#常见问题)

---

## 先决条件

- Node.js (v16 或更高版本)
- npm 或 yarn
- Supabase 账户（免费即可）

---

## 创建 Supabase 项目

### 1. 注册并创建项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - **Name**: celestial-sanctuary
   - **Database Password**: 设置一个强密码（请妥善保管）
   - **Region**: 选择距离你最近的区域
5. 点击 "Create new project"，等待项目创建完成（通常需要 1-2 分钟）

### 2. 获取 API 密钥

项目创建完成后：

1. 进入项目 Dashboard
2. 点击左侧菜单的 "Settings" → "API"
3. 复制以下信息：
   - **Project URL**: 例如 `https://xxxxxxxx.supabase.co`
   - **anon public key**: 公共密钥（用于客户端）
   - **service_role key**: 仅在服务端使用（不要泄露）

---

## 配置环境变量

### 1. 创建 .env 文件

在 `celestial-sanctuary/` 目录下创建 `.env` 文件：

```bash
cd celestial-sanctuary
touch .env
```

### 2. 添加环境变量

在 `.env` 文件中添加以下内容：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# 应用配置
VITE_APP_URL=http://localhost:3000
```

**重要**: 
- 将 `your-project-id` 替换为你的实际项目 ID
- 将 `your-anon-key-here` 替换为你的 anon key
- 不要提交 `.env` 文件到 Git

---

## 初始化数据库

### 1. 使用 SQL Editor

1. 在 Supabase Dashboard 中，点击左侧菜单的 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase/migrations/001_initial_schema.sql` 文件的内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行 SQL

### 2. 验证数据库创建

执行完成后，检查以下表是否已创建：

- `profiles` - 用户资料
- `journal_entries` - 日记条目
- `user_settings` - 用户设置
- `meditation_sessions` - 冥想会话
- `bookmarks` - 书签
- `notes` - 笔记

你可以在 "Table Editor" 中查看这些表。

---

## 安装依赖

### 1. 安装 Supabase 客户端

```bash
cd celestial-sanctuary
npm install @supabase/supabase-js
```

### 2. 安装其他依赖

```bash
npm install date-fns zod
```

### 3. 验证安装

```bash
npm run dev
```

如果应用正常启动，说明依赖安装成功。

---

## 后端服务使用

### 项目结构

```
src/
├── lib/
│   └── supabase.ts          # Supabase 客户端配置
├── services/
│   ├── auth.service.ts      # 认证服务
│   ├── journal.service.ts   # 日记服务
│   ├── meditation.service.ts # 冥想会话服务
│   ├── settings.service.ts  # 用户设置服务
│   ├── bookmark.service.ts  # 书签服务
│   └── note.service.ts      # 笔记服务
└── types/
    └── database.ts          # 数据库类型定义
```

### 认证服务 (auth.service.ts)

```typescript
import { login, register, logout, getCurrentUserProfile } from '@/services/auth.service';

// 登录
const { user, profile, error } = await login({
  email: 'user@example.com',
  password: 'password123'
});

// 注册
const { user, profile, error } = await register({
  email: 'user@example.com',
  password: 'password123',
  fullName: '张三'
});

// 登出
const { error } = await logout();

// 获取当前用户
const { user, profile, error } = await getCurrentUserProfile();
```

### 日记服务 (journal.service.ts)

```typescript
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  searchJournalEntries
} from '@/services/journal.service';

// 获取所有日记
const { entries, error } = await getJournalEntries(userId);

// 创建日记
const { entry, error } = await createJournalEntry({
  user_id: userId,
  title: '今天的冥想',
  content: '感觉非常平静...',
  rating: 5,
  tags: ['冥想', '平静'],
  mood_before: '焦虑',
  mood_after: '平静'
});

// 搜索日记
const { entries, error } = await searchJournalEntries(userId, '冥想');
```

### 冥想会话服务 (meditation.service.ts)

```typescript
import {
  createMeditationSession,
  completeMeditationSession,
  getMeditationStats
} from '@/services/meditation.service';

// 创建冥想会话
const { session, error } = await createMeditationSession({
  user_id: userId,
  session_type: 'meditation',
  duration: 15,
  ambient_sound: 'forest'
});

// 完成冥想会话
const { session, error } = await completeMeditationSession({
  id: sessionId,
  rating: 5,
  notes: '非常有帮助的引导'
});

// 获取统计
const { totalSessions, completedSessions, totalMinutes, avgRating } =
  await getMeditationStats(userId);
```

### 用户设置服务 (settings.service.ts)

```typescript
import {
  getUserSettings,
  updateUserSettings,
  updateTheme,
  updateAudioSpeed
} from '@/services/settings.service';

// 获取设置
const { settings, error } = await getUserSettings(userId);

// 更新设置
const { settings, error } = await updateUserSettings(userId, {
  theme: 'dark',
  language: 'zh-CN',
  audio_speed: 1.5
});

// 更新主题
const { settings, error } = await updateTheme(userId, 'dark');
```

### 书签服务 (bookmark.service.ts)

```typescript
import {
  getBookmarks,
  createBookmark,
  deleteBookmark
} from '@/services/bookmark.service';

// 获取所有书签
const { bookmarks, error } = await getBookmarks(userId);

// 创建书签
const { bookmark, error } = await createBookmark({
  user_id: userId,
  book_id: '1',
  page_number: 42,
  title: '重要章节',
  note: '这段话很有启发'
});

// 按书籍获取书签
const { bookmarks, error } = await getBookmarksByBook(userId, '1');
```

### 笔记服务 (note.service.ts)

```typescript
import {
  getNotes,
  createNote,
  updateNote,
  searchNotes
} from '@/services/note.service';

// 获取所有笔记
const { notes, error } = await getNotes(userId);

// 创建笔记
const { note, error } = await createNote({
  user_id: userId,
  book_id: '1',
  page_number: 42,
  text_content: '这段话解释了什么是冥想...',
  highlight_text: '冥想是一种...的实践',
  color: '#ffff00'
});

// 搜索笔记
const { notes, error } = await searchNotes(userId, '冥想');
```

---

## 实时功能

Supabase 支持实时订阅功能，可以实时接收数据库变更通知。

### 订阅表变更

```typescript
import { supabase } from '@/lib/supabase';

// 订阅日记变更
const subscription = supabase
  .channel('journal_entries_channel')
  .on(
    'postgres_changes',
    {
      event: '*',  // '*', 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'journal_entries'
    },
    (payload) => {
      console.log('变更:', payload);
      // 处理变更
    }
  )
  .subscribe();

// 取消订阅
subscription.unsubscribe();
```

### 订阅特定用户的日记

```typescript
const subscription = supabase
  .channel('user_journal_entries')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'journal_entries',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('用户的日记变更:', payload);
    }
  )
  .subscribe();
```

---

## 常见问题

### 1. 连接失败

**问题**: 应用启动时提示 "Supabase URL and Anon Key are required"

**解决**: 
- 检查 `.env` 文件是否存在
- 确认环境变量名称正确（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）
- 重启开发服务器

### 2. 数据库权限错误

**问题**: 提示 "permission denied for table xxx"

**解决**: 
- 检查 RLS（行级安全）策略是否正确配置
- 确认用户已登录
- 检查用户 ID 是否正确

### 3. 认证失败

**问题**: 登录或注册失败

**解决**: 
- 检查邮箱和密码是否正确
- 确认邮箱是否需要验证（如果启用了）
- 检查网络连接

### 4. 实时订阅不工作

**问题**: 无法接收到实时更新

**解决**: 
- 确认已为表启用实时功能
- 检查 RLS 策略是否允许实时访问
- 确认订阅条件正确

---

## 安全建议

1. **环境变量**: 永远不要将 `.env` 文件提交到版本控制
2. **API 密钥**: 不要在前端代码中使用 `service_role` 密钥
3. **RLS 策略**: 确保所有表都启用了行级安全
4. **输入验证**: 在应用层验证所有用户输入
5. **错误处理**: 妥善处理所有可能的错误

---

## 监控和调试

### 查看数据库查询

在 Supabase Dashboard 中：
1. 点击 "Database" → "Logs"
2. 查看查询日志和性能指标

### 查看认证日志

在 Supabase Dashboard 中：
1. 点击 "Authentication" → "Logs"
2. 查看登录、注册等操作日志

---

## 下一步

现在后端已经设置完成，你可以：

1. 更新前端组件连接后端 API
2. 实现实时功能
3. 测试所有功能
4. 部署到生产环境

参考 `DEVELOPMENT_PLAN.md` 了解更多开发细节。

---

**最后更新**: 2026年4月8日
**文档版本**: 1.0