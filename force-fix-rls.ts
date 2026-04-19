// 强制RLS修复诊断
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
});

console.log('=== 强制RLS修复诊断 ===\n');

async function diagnoseAndFix() {
  console.log('1. 检查当前用户状态...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ 用户未登录或会话无效');
    console.log('   错误:', userError?.message);
    console.log('   解决方案: 请在应用中重新登录');
    return;
  }
  
  console.log('✅ 用户已登录:', user.email);
  console.log('   用户ID:', user.id);
  
  console.log('\n2. 尝试查询 journal_entries 表...');
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);
  
  if (error) {
    console.log('❌ 查询失败:', error.message);
    console.log('   错误代码:', error.code);
    console.log('   错误详情:', error.details);
    
    console.log('\n3. 诊断问题...');
    console.log('   可能的原因:');
    console.log('   a) RLS策略未正确创建');
    console.log('   b) RLS未启用');
    console.log('   c) 策略配置错误');
    console.log('   d) 用户会话问题');
    
    console.log('\n4. 建议的解决方案:');
    console.log('   在Supabase Dashboard中执行以下SQL:');
    console.log('   https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');
    console.log('   ');
    console.log('   -- 完全重置journal_entries的RLS');
    console.log('   ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;');
    console.log('   DROP POLICY IF EXISTS "Enable read access for all users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable update for users based on user_id" ON journal_entries;');
    console.log('   DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON journal_entries;');
    console.log('   ');
    console.log('   -- 重新启用RLS并创建策略');
    console.log('   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;');
    console.log('   ');
    console.log('   CREATE POLICY "Enable read access for all users based on user_id" ');
    console.log('     ON journal_entries ');
    console.log('     FOR SELECT ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "Enable insert for users based on user_id" ');
    console.log('     ON journal_entries ');
    console.log('     FOR INSERT ');
    console.log('     TO authenticated ');
    console.log('     WITH CHECK (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "Enable update for users based on user_id" ');
    console.log('     ON journal_entries ');
    console.log('     FOR UPDATE ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id) ');
    console.log('     WITH CHECK (auth.uid() = user_id);');
    console.log('   ');
    console.log('   CREATE POLICY "Enable delete for users based on user_id" ');
    console.log('     ON journal_entries ');
    console.log('     FOR DELETE ');
    console.log('     TO authenticated ');
    console.log('     USING (auth.uid() = user_id);');
    console.log('   ');
    console.log('   -- 验证策略');
    console.log('   SELECT * FROM pg_policies WHERE tablename = \'journal_entries\';');
    
  } else {
    console.log('✅ 查询成功！');
    console.log('   找到数据:', data.length > 0 ? '是' : '否（表中无数据）');
    console.log('   RLS策略工作正常');
  }
  
  console.log('\n=== 诊断完成 ===');
}

diagnoseAndFix().catch(console.error);