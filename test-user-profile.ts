import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 用户Profile诊断 ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserProfile() {
  console.log('1. 获取当前用户...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('   ❌ 无法获取用户:', userError?.message);
    return;
  }

  console.log('   ✅ 用户信息:');
  console.log(`      ID: ${user.id}`);
  console.log(`      Email: ${user.email}`);
  console.log(`      已确认: ${user.email_confirmed_at ? '是' : '否'}`);

  console.log('\n2. 检查用户Profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log(`   ❌ Profile查询失败: ${profileError.message}`);
    console.log(`   错误代码: ${profileError.code}`);

    if (profileError.code === 'PGRST116') {
      console.log('   🔍 原因: Profile不存在');
      console.log('   解决方案: 需要创建Profile');
    } else if (profileError.code === '42501') {
      console.log('   🔍 原因: 权限被拒绝');
      console.log('   解决方案: RLS策略需要修复');
    }
  } else {
    console.log('   ✅ Profile存在:');
    console.log(`      完整姓名: ${profile.full_name || '未设置'}`);
    console.log(`      等级: ${profile.level}`);
    console.log(`      连续天数: ${profile.streak_days}`);
  }

  console.log('\n3. 测试日记查询...');
  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .limit(5);

  if (entriesError) {
    console.log(`   ❌ 日记查询失败: ${entriesError.message}`);
    console.log(`   错误代码: ${entriesError.code}`);

    if (entriesError.code === '42501') {
      console.log('\n   🔍 这是RLS权限问题');
      console.log('   解决方案: 需要在Supabase中执行修复脚本');
      console.log('   文件位置: fix-rls-issue.sql');
    }
  } else {
    console.log(`   ✅ 日记查询成功`);
    console.log(`   找到 ${entries?.length || 0} 条记录`);

    if (entries && entries.length > 0) {
      console.log('   最近的日记:');
      entries.forEach((entry, i) => {
        console.log(`      ${i + 1}. ${entry.title || '无标题'} (${new Date(entry.created_at).toLocaleDateString()})`);
      });
    }
  }

  console.log('\n4. 推荐解决方案...');

  if (profileError && profileError.code === 'PGRST116') {
    console.log('   ⚠️  用户Profile不存在');
    console.log('   解决方案: 创建Profile');
    console.log('   可以在Supabase SQL Editor中执行:');
    console.log(`   INSERT INTO profiles (id, email, full_name) VALUES ('${user.id}', '${user.email}', '用户');`);
  }

  if (entriesError && entriesError.code === '42501') {
    console.log('   ⚠️  RLS权限问题');
    console.log('   解决方案: 修复RLS策略');
    console.log('   步骤:');
    console.log('   1. 登录Supabase Dashboard');
    console.log('   2. 进入SQL Editor');
    console.log('   3. 执行 fix-rls-issue.sql 文件内容');
    console.log('   4. 刷新应用页面');
  }
}

console.log('开始诊断...\n');
testUserProfile().catch(console.error);