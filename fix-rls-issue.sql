-- 诊断和修复 RLS 权限问题
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 检查当前用户ID
SELECT '当前用户ID:' as info, auth.uid() as user_id;

-- 2. 检查用户的profile是否存在
SELECT '检查用户profile:' as info,
       id,
       email,
       full_name,
       created_at
FROM profiles
WHERE id = auth.uid();

-- 3. 检查用户的日记条目
SELECT '检查用户日记条目:' as info,
       id,
       user_id,
       title,
       created_at
FROM journal_entries
WHERE user_id = auth.uid()
LIMIT 5;

-- 4. 检查现有的RLS策略
SELECT '现有RLS策略:' as info,
       schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE tablename = 'journal_entries';

-- 5. 检查RLS是否启用
SELECT 'RLS状态:' as info,
       relname AS table_name,
       relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'journal_entries';

-- 6. 修复方案：重新创建正确的RLS策略
-- 首先删除所有现有策略
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- 创建新的简化策略
CREATE POLICY "Allow authenticated users to view own entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert own entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update own entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete own entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. 确保RLS已启用
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 8. 测试查询（应该能正常工作）
SELECT '测试查询结果:' as info,
       COUNT(*) as entry_count
FROM journal_entries
WHERE user_id = auth.uid();

-- 9. 显示完成信息
SELECT 'RLS修复完成！' as status,
       '现在应该可以正常访问日记数据了' as message;