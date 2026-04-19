// 彻底诊断RLS状态
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
});

console.log('=== 彻底RLS状态诊断 ===\n');

async function comprehensiveDiagnosis() {
  console.log('1. 检查用户会话...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ 用户未登录');
    console.log('   请先在应用中重新登录');
    return;
  }
  
  console.log('✅ 用户已登录:', user.email);
  console.log('   用户ID:', user.id);
  
  console.log('\n2. 检查用户Profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.log('❌ Profile查询失败:', profileError.message);
  } else if (profile) {
    console.log('✅ Profile存在:', profile.email || profile.full_name || '用户');
  } else {
    console.log('⚠ Profile不存在，需要创建');
  }
  
  console.log('\n3. 测试journal_entries表访问...');
  const { data: journalData, error: journalError } = await supabase
    .from('journal_entries')
    .select('id, user_id')
    .eq('user_id', user.id)
    .limit(1);
  
  if (journalError) {
    console.log('❌ journal_entries访问失败:', journalError.message);
    console.log('   错误代码:', journalError.code);
    console.log('   错误详情:', journalError.details);
    
    console.log('\n4. 根本原因分析...');
    console.log('   问题: RLS策略可能没有正确创建或配置');
    console.log('   证据:');
    console.log('   a) 用户已登录且Profile存在');
    console.log('   b) 仍然无法访问journal_entries表');
    console.log('   c) 这是典型的RLS策略配置问题');
    
    console.log('\n5. 解决方案: 在Supabase SQL Editor中执行强制修复');
    console.log('   打开: https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');
    console.log('');
    console.log('   复制并执行以下完整SQL脚本:');
    console.log('   ');
    console.log('   -- ========== 强制修复 RLS 脚本 ==========');
    console.log('   -- 第1步: 禁用RLS以移除所有策略');
    console.log('   ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;');
    console.log('   ');
    console.log('   -- 第2步: 删除所有可能存在的策略');
    console.log('   DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable read access for all users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable update for users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON journal_entries;');
    console.log('   ');
    console.log('   -- 第3步: 重新启用RLS');
    console.log('   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;');
    console.log('   ');
    console.log('   -- 第4步: 创建新的简化策略');
    console.log('   CREATE POLICY "journal_entries_select_policy" ');
    console.log('     ON journal_entries ');
    console.log('     FOR SELECT ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "journal_entries_insert_policy" ');
    console.log('     ON journal_entries ');
    console.log('     FOR INSERT ');
    console.log('     TO authenticated ');
    console.log('     WITH CHECK (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "journal_entries_update_policy" ');
    console.log('     ON journal_entries ');
    console.log('     FOR UPDATE ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id) ');
    console.log('     WITH CHECK (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "journal_entries_delete_policy" ');
    console.log('     ON journal_entries ');
    console.log('     FOR DELETE ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id);');
    console.log('   ');
    console.log('   -- 第5步: 验证策略创建');
    console.log('   SELECT ');
    console.log('     schemaname, ');
    console.log('     tablename, ');
    console.log('     policyname, ');
    console.log('     permissive, ');
    console.log('     roles, ');
    console.log('     cmd, ');
    console.log('     qual, ');
    console.log('     with_check ');
    console.log('   FROM pg_policies ');
    console.log('   WHERE tablename = \'journal_entries\';');
    console.log('   ');
    console.log('   -- 第6步: 检查RLS状态');
    console.log('   SELECT ');
    console.log('     tablename, ');
    console.log('     rowsecurity ');
    console.log('   FROM pg_tables ');
    console.log('   WHERE tablename = \'journal_entries\';');
    console.log('   ');
    console.log('   -- ========== 脚本结束 ==========');
    console.log('   ');
    console.log('   执行此脚本后，刷新应用页面即可');
    
  } else {
    console.log('✅ journal_entries访问成功！');
    console.log('   找到数据:', journalData.length > 0 ? '是' : '否（表中无数据）');
    console.log('   ');
    console.log('   如果您仍然看到错误，可能是：');
    console.log('   a) 浏览器缓存问题 - 尝试强制刷新（Ctrl+F5）');
    console.log('   b) 前端代码缓存 - 清除浏览器缓存');
    console.log('   c) 开发服务器问题 - 重启开发服务器');
  }
  
  console.log('\n=== 诊断完成 ===');
}

comprehensiveDiagnosis().catch(console.error);