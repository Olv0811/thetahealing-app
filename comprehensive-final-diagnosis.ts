// 全面最终诊断
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI5MjE2NiwiZXhwIjoyMDg1ODY4MTY2fQ.uvhe-0fl5QGse653rIN4g_Rp_iR2WAZtpZsjBNs3WTo';

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
});

const supabaseService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
});

console.log('=== 全面最终诊断 ===\n');

async function runComprehensiveDiagnosis() {
  const userId = '6e0c8944-5fd6-4e94-8d2a-d9a0acdc6495';
  
  console.log('1. 测试 SERVICE_ROLE 直接访问（绕过所有安全）...');
  try {
    const { data, error } = await supabaseService
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
    
    if (error) {
      console.log('❌ SERVICE_ROLE 访问失败:', error.message);
      console.log('   这很奇怪！SERVICE_ROLE应该有完全访问权限');
      console.log('   可能的问题:');
      console.log('   a) SERVICE_ROLE_KEY 错误');
      console.log('   b) Supabase 项目配置问题');
      console.log('   c) 网络连接问题');
    } else {
      console.log('✅ SERVICE_ROLE 访问成功');
      console.log('   找到记录:', data.length);
      if (data.length > 0) {
        console.log('   数据确实存在');
      }
    }
  } catch (error) {
    console.log('❌ SERVICE_ROLE 测试异常:', error.message);
  }
  
  console.log('\n2. 测试 ANON KEY 无认证访问...');
  try {
    const { data, error } = await supabaseAnon
      .from('journal_entries')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('✅ ANON 无认证访问被正确拒绝:', error.message);
      console.log('   这是预期的安全行为');
    } else {
      console.log('⚠️ ANON 无认证访问居然成功了！');
      console.log('   这不应该发生，可能存在安全风险');
    }
  } catch (error) {
    console.log('❌ ANON 测试异常:', error.message);
  }
  
  console.log('\n3. 测试当前用户的认证会话...');
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser();
    
    if (error || !user) {
      console.log('❌ 用户未登录:', error?.message || '无会话');
      console.log('   解决方案: 需要重新登录');
    } else {
      console.log('✅ 用户已登录:', user.email);
      console.log('   用户ID:', user.id);
      console.log('   ID匹配:', user.id === userId ? '✅ 是' : '❌ 否');
      
      if (user.id !== userId) {
        console.log('   🔴 发现问题：用户ID不匹配！');
        console.log('   应用中使用的ID:', userId);
        console.log('   实际登录用户ID:', user.id);
      }
    }
  } catch (error) {
    console.log('❌ 认证检查异常:', error.message);
  }
  
  console.log('\n4. 尝试使用认证后的会话查询...');
  try {
    // 先获取会话
    const { data: { session } } = await supabaseAnon.auth.getSession();
    
    if (!session) {
      console.log('❌ 无活跃会话');
      return;
    }
    
    // 使用认证后的客户端
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'public' },
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    });
    
    const { data, error } = await authClient
      .from('journal_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .limit(1);
    
    if (error) {
      console.log('❌ 认证后查询失败:', error.message);
      console.log('   错误代码:', error.code);
      console.log('   这证实了RLS策略问题');
    } else {
      console.log('✅ 认证后查询成功！');
      console.log('   找到记录:', data.length);
      console.log('   RLS策略工作正常');
    }
  } catch (error) {
    console.log('❌ 认证查询异常:', error.message);
  }
  
  console.log('\n5. 诊断总结和建议...');
  console.log('   基于以上测试，最可能的问题是:');
  console.log('   a) RLS策略没有正确应用');
  console.log('   b) 用户会话Token有问题');
  console.log('   c) Supabase项目配置异常');
  
  console.log('\n6. 建议的最终解决方案...');
  console.log('   在Supabase SQL Editor中依次执行:');
  console.log('   https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');
  console.log('');
  console.log('   -- 步骤1: 完全重置journal_entries表');
  console.log('   ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('   -- 步骤2: 删除所有现有策略');
  console.log('   DROP POLICY IF EXISTS "journal_entries_select_policy" ON journal_entries;');
  console.log('   DROP POLICY IF EXISTS "journal_entries_insert_policy" ON journal_entries;');
  console.log('   DROP POLICY IF EXISTS "journal_entries_update_policy" ON journal_entries;');
  console.log('   DROP POLICY IF EXISTS "journal_entries_delete_policy" ON journal_entries;');
  console.log('');
  console.log('   -- 步骤3: 重新启用RLS');
  console.log('   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('   -- 步骤4: 创建简化策略');
  console.log('   CREATE POLICY "Allow all" ON journal_entries FOR ALL TO public USING (true);');
  console.log('');
  console.log('   -- 步骤5: 测试查询');
  console.log('   SELECT * FROM journal_entries WHERE user_id = \'' + userId + '\' LIMIT 1;');
  console.log('');
  console.log('   如果步骤5成功，说明是RLS策略问题');
  console.log('   然后我们可以创建正确的策略');
  
  console.log('\n=== 诊断完成 ===');
}

runComprehensiveDiagnosis().catch(console.error);
