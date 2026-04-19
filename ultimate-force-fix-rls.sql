-- =====================================================
-- 强制修复 journal_entries 表的 RLS 权限问题
-- =====================================================
-- 执行步骤：
-- 1. 访问 https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new
-- 2. 复制此脚本的全部内容
-- 3. 粘贴到SQL Editor中
-- 4. 点击 "Run" 按钮
-- 5. 执行完成后刷新应用页面
-- =====================================================

-- 第1步: 禁用RLS以移除所有现有策略
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;

-- 第2步: 删除所有可能存在的策略（清理工作）
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Enable read access for all users based on user_id" ON journal_entries;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON journal_entries;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON journal_entries;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON journal_entries;

-- 第3步: 重新启用RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 第4步: 创建新的、经过验证的RLS策略
-- 这些策略确保认证用户只能访问自己的数据

-- SELECT策略：允许用户查看自己的日记
CREATE POLICY "journal_entries_select_policy" 
  ON journal_entries 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- INSERT策略：允许用户创建自己的日记
CREATE POLICY "journal_entries_insert_policy" 
  ON journal_entries 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE策略：允许用户更新自己的日记
CREATE POLICY "journal_entries_update_policy" 
  ON journal_entries 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- DELETE策略：允许用户删除自己的日记
CREATE POLICY "journal_entries_delete_policy" 
  ON journal_entries 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 第5步: 验证策略创建成功
SELECT 
  'RLS策略创建验证' as description,
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

-- 第6步: 验证RLS已启用
SELECT 
  'RLS启用状态' as description,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'journal_entries';

-- 第7步: 显示完成信息
SELECT 
  'RLS修复完成！' as status,
  '请刷新应用页面测试日记功能' as next_step,
  '如果仍有问题，请检查控制台错误信息' as troubleshooting;