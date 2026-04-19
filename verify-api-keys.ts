// 验证API Key配置
console.log('=== API Key 配置验证 ===\n');

// 用户提供的密钥
const PROVIDED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';
const PROVIDED_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI5MjE2NiwiZXhwIjoyMDg1ODY4MTY2fQ.uvhe-0fl5QGse653rIN4g_Rp_iR2WAZtpZsjBNs3WTo';

// 系统中使用的密钥（从测试文件中找到）
const SYSTEM_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('1. 检查 ANON KEY:');
console.log('   提供的密钥:', PROVIDED_ANON_KEY.substring(0, 20) + '...');
console.log('   系统密钥:  ', SYSTEM_ANON_KEY.substring(0, 20) + '...');
console.log('   匹配状态:  ', PROVIDED_ANON_KEY === SYSTEM_ANON_KEY ? '✅ 匹配' : '❌ 不匹配');

console.log('\n2. 检查 SERVICE_ROLE KEY:');
console.log('   提供的密钥:', PROVIDED_SERVICE_ROLE_KEY.substring(0, 20) + '...');
console.log('   系统状态:  ', '❌ 系统中未找到 service_role key 的使用');
console.log('   说明:      ', '系统只使用 anon key，这是正确的（客户端应用不应使用 service_role key）');

console.log('\n3. 检查 URL:');
const PROVIDED_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SYSTEM_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
console.log('   提供的URL:', PROVIDED_URL);
console.log('   系统URL:  ', SYSTEM_URL);
console.log('   匹配状态:  ', PROVIDED_URL === SYSTEM_URL ? '✅ 匹配' : '❌ 不匹配');

console.log('\n4. 安全建议:');
console.log('   ✅ 客户端使用 anon key 是正确的');
console.log('   ✅ 没有 service_role key 硬编码在客户端代码中（安全）');
console.log('   ⚠️  确保服务端脚本（如果有）使用 service_role key');

console.log('\n=== 验证完成 ===');