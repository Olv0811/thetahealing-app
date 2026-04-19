// 测试新的API Key是否有效
// 请将从Supabase Dashboard获取的新密钥填入下面

const NEW_SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const NEW_ANON_KEY = '请在此处粘贴新的anon public key';
const NEW_SERVICE_ROLE_KEY = '请在此处粘贴新的service_role key';

import { createClient } from '@supabase/supabase-js';

console.log('=== 测试新API Key ===\n');

async function testNewKeys() {
  console.log('1. 测试ANON KEY...');
  try {
    const supabase = createClient(NEW_SUPABASE_URL, NEW_ANON_KEY);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ ANON KEY测试失败:', error.message);
    } else {
      console.log('✅ ANON KEY测试成功');
    }
  } catch (error) {
    console.log('❌ ANON KEY测试异常:', error.message);
  }
  
  console.log('\n2. 测试SERVICE_ROLE KEY...');
  try {
    const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ SERVICE_ROLE KEY测试失败:', error.message);
      console.log('   这很奇怪，SERVICE_ROLE应该有完全访问权限');
    } else {
      console.log('✅ SERVICE_ROLE KEY测试成功');
    }
  } catch (error) {
    console.log('❌ SERVICE_ROLE KEY测试异常:', error.message);
  }
  
  console.log('\n3. 如果两个KEY都测试成功...');
  console.log('   请更新项目中的API Key配置');
  console.log('   更新文件:');
  console.log('   - .env 文件');
  console.log('   - 所有测试文件中的API Key');
  
  console.log('\n=== 测试完成 ===');
}

testNewKeys().catch(console.error);