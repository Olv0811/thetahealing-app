-- 修复RLS权限问题的最终脚本
-- 请在Supabase Dashboard的SQL Editor中执行此脚本

-- 删除所有现有的journal_entries表策略
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- 创建新的简化策略
CREATE POLICY "Enable read access for all users based on user_id" 
  ON journal_entries 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" 
  ON journal_entries 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
  ON journal_entries 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
  ON journal_entries 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 确保RLS已启用
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 显示完成信息
SELECT 'RLS修复完成！' as status, '请刷新应用页面' as message;