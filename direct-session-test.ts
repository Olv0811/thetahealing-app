// 直接测试当前用户的数据库访问
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI5MjE2NiwiZXhwIjoyMDg1ODY4MTY2fQ.uvhe-0fl5QGse653rIN4g_Rp_iR2WAZtpZsjBNs3WTo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
});

console.log('=== 直接数据库访问测试 ===\n');

async function testDirectAccess() {
  const userId = '6e0c8944-5fd6-4e94-8d2a-d9a0acdc6495';
  
  console.log('1. 使用SERVICE_ROLE直接查询journal_entries...');
  console.log('   用户ID:', userId);
  
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.log('❌ 查询失败:', error.message);
      console.log('   错误代码:', error.code);
      console.log('   错误详情:', error);
      return;
    }
    
    console.log('✅ SERVICE_ROLE查询成功');
    console.log('   找到记录:', data.length);
    
    if (data.length > 0) {
      console.log('   示例记录:');
      data.slice(0, 2).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title || '无标题'} - ${new Date(item.created_at).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.log('❌ 查询异常:', error.message);
  }
  
  console.log('\n2. 检查用户Profile...');
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile查询失败:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile存在:', profile.email || profile.full_name || '用户');
    } else {
      console.log('⚠ Profile不存在');
    }
    
  } catch (error) {
    console.log('❌ Profile查询异常:', error.message);
  }
  
  console.log('\n3. 诊断分析...');
  console.log('   问题分析:');
  console.log('   a) SERVICE_ROLE可以访问数据 → 数据存在');
  console.log('   b) 应用中仍然报错 → 认证会话问题');
  console.log('   c) RLS策略已创建 → 策略配置问题');
  
  console.log('\n4. 可能的解决方案...');
  console.log('   方案A: 清除浏览器存储并重新登录');
  console.log('   方案B: 检查RLS策略是否正确应用');
  console.log('   方案C: 禁用RLS进行测试');
  
  console.log('\n5. 建议立即执行的SQL...');
  console.log('   在Supabase SQL Editor中执行:');
  console.log('   https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');
  console.log('');
  console.log('   -- 暂时禁用RLS进行测试');
  console.log('   ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('   如果禁用后可以访问，说明是RLS策略问题');
  console.log('   如果禁用后仍无法访问，说明是其他问题');
  
  console.log('\n=== 测试完成 ===');
}

testDirectAccess().catch(console.error);