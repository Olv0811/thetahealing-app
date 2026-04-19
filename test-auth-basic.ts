import { createClient } from '@supabase/supabase-js';

// 从测试文件中获取的配置
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== Supabase 认证基础测试 ===\n');

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('1. 测试基本连接...');
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 连接失败: ${error.message}`);
      console.log(`   错误代码: ${error.code}`);
      return false;
    } else {
      console.log(`   ✅ 连接成功 (${duration}ms)`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ 连接异常: ${error.message}`);
    return false;
  }
}

async function testSession() {
  console.log('\n2. 检查当前会话...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log(`   ❌ 获取会话失败: ${error.message}`);
      return null;
    }

    if (session) {
      console.log(`   ✅ 用户已登录: ${session.user.email}`);
      console.log(`   用户ID: ${session.user.id}`);
      return session.user;
    } else {
      console.log('   ⚠️  用户未登录');
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 获取会话异常: ${error.message}`);
    return null;
  }
}

async function testProfileAccess(userId: string | null) {
  console.log('\n3. 测试 Profile 访问...');
  if (!userId) {
    console.log('   ⚠️  跳过（需要用户登录）');
    return;
  }

  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 查询失败: ${error.message}`);
      console.log(`   错误代码: ${error.code}`);
      console.log(`   错误详情: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   Profile: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ 查询异常: ${error.message}`);
  }
}

async function testJournalAccess(userId: string | null) {
  console.log('\n4. 测试 Journal 访问...');
  if (!userId) {
    console.log('   ⚠️  跳过（需要用户登录）');
    return;
  }

  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 查询失败: ${error.message}`);
      console.log(`   错误代码: ${error.code}`);
      console.log(`   错误详情: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   找到 ${data.length} 条日记记录`);
    }
  } catch (error) {
    console.log(`   ❌ 查询异常: ${error.message}`);
  }
}

async function testRLS() {
  console.log('\n5. 测试 RLS 策略...');
  try {
    // 尝试访问其他用户的数据（应该被拒绝）
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', fakeUserId)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('   ✅ RLS 策略正常工作（无法访问其他用户数据）');
    } else if (error) {
      console.log(`   ⚠️  RLS 测试结果: ${error.message}`);
    } else {
      console.log('   ⚠️  可能存在 RLS 配置问题');
    }
  } catch (error) {
    console.log(`   ❌ RLS 测试异常: ${error.message}`);
  }
}

async function main() {
  console.log('开始测试...\n');

  // 测试基本连接
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ 基本连接失败，停止测试');
    return;
  }

  // 测试会话
  const user = await testSession();

  // 测试数据访问
  await testProfileAccess(user?.id || null);
  await testJournalAccess(user?.id || null);

  // 测试 RLS
  await testRLS();

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);