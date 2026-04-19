import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

console.log('=== 快速诊断 ===\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function quickDiagnose() {
  console.log('1. 检查当前会话...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.log(`   ❌ 会话检查失败: ${sessionError.message}`);
  } else if (session) {
    console.log(`   ✅ 找到会话: ${session.user.email}`);
    console.log(`   用户ID: ${session.user.id}`);
    console.log(`   Token过期时间: ${new Date(session.expires_at! * 1000).toLocaleString()}`);

    // 检查token是否有效
    const isExpired = Date.now() > session.expires_at! * 1000;
    console.log(`   Token状态: ${isExpired ? '已过期' : '有效'}`);
  } else {
    console.log('   ❌ 没有找到会话');
    console.log('   解决方案: 需要重新登录');
  }

  if (!session) {
    console.log('\n❌ 没有认证会话，无法继续测试');
    console.log('\n请在应用中重新登录');
    return;
  }

  console.log('\n2. 测试数据库连接...');
  const userId = session.user.id;

  try {
    console.log('   执行简单查询...');
    const start = Date.now();

    // 设置5秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('查询超时')), 5000);
    });

    const queryPromise = supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ 查询失败 (${duration}ms): ${error.message}`);
      console.log(`   错误代码: ${error.code}`);

      if (error.code === '42501') {
        console.log('   🔍 原因: 权限被拒绝');
        console.log('   解决方案: 检查RLS策略配置');
      } else if (error.message.includes('timeout')) {
        console.log('   🔍 原因: 查询超时');
        console.log('   解决方案: 检查网络连接');
      }
    } else {
      console.log(`   ✅ 查询成功 (${duration}ms)`);
      console.log(`   找到记录: ${data && data.length > 0 ? '是' : '否'}`);
    }
  } catch (error: any) {
    console.log(`   ❌ 查询异常: ${error.message}`);
  }

  console.log('\n3. 检查本地缓存...');
  console.log('   (浏览器端功能，请在浏览器控制台中检查)');
  console.log('   使用命令: localStorage.getItem("journal_entries_cache")');

  console.log('\n4. 推荐解决方案...');

  if (session && Date.now() > session.expires_at! * 1000) {
    console.log('   ⚠️  Token已过期，需要重新登录');
    console.log('   步骤: 点击"重新登录"按钮');
  }

  console.log('\n   如果问题持续，请尝试:');
  console.log('   1. 刷新浏览器页面');
  console.log('   2. 清除浏览器缓存');
  console.log('   3. 检查网络连接');
  console.log('   4. 重新登录应用');
}

console.log('开始快速诊断...\n');
quickDiagnose().catch(console.error);