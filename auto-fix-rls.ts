import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 自动RLS诊断和修复指导 ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function autoDiagnose() {
  console.log('1. 检查当前用户状态...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('   ❌ 未登录用户');
    console.log('   解决方案: 请先在应用中重新登录');
    return false;
  }

  console.log('   ✅ 用户已登录');
  console.log(`   用户ID: ${user.id}`);
  console.log(`   邮箱: ${user.email}`);

  console.log('\n2. 测试数据库访问权限...');
  const { error: testError } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (testError) {
    console.log('   ❌ 权限被拒绝');
    console.log(`   错误: ${testError.message}`);
    console.log(`   错误代码: ${testError.code}`);
  } else {
    console.log('   ✅ 权限正常');
    return true;
  }

  console.log('\n3. 生成修复SQL脚本...');
  console.log('   请复制以下SQL脚本到Supabase Dashboard执行:\n');

  const fixSQL = `-- 修复RLS权限问题
-- 执行位置: Supabase Dashboard -> SQL Editor

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- 创建新策略
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

-- 启用RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 验证修复
SELECT 'RLS修复完成！' as status, '请刷新应用页面' as message;`;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(fixSQL);
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n4. 详细执行步骤:');
  console.log('   步骤1: 访问 https://supabase.com/dashboard');
  console.log('   步骤2: 登录并选择您的项目');
  console.log('   步骤3: 点击左侧菜单 "SQL Editor"');
  console.log('   步骤4: 点击 "New query" 创建新查询');
  console.log('   步骤5: 复制上面的SQL脚本，粘贴到编辑器中');
  console.log('   步骤6: 点击 "Run" 按钮执行');
  console.log('   步骤7: 刷新应用页面测试');

  console.log('\n5. SQL脚本已保存到文件: fix-rls-final.sql');
  console.log('   您也可以直接从文件复制SQL脚本');

  return false;
}

async function main() {
  const isFixed = await autoDiagnose();

  if (isFixed) {
    console.log('\n✅ 权限已正常，无需修复');
  } else {
    console.log('\n⚠️  需要执行SQL修复脚本');
    console.log('   请按照上面的步骤在Supabase Dashboard中执行');
  }

  console.log('\n=== 诊断完成 ===');
}

main().catch(console.error);