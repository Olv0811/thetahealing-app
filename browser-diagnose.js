// 在浏览器控制台中运行此脚本进行诊断
// 复制整个脚本内容，粘贴到浏览器控制台中执行

console.log('=== 浏览器端诊断 ===\n');

async function browserDiagnose() {
  // 1. 检查Supabase会话
  console.log('1. 检查Supabase会话...');
  try {
    const response = await fetch('https://cbwxsmtfgxwotwudpkfe.supabase.co/auth/v1/user', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A',
        'Authorization': `Bearer ${localStorage.getItem('sb-cbwxsmtfgxwotwudpkfe-auth-token') || ''}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      console.log('   ✅ 找到用户会话:', user.email);
      console.log('   用户ID:', user.id);
    } else {
      console.log('   ❌ 会话无效或已过期');
      console.log('   状态码:', response.status);
    }
  } catch (error) {
    console.log('   ❌ 检查会话失败:', error.message);
  }

  // 2. 检查本地存储
  console.log('\n2. 检查本地存储...');
  const authKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'));
  console.log('   找到认证相关存储:', authKeys.length, '个');

  if (authKeys.length > 0) {
    authKeys.forEach(key => {
      console.log(`   - ${key}`);
    });
  } else {
    console.log('   ❌ 没有找到认证存储');
  }

  // 3. 检查缓存数据
  console.log('\n3. 检查日记缓存...');
  const cacheData = localStorage.getItem('journal_entries_cache');
  if (cacheData) {
    try {
      const { entries, timestamp } = JSON.parse(cacheData);
      const age = Date.now() - timestamp;
      const ageMinutes = Math.floor(age / 60000);

      console.log(`   ✅ 找到缓存数据`);
      console.log(`   记录数: ${entries?.length || 0}`);
      console.log(`   缓存时间: ${ageMinutes} 分钟前`);
    } catch (error) {
      console.log('   ❌ 缓存数据损坏');
    }
  } else {
    console.log('   ❌ 没有缓存数据');
  }

  // 4. 测试网络连接
  console.log('\n4. 测试网络连接...');
  try {
    const start = Date.now();
    const response = await fetch('https://cbwxsmtfgxwotwudpkfe.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A'
      }
    });
    const duration = Date.now() - start;

    console.log(`   网络响应时间: ${duration}ms`);
    console.log(`   状态码: ${response.status}`);

    if (response.ok) {
      console.log('   ✅ 网络连接正常');
    } else {
      console.log('   ⚠️  网络连接有问题');
    }
  } catch (error) {
    console.log('   ❌ 网络连接失败:', error.message);
  }

  // 5. 推荐解决方案
  console.log('\n5. 推荐解决方案...');

  console.log('\n   如果看到"会话无效或已过期":');
  console.log('   1. 点击应用中的"重新登录"按钮');
  console.log('   2. 输入用户凭据重新登录');
  console.log('   3. 登录后刷新页面');

  console.log('\n   如果网络连接有问题:');
  console.log('   1. 检查网络连接');
  console.log('   2. 尝试刷新页面');
  console.log('   3. 检查防火墙设置');

  console.log('\n   如果有缓存数据但无法加载:');
  console.log('   1. 清除浏览器缓存');
  console.log('   2. 重新登录');
  console.log('   3. 让应用重新加载数据');

  console.log('\n=== 诊断完成 ===');
}

browserDiagnose().catch(console.error);