# 疗愈日记权限修复指南

## 问题分析

当前遇到的问题是：`permission denied for table journal_entries`

这是 Supabase 的行级安全策略（RLS）阻止了对 `journal_entries` 表的访问。

## 解决方案

### 方案一：在 Supabase 仪表板手动修复（推荐）

1. **访问 Supabase SQL Editor**
   - 打开 https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new
   - 或者在仪表板中：左侧菜单 → SQL Editor → New Query

2. **执行以下 SQL**

```sql
-- 修复 journal_entries 表的 RLS 策略
-- 删除现有策略
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- 创建新的 RLS 策略
CREATE POLICY "Users can view own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 确保 RLS 已启用
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
```

3. **验证修复**
   - 执行后应该看到 "Success. No rows returned"
   - 刷新应用页面，重试访问日记功能

### 方案二：检查现有 RLS 策略

1. **查看现有策略**
```sql
SELECT * FROM pg_policies WHERE tablename = 'journal_entries';
```

2. **查看表结构**
```sql
\d+ journal_entries
```

3. **检查 RLS 是否启用**
```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'journal_entries';
```

### 方案三：临时禁用 RLS（仅用于测试）

**⚠️ 警告：这将禁用所有安全策略，仅用于诊断问题**

```sql
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
```

## 验证步骤

修复后，在应用中测试：

1. **检查认证状态**
   - 确保用户已登录
   - 检查控制台中的用户 ID

2. **测试数据加载**
   - 打开浏览器控制台（F12）
   - 点击"日记"按钮
   - 查看网络请求是否成功（不再出现 401 错误）

3. **查看详细日志**
   - 应该看到类似这样的日志：
     ```
     开始单独加载日记条目...
     getJournalEntries开始执行，userId: '...'
     getJournalEntries Supabase查询完成: {data: [...], error: null}
     成功加载日记条目: X
     ```

## 常见问题

### Q: 为什么会出现权限问题？

A: 可能的原因：
- 数据库迁移没有正确执行
- RLS 策略配置不正确
- 用户认证状态异常
- API 密钥权限不足

### Q: 如何查看完整的错误信息？

A:
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 过滤失败的请求（显示为红色）
4. 点击请求查看详细信息
5. 查看 Response 标签中的错误消息

### Q: 如果修复后还是无法访问？

A:
1. 确认用户已正确登录
2. 检查控制台中的 `user.id` 是否正确
3. 在 Supabase 仪表板中检查 `journal_entries` 表是否有数据
4. 尝试在 SQL Editor 中直接查询：
   ```sql
   SELECT * FROM journal_entries WHERE user_id = 'your-user-id';
   ```

## 相关文件

- 迁移文件：`supabase/migrations/004_fix_journal_rls.sql`
- 数据库架构：`DATABASE_SCHEMA.md`
- 后端设置指南：`BACKEND_SETUP.md`

## 技术支持

如果问题持续存在，请提供：
1. 浏览器控制台的完整错误日志
2. Network 标签中失败请求的详细信息
3. Supabase 仪表板中 RLS 策略的截图
4. 用户认证状态信息