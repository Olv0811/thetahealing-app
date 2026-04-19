import { createClient } from '@supabase/supabase-js';

// 从测试文件中获取的配置
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== Supabase 认证详细诊断 ===\n');

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthState() {
  console.log('1. 检查认证状态...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log(`   ❌ 获取会话失败: ${error.message}`);
      return null;
    }

    if (session) {
      console.log(`   ✅ 已认证用户:`);
      console.log(`      Email: ${session.user.email}`);
      console.log(`      ID: ${session.user.id}`);
      console.log(`      Access Token (前20字符): ${session.access_token.substring(0, 20)}...`);
      return session;
    } else {
      console.log('   ⚠️  当前无认证会话');
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return null;
  }
}

async function testAnonymousQuery() {
  console.log('\n2. 测试匿名查询（无认证）...');
  try {
    // 先登出确保是匿名状态
    await supabase.auth.signOut();

    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`   ❌ 匿名查询失败: ${error.message}`);
      console.log(`      错误代码: ${error.code}`);
      console.log(`      错误详情: ${JSON.stringify(error, null, 2)}`);
      return false;
    } else {
      console.log('   ✅ 匿名查询成功');
      return true;
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return false;
  }
}

async function testWithServiceRole() {
  console.log('\n3. 测试使用 Service Role Key...');
  console.log('   ⚠️  需要 Service Role Key，当前测试跳过');
  console.log('   提示: 如果需要测试管理员权限，请使用 service_role key');
}

async function diagnoseRLS() {
  console.log('\n4. 诊断 RLS 配置问题...');
  try {
    // 检查当前用户
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('   当前状态: 未认证（anonymous）');
      console.log('   RLS 行为: anonymous 角色应该被拒绝访问');
      console.log('   解决方案:');
      console.log('      1. 用户需要先登录/注册');
      console.log('      2. 或者修改 RLS 策略允许 anonymous 访问（不推荐）');
    } else {
      console.log(`   当前状态: 已认证 (authenticated, user_id: ${user.id})`);
      console.log('   RLS 行为: authenticated 角色应该能访问自己的数据');
    }

    console.log('\n   建议 RLS 策略配置:');
    console.log('   ```sql');
    console.log('   -- 允许认证用户访问自己的数据');
    console.log('   CREATE POLICY "Users can view own profiles"');
    console.log('     ON profiles');
    console.log('     FOR SELECT');
    console.log('     TO authenticated');
    console.log('     USING (auth.uid() = id);');
    console.log('   ```');
  } catch (error) {
    console.log(`   ❌ 诊断异常: ${error.message}`);
  }
}

async function listAvailableTables() {
  console.log('\n5. 列出可访问的表...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    if (error) {
      console.log(`   ❌ 无法访问 profiles 表: ${error.message}`);
    } else {
      console.log('   ✅ 可以访问 profiles 表');
    }

    // 尝试其他表
    const tables = ['journal_entries', 'user_settings', 'meditation_sessions', 'bookmarks', 'notes'];
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (tableError) {
        console.log(`   ❌ 无法访问 ${table} 表: ${tableError.message}`);
      } else {
        console.log(`   ✅ 可以访问 ${table} 表`);
      }
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }
}

async function provideSolution() {
  console.log('\n6. 解决方案建议...');

  console.log('\n   问题分析:');
  console.log('   - 当前使用 anon key 进行连接');
  console.log('   - anon key 对应 anonymous 角色');
  console.log('   - RLS 策略限制 anonymous 角色访问数据');
  console.log('   - 需要用户认证后才能访问数据');

  console.log('\n   推荐方案:');
  console.log('   1. 确保应用实现用户登录功能');
  console.log('   2. 登录后使用认证用户的会话进行数据访问');
  console.log('   3. 验证 RLS 策略配置正确');

  console.log('\n   测试步骤:');
  console.log('   a. 在应用中注册/登录用户');
  console.log('   b. 使用认证后的会话查询数据');
  console.log('   c. 验证只能访问自己的数据');

  console.log('\n   如果需要匿名访问:');
  console.log('   ⚠️  不推荐（安全风险）');
  console.log('   如必须，需修改 RLS 策略添加 anon 角色权限');
}

async function main() {
  console.log('开始详细诊断...\n');

  // 检查认证状态
  const session = await testAuthState();

  // 测试匿名查询
  await testAnonymousQuery();

  // 诊断 RLS
  await diagnoseRLS();

  // 列出可访问的表
  await listAvailableTables();

  // 提供解决方案
  await provideSolution();

  console.log('\n=== 诊断完成 ===');
}

main().catch(console.error);