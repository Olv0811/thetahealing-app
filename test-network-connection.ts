import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 网络连接诊断 ===');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBasicConnection() {
  console.log('1. 测试基本网络连接...');
  try {
    const start = Date.now();

    // 测试基本的 HTTP 连接
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    const duration = Date.now() - start;

    if (response.ok) {
      console.log(`   ✅ 网络连接正常 (${duration}ms)`);
      console.log(`   状态码: ${response.status}`);
      return true;
    } else {
      console.log(`   ❌ 连接失败 (${duration}ms)`);
      console.log(`   状态码: ${response.status}`);
      console.log(`   状态: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 网络异常: ${error.message}`);
    return false;
  }
}

async function testDatabaseQuerySpeed() {
  console.log('\n2. 测试数据库查询速度...');
  try {
    const start = Date.now();

    // 执行一个简单的查询
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 查询失败 (${duration}ms)`);
      console.log(`   错误: ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   记录数: ${data}`);

      // 评估查询速度
      if (duration < 1000) {
        console.log(`   速度评级: ⭐⭐⭐⭐⭐ (优秀)`);
      } else if (duration < 2000) {
        console.log(`   速度评级: ⭐⭐⭐⭐ (良好)`);
      } else if (duration < 5000) {
        console.log(`   速度评级: ⭐⭐⭐ (一般)`);
      } else if (duration < 10000) {
        console.log(`   速度评级: ⭐⭐ (较慢)`);
      } else {
        console.log(`   速度评级: ⭐ (很慢)`);
      }

      return { success: true, duration };
    }
  } catch (error) {
    console.log(`   ❌ 查询异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testJournalQueryWithRealUser() {
  console.log('\n3. 测试日记查询（使用真实用户ID）...');

  const userId = '6e0c8944-5fd6-4e94-8d2a-d9a0acdc6495';

  try {
    const start = Date.now();

    // 测试不同的查询方式
    console.log('   a. 测试无限制查询...');
    const { data: data1, error: error1 } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);

    const duration1 = Date.now() - start;

    if (error1) {
      console.log(`      ❌ 失败 (${duration1}ms): ${error1.message}`);
    } else {
      console.log(`      ✅ 成功 (${duration1}ms) - 找到 ${data1?.length || 0} 条记录`);
    }

    // 测试带限制的查询
    console.log('   b. 测试限制查询...');
    const start2 = Date.now();
    const { data: data2, error: error2 } = await supabase
      .from('journal_entries')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const duration2 = Date.now() - start2;

    if (error2) {
      console.log(`      ❌ 失败 (${duration2}ms): ${error2.message}`);
    } else {
      console.log(`      ✅ 成功 (${duration2}ms) - 找到 ${data2?.length || 0} 条记录`);
    }

    return { success: !error1, duration: Math.max(duration1, duration2) };
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testNetworkLatency() {
  console.log('\n4. 测试网络延迟...');
  const results = [];

  for (let i = 0; i < 5; i++) {
    const start = Date.now();

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
        }
      });

      const duration = Date.now() - start;
      results.push(duration);
      console.log(`   测试 ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`   测试 ${i + 1}: 失败 - ${error.message}`);
      results.push(9999); // 标记为失败
    }
  }

  const validResults = results.filter(r => r < 9999);
  if (validResults.length > 0) {
    const avg = validResults.reduce((sum, r) => sum + r, 0) / validResults.length;
    const max = Math.max(...validResults);
    const min = Math.min(...validResults);

    console.log(`   平均延迟: ${avg.toFixed(0)}ms`);
    console.log(`   最快: ${min}ms`);
    console.log(`   最慢: ${max}ms`);

    if (avg < 500) {
      console.log(`   网络质量: ⭐⭐⭐⭐⭐ (优秀)`);
    } else if (avg < 1000) {
      console.log(`   网络质量: ⭐⭐⭐⭐ (良好)`);
    } else if (avg < 2000) {
      console.log(`   网络质量: ⭐⭐⭐ (一般)`);
    } else {
      console.log(`   网络质量: ⭐⭐ (较差)`);
    }

    return { avg, max, min };
  } else {
    console.log(`   ❌ 所有测试都失败了`);
    return { avg: 0, max: 0, min: 0 };
  }
}

async function provideRecommendations(latency: any, querySpeed: any) {
  console.log('\n5. 优化建议...');

  console.log('\n   当前状态分析:');
  if (latency.avg > 2000) {
    console.log('   ⚠️  网络延迟较高，可能影响用户体验');
  }
  if (querySpeed.duration > 3000) {
    console.log('   ⚠️  数据库查询较慢，可能需要优化');
  }

  console.log('\n   推荐优化措施:');

  console.log('\n   1. 数据库查询优化:');
  console.log('      - 只选择必要的字段');
  console.log('      - 添加适当的索引');
  console.log('      - 使用分页查询大量数据');
  console.log('      - 考虑使用缓存');

  console.log('\n   2. 网络优化:');
  console.log('      - 检查网络连接稳定性');
  console.log('      - 考虑使用 CDN');
  console.log('      - 优化数据传输大小');
  console.log('      - 实现离线缓存');

  console.log('\n   3. 用户体验优化:');
  console.log('      - 添加加载指示器');
  console.log('      - 实现渐进式加载');
  console.log('      - 提供重试机制');
  console.log('      - 优化错误提示');

  console.log('\n   4. 开发环境优化:');
  console.log('      - 确保开发服务器运行正常');
  console.log('      - 检查是否有代理或防火墙干扰');
  console.log('      - 验证 Supabase 项目状态');
}

async function main() {
  console.log('开始网络诊断...\n');

  // 测试基本连接
  const connected = await testBasicConnection();
  if (!connected) {
    console.log('\n❌ 基本连接失败，无法继续测试');
    console.log('请检查:');
    console.log('1. 网络连接是否正常');
    console.log('2. Supabase URL 是否正确');
    console.log('3. 防火墙或代理设置');
    return;
  }

  // 测试数据库查询速度
  const querySpeed = await testDatabaseQuerySpeed();

  // 测试实际用户查询
  await testJournalQueryWithRealUser();

  // 测试网络延迟
  const latency = await testNetworkLatency();

  // 提供优化建议
  await provideRecommendations(latency, querySpeed);

  console.log('\n=== 诊断完成 ===');
}

main().catch(console.error);