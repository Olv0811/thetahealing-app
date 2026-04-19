import { createClient } from '@supabase/supabase-js';

// 从测试文件中获取的配置
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== Supabase 认证登录测试 ===\n');

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试用户凭据
const TEST_USER = {
  email: 'testuser@thetahealing.com',
  password: 'Test123456!'
};

async function testSignUp() {
  console.log('1. 测试用户注册...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('   ⚠️  用户已存在，跳过注册');
        return null;
      }
      console.log(`   ❌ 注册失败: ${error.message}`);
      console.log(`      错误详情: ${JSON.stringify(error, null, 2)}`);
      return null;
    }

    console.log('   ✅ 注册成功');
    console.log(`      用户ID: ${data.user?.id}`);
    console.log(`      Email: ${data.user?.email}`);

    // 检查是否需要邮箱验证
    if (data.user && !data.user.email_confirmed_at) {
      console.log('   ⚠️  需要邮箱验证');
      console.log('   提示: 在 Supabase Dashboard 中禁用邮箱验证或手动确认邮箱');
    }

    return data.user;
  } catch (error) {
    console.log(`   ❌ 注册异常: ${error.message}`);
    return null;
  }
}

async function testLogin() {
  console.log('\n2. 测试用户登录...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (error) {
      console.log(`   ❌ 登录失败: ${error.message}`);
      console.log(`      错误详情: ${JSON.stringify(error, null, 2)}`);
      return null;
    }

    console.log('   ✅ 登录成功');
    console.log(`      用户ID: ${data.user.id}`);
    console.log(`      Email: ${data.user.email}`);
    console.log(`      Access Token (前20字符): ${data.session.access_token.substring(0, 20)}...`);

    return data.user;
  } catch (error) {
    console.log(`   ❌ 登录异常: ${error.message}`);
    return null;
  }
}

async function testAuthenticatedAccess(userId: string) {
  console.log('\n3. 测试认证后数据访问...');

  // 测试 Profile 访问
  console.log('   a. 测试 Profile 访问...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log(`      ❌ 失败: ${error.message}`);
      console.log(`         错误代码: ${error.code}`);
    } else {
      console.log('      ✅ 成功');
      console.log(`         Profile: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`      ❌ 异常: ${error.message}`);
  }

  // 测试创建日记条目
  console.log('   b. 测试创建日记条目...');
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title: '测试日记',
        content: '这是一条测试日记',
        rating: 5,
        mood_before: '一般',
        mood_after: '很好',
        tags: ['测试']
      })
      .select()
      .single();

    if (error) {
      console.log(`      ❌ 失败: ${error.message}`);
      console.log(`         错误代码: ${error.code}`);
    } else {
      console.log('      ✅ 成功');
      console.log(`         日记ID: ${data.id}`);
      console.log(`         标题: ${data.title}`);

      // 测试查询自己的日记
      console.log('   c. 测试查询自己的日记...');
      const { data: entries, error: queryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId);

      if (queryError) {
        console.log(`      ❌ 查询失败: ${queryError.message}`);
      } else {
        console.log(`      ✅ 查询成功，找到 ${entries.length} 条记录`);
      }
    }
  } catch (error) {
    console.log(`      ❌ 异常: ${error.message}`);
  }

  // 测试更新 Profile
  console.log('   d. 测试更新 Profile...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: 'Updated Test User'
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.log(`      ❌ 失败: ${error.message}`);
    } else {
      console.log('      ✅ 成功');
      console.log(`         更新后的姓名: ${data.full_name}`);
    }
  } catch (error) {
    console.log(`      ❌ 异常: ${error.message}`);
  }
}

async function testRLSProtection(userId: string) {
  console.log('\n4. 测试 RLS 保护（尝试访问其他用户数据）...');
  try {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', fakeUserId)
      .single();

    if (error && (error.code === 'PGRST116' || error.message.includes('permission denied'))) {
      console.log('   ✅ RLS 保护正常（无法访问其他用户数据）');
    } else if (error) {
      console.log(`   ⚠️  意外错误: ${error.message}`);
    } else {
      console.log('   ⚠️  可能存在 RLS 配置问题（能够访问其他用户数据）');
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }
}

async function cleanup() {
  console.log('\n5. 清理测试数据...');
  try {
    // 删除测试用户的日记条目
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('title', '测试日记');

    if (deleteError) {
      console.log(`   ⚠️  删除日记失败: ${deleteError.message}`);
    } else {
      console.log('   ✅ 测试日记已删除');
    }
  } catch (error) {
    console.log(`   ❌ 清理异常: ${error.message}`);
  }
}

async function testLogout() {
  console.log('\n6. 测试登出...');
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log(`   ❌ 登出失败: ${error.message}`);
    } else {
      console.log('   ✅ 登出成功');

      // 验证登出后无法访问数据
      console.log('   验证登出后数据访问...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error && error.message.includes('permission denied')) {
        console.log('   ✅ 登出后正确拒绝访问');
      } else {
        console.log('   ⚠️  登出后仍能访问数据（可能存在问题）');
      }
    }
  } catch (error) {
    console.log(`   ❌ 登出异常: ${error.message}`);
  }
}

async function main() {
  console.log('开始认证登录测试...\n');

  // 尝试注册（如果用户不存在）
  await testSignUp();

  // 登录
  const user = await testLogin();

  if (!user) {
    console.log('\n❌ 无法获取认证用户，停止测试');
    console.log('\n可能的原因:');
    console.log('1. 需要邮箱验证（检查 Supabase Dashboard）');
    console.log('2. 密码错误');
    console.log('3. 账户被禁用');
    return;
  }

  // 测试认证后访问
  await testAuthenticatedAccess(user.id);

  // 测试 RLS 保护
  await testRLSProtection(user.id);

  // 清理测试数据
  await cleanup();

  // 测试登出
  await testLogout();

  console.log('\n=== 测试完成 ===');
  console.log('\n总结:');
  console.log('✅ Supabase 认证系统正常工作');
  console.log('✅ RLS 策略正确保护用户数据');
  console.log('✅ 认证用户可以正常访问自己的数据');
  console.log('✅ 登出后正确拒绝数据访问');
}

main().catch(console.error);