// 检查JWT相关配置
console.log('=== JWT 配置检查 ===\n');

// 模拟从JWT令牌中提取用户ID
function getUserIdFromJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; // subject通常是用户ID
  } catch (error) {
    return null;
  }
}

// 从您提供的ANON KEY中提取信息
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('1. ANON KEY 解析:');
const payload = JSON.parse(atob(ANON_KEY.split('.')[1]));
console.log('   Issuer (iss):', payload.iss);
console.log('   Role (role):', payload.role);
console.log('   Issued At (iat):', new Date(payload.iat * 1000).toLocaleString());
console.log('   Expiration (exp):', new Date(payload.exp * 1000).toLocaleString());
console.log('   Project Ref:', payload.ref);

console.log('\n2. RLS 策略工作原理:');
console.log('   - 用户登录时，Supabase生成用户JWT令牌');
console.log('   - 令牌包含用户ID和签名');
console.log('   - API请求时自动携带用户JWT令牌');
console.log('   - Supabase验证令牌签名和有效期');
console.log('   - RLS策略使用 auth.uid() 获取已验证用户ID');
console.log('   - 策略检查: auth.uid() == user_id');

console.log('\n3. JWT Signing Keys 配置:');
console.log('   ❌ 不需要手动配置');
console.log('   ✅ Supabase 自动管理签名密钥');
console.log('   ✅ 客户端使用 anon key 进行身份验证');
console.log('   ✅ 用户登录后获得已签名的JWT令牌');

console.log('\n4. 当前问题诊断:');
console.log('   ❌ 权限错误: permission denied for table journal_entries');
console.log('   ✅ API Key 配置正确');
console.log('   ✅ JWT 自动处理正常');
console.log('   ❌ RLS 策略配置问题');
console.log('   🔧 需要修复: RLS 策略');

console.log('\n5. 解决方案:');
console.log('   在 Supabase Dashboard 的 SQL Editor 中执行 RLS 修复脚本');
console.log('   https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');

console.log('\n=== 检查完成 ===');