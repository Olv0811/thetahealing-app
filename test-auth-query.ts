import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 测试认证后的查询 ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQueryWithAuthentication() {
  console.log('1. 尝试使用认证会话查询...');

  const userId = '6e0c8944-5fd6-4e94-8d2a-d9a0acdc6495';

  try {
    // 首先检查会话状态
    console.log('   检查当前会话...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log(`   ❌ 获取会话失败: ${sessionError.message}`);
    } else if (session) {
      console.log(`   ✅ 找到会话: ${session.user.email}`);
    } else {
      console.log('   ⚠️  没有活跃会话');
    }

    // 尝试查询
    console.log('   执行查询...');
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 查询失败 (${duration}ms)`);
      console.log(`   错误信息: ${error.message}`);
      console.log(`   错误代码: ${error.code}`);

      // 分析错误类型
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log(`   🔍 诊断: 权限被拒绝，可能是认证问题`);
      } else if (error.code === '401' || error.message.includes('Unauthorized')) {
        console.log(`   🔍 诊断: 认证失败，Token 可能无效`);
      } else if (error.code === 'PGRST116') {
        console.log(`   🔍 诊断: 查询结果为空`);
      }

      return { success: false, duration, error: error.message };
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   找到 ${data?.length || 0} 条记录`);

      if (data && data.length > 0) {
        console.log(`   第一条记录: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
      }

      return { success: true, duration, count: data?.length || 0 };
    }
  } catch (error: any) {
    console.log(`   ❌ 查询异常: ${error.message}`);
    return { success: false, duration: 0, error: error.message };
  }
}

async function testSimpleQuery() {
  console.log('\n2. 测试简单查询（无认证）...');

  try {
    const start = Date.now();

    // 尝试查询公共数据
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      console.log(`   错误代码: ${error.code}`);

      if (error.code === '42501') {
        console.log(`   🔍 诊断: RLS 策略拒绝了匿名访问`);
      }

      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   记录数: ${data}`);
      return { success: true, duration };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testLoginAndQuery() {
  console.log('\n3. 测试登录后查询...');

  const testEmail = 'testuser@thetahealing.com';
  const testPassword = 'Test123456!';

  try {
    console.log('   尝试登录...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log(`   ❌ 登录失败: ${error.message}`);

      if (error.message.includes('Email not confirmed')) {
        console.log(`   🔍 诊断: 邮箱未确认`);
      } else if (error.message.includes('Invalid login credentials')) {
        console.log(`   🔍 诊断: 凭据无效`);
      }

      return { success: false };
    }

    console.log(`   ✅ 登录成功: ${data.user.email}`);
    console.log(`   用户ID: ${data.user.id}`);

    // 登录后查询
    console.log('   使用登录会话查询...');
    const start = Date.now();

    const { data: entries, error: queryError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', data.user.id);

    const duration = Date.now() - start;

    if (queryError) {
      console.log(`   ❌ 查询失败 (${duration}ms): ${queryError.message}`);
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   找到 ${entries?.length || 0} 条记录`);
    }

    // 登出
    await supabase.auth.signOut();

    return { success: !queryError, duration };
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('开始测试...\n');

  // 测试简单查询
  await testSimpleQuery();

  // 测试认证查询
  await testQueryWithAuthentication();

  // 测试登录后查询
  await testLoginAndQuery();

  console.log('\n=== 测试完成 ===');

  console.log('\n总结:');
  console.log('1. 如果看到 "permission denied" 错误，说明需要先登录');
  console.log('2. 如果看到 "Email not confirmed" 错误，需要确认邮箱');
  console.log('3. 如果看到超时错误，可能是网络问题或数据库响应慢');
  console.log('4. 建议在应用中使用登录功能获取有效会话');
}

main().catch(console.error);