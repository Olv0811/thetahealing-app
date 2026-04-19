import { createClient } from '@supabase/supabase-js';

// 从测试文件中获取的配置
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 检查现有认证用户 ===\n');

// 创建客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkExistingUsers() {
  console.log('尝试使用常见测试凭据登录...\n');

  const testCredentials = [
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'user@test.com', password: 'user123' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'demo@test.com', password: 'demo123' },
  ];

  for (const creds of testCredentials) {
    console.log(`尝试: ${creds.email}`);
    const { data, error } = await supabase.auth.signInWithPassword(creds);

    if (data.user) {
      console.log(`   ✅ 登录成功！`);
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      return data.user;
    } else {
      console.log(`   ❌ 失败: ${error.message}`);
    }
  }

  console.log('\n⚠️  没有找到可用的测试用户');
  return null;
}

async function main() {
  const user = await checkExistingUsers();

  if (user) {
    console.log('\n✅ 找到可用的认证用户，可以进行认证测试');
    console.log('\n建议：');
    console.log('1. 使用此用户进行后续的认证测试');
    console.log('2. 在 Supabase Dashboard 中禁用邮箱验证以创建新用户');
    console.log('3. 或手动确认新注册用户的邮箱');
  } else {
    console.log('\n建议：');
    console.log('1. 在 Supabase Dashboard -> Authentication -> Providers 中禁用 "Confirm email"');
    console.log('2. 然后重新运行注册测试');
    console.log('3. 或在 Dashboard 中手动创建一个测试用户');
  }
}

main().catch(console.error);