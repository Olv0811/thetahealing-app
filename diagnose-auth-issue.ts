import { createClient } from '@supabase/supabase-js';

// 从测试文件中获取的配置
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 认证问题诊断 ===\n');

// 创建客户端（与应用中相同的配置）
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

async function checkCurrentSession() {
  console.log('1. 检查当前会话状态...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log(`   ❌ 获取会话失败: ${error.message}`);
      return null;
    }

    if (session) {
      console.log('   ✅ 找到活跃会话:');
      console.log(`      用户ID: ${session.user.id}`);
      console.log(`      Email: ${session.user.email}`);
      console.log(`      Access Token 过期时间: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      console.log(`      Token 是否过期: ${Date.now() > session.expires_at! * 1000 ? '是' : '否'}`);

      // 检查 token 是否即将过期
      const timeUntilExpiry = session.expires_at! * 1000 - Date.now();
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
      console.log(`      距离过期还有: ${minutesUntilExpiry} 分钟`);

      if (minutesUntilExpiry < 5) {
        console.log('   ⚠️  Token 即将过期，可能需要刷新');
      }

      return session;
    } else {
      console.log('   ⚠️  没有找到活跃会话');
      return null;
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return null;
  }
}

async function testTokenRefresh() {
  console.log('\n2. 测试 Token 刷新...');
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.log(`   ❌ Token 刷新失败: ${error.message}`);
      console.log(`      错误代码: ${error.code}`);
      return false;
    }

    if (data.session) {
      console.log('   ✅ Token 刷新成功');
      console.log(`      新的过期时间: ${new Date(data.session.expires_at! * 1000).toLocaleString()}`);
      return true;
    } else {
      console.log('   ⚠️  无法刷新 Token（可能需要重新登录）');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return false;
  }
}

async function testDatabaseAccessWithSession(session: any) {
  console.log('\n3. 使用当前会话测试数据库访问...');
  if (!session) {
    console.log('   ⚠️  跳过（无会话）');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1);

    if (error) {
      console.log(`   ❌ 数据库访问失败: ${error.message}`);
      console.log(`      错误代码: ${error.code}`);

      // 检查是否是认证错误
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('   🔍 诊断: 这是 RLS 权限错误');
        console.log('   可能原因:');
        console.log('      1. Token 已过期但未刷新');
        console.log('      2. 用户 ID 不匹配');
        console.log('      3. RLS 策略配置问题');
      }
    } else {
      console.log('   ✅ 数据库访问正常');
      console.log(`      找到 ${data.length} 条记录`);
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }
}

async function checkUserFromToken() {
  console.log('\n4. 从 Token 获取用户信息...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.log(`   ❌ 获取用户失败: ${error.message}`);
      console.log(`      错误代码: ${error.code}`);

      if (error.code === '401' || error.message.includes('Invalid')) {
        console.log('   🔍 诊断: Token 无效或已过期');
      }
    } else if (user) {
      console.log('   ✅ 用户信息有效');
      console.log(`      用户ID: ${user.id}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Email 已确认: ${user.email_confirmed_at ? '是' : '否'}`);
    } else {
      console.log('   ⚠️  无法获取用户信息');
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }
}

async function provideSolution() {
  console.log('\n5. 解决方案建议...');

  console.log('\n   问题分析:');
  console.log('   - 应用显示 "permission denied" 错误');
  console.log('   - 这表明 RLS 策略拒绝了数据访问');
  console.log('   - 可能的原因：Token 过期或无效');

  console.log('\n   推荐解决方案:');

  console.log('\n   方案 1: 重新登录（推荐）');
  console.log('   1. 点击应用中的"重新登录"按钮');
  console.log('   2. 输入用户凭据');
  console.log('   3. 登录后会获得新的有效 Token');

  console.log('\n   方案 2: 清除浏览器存储');
  console.log('   1. 打开浏览器开发者工具 (F12)');
  console.log('   2. 进入 Application 标签');
  console.log('   3. 清除 Local Storage 和 Session Storage');
  console.log('   4. 刷新页面并重新登录');

  console.log('\n   方案 3: 检查环境变量');
  console.log('   1. 确保 .env 文件存在');
  console.log('   2. 验证 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 正确');
  console.log('   3. 重启开发服务器');

  console.log('\n   预防措施:');
  console.log('   - AuthContext 已配置 autoRefreshToken: true');
  console.log('   - 会话会自动刷新（在过期前 5 分钟）');
  console.log('   - 如果问题持续，检查网络连接');
}

async function main() {
  console.log('开始诊断...\n');

  // 检查当前会话
  const session = await checkCurrentSession();

  // 检查用户信息
  await checkUserFromToken();

  // 测试 Token 刷新
  if (session) {
    await testTokenRefresh();
  }

  // 测试数据库访问
  await testDatabaseAccessWithSession(session);

  // 提供解决方案
  await provideSolution();

  console.log('\n=== 诊断完成 ===');
}

main().catch(console.error);
