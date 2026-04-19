import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 查询性能诊断 ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userId = '6e0c8944-5fd6-4e94-8d2a-d9a0acdc6495';

async function testQuery1_FullQuery() {
  console.log('1. 测试完整查询（select *）...');
  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   记录数: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log(`   第一条记录字段数: ${Object.keys(data[0]).length}`);
      }
      return { success: true, duration, count: data?.length || 0 };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testQuery2_SelectiveFields() {
  console.log('\n2. 测试选择性字段查询...');
  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, title, content, rating, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   记录数: ${data?.length || 0}`);
      return { success: true, duration, count: data?.length || 0 };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testQuery3_WithLimit() {
  console.log('\n3. 测试带限制的查询...');
  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   记录数: ${data?.length || 0}`);
      return { success: true, duration, count: data?.length || 0 };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testQuery4_CountOnly() {
  console.log('\n4. 测试计数查询...');
  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   记录数: ${data}`);
      return { success: true, duration, count: data || 0 };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testQuery5_SimpleQuery() {
  console.log('\n5. 测试最简单查询...');
  try {
    const start = Date.now();

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 失败 (${duration}ms): ${error.message}`);
      return { success: false, duration };
    } else {
      console.log(`   ✅ 成功 (${duration}ms)`);
      console.log(`   找到记录: ${data && data.length > 0 ? '是' : '否'}`);
      return { success: true, duration };
    }
  } catch (error: any) {
    console.log(`   ❌ 异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testNetworkConnectivity() {
  console.log('\n6. 测试网络连接性...');
  try {
    const start = Date.now();

    // 直接HTTP请求测试
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });

    const duration = Date.now() - start;

    console.log(`   HTTP响应时间: ${duration}ms`);
    console.log(`   状态码: ${response.status}`);

    return { success: response.ok, duration };
  } catch (error: any) {
    console.log(`   ❌ 网络异常: ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function analyzeResults(results: any) {
  console.log('\n7. 结果分析...');

  const queryTimes = results.filter(r => r.success).map(r => r.duration);

  if (queryTimes.length === 0) {
    console.log('   ❌ 所有查询都失败了');
    return;
  }

  const avgTime = queryTimes.reduce((sum, t) => sum + t, 0) / queryTimes.length;
  const maxTime = Math.max(...queryTimes);
  const minTime = Math.min(...queryTimes);

  console.log(`   平均查询时间: ${avgTime.toFixed(0)}ms`);
  console.log(`   最快查询: ${minTime}ms`);
  console.log(`   最慢查询: ${maxTime}ms`);

  if (avgTime > 10000) {
    console.log(`   ⚠️  查询速度过慢，可能存在问题`);
  } else if (avgTime > 5000) {
    console.log(`   ⚠️  查询速度较慢`);
  } else if (avgTime > 1000) {
    console.log(`   ✅ 查询速度正常`);
  } else {
    console.log(`   ✅ 查询速度很快`);
  }

  // 提供优化建议
  console.log('\n8. 优化建议...');

  if (results[1]?.success && results[1].duration < results[0]?.duration) {
    console.log('   ✅ 选择性字段查询更快，建议优化查询字段');
  }

  if (results[2]?.success && results[2].duration < results[0]?.duration) {
    console.log('   ✅ 限制查询数量可以提高性能，建议使用分页');
  }

  if (results[3]?.success && results[3].duration < results[0]?.duration) {
    console.log('   ✅ 计数查询更快，建议分离计数和数据查询');
  }

  if (avgTime > 10000) {
    console.log('\n   严重性能问题建议:');
    console.log('   1. 检查数据库索引');
    console.log('   2. 优化查询语句');
    console.log('   3. 考虑使用缓存');
    console.log('   4. 检查网络连接');
    console.log('   5. 联系 Supabase 支持');
  }
}

async function main() {
  console.log('开始性能测试...\n');

  // 测试网络连接
  const networkResult = await testNetworkConnectivity();

  if (!networkResult.success) {
    console.log('\n❌ 网络连接失败，无法继续测试');
    console.log('请检查:');
    console.log('1. 网络连接是否正常');
    console.log('2. Supabase 服务是否可用');
    console.log('3. 防火墙或代理设置');
    return;
  }

  // 测试不同查询方式
  const results = [];

  results.push(await testQuery1_FullQuery());
  results.push(await testQuery2_SelectiveFields());
  results.push(await testQuery3_WithLimit());
  results.push(await testQuery4_CountOnly());
  results.push(await testQuery5_SimpleQuery());

  // 分析结果
  await analyzeResults(results);

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);