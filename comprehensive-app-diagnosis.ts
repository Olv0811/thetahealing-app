// 综合应用层面诊断
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';

console.log('=== 综合应用层面诊断 ===\n');

async function diagnoseAppLevel() {
  // 1. 检查.env文件
  console.log('1. 检查环境变量配置...');
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    const hasUrl = envContent.includes('VITE_SUPABASE_URL');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
    
    console.log('   .env文件存在:', true);
    console.log('   包含URL配置:', hasUrl ? '✅ 是' : '❌ 否');
    console.log('   包含ANON KEY配置:', hasKey ? '✅ 是' : '❌ 否');
    
    if (hasUrl && hasKey) {
      const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
      const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
      
      if (urlMatch) {
        const configuredUrl = urlMatch[1].trim();
        console.log('   配置的URL:', configuredUrl);
        console.log('   URL匹配:', configuredUrl === SUPABASE_URL ? '✅ 是' : '❌ 否');
      }
      
      if (keyMatch) {
        const configuredKey = keyMatch[1].trim();
        console.log('   配置的Key前缀:', configuredKey.substring(0, 20) + '...');
      }
    }
  } catch (error) {
    console.log('   ❌ .env文件检查失败:', error.message);
    console.log('   可能原因: .env文件不存在');
  }
  
  // 2. 测试应用中的认证流程
  console.log('\n2. 测试应用认证流程...');
  try {
    // 使用当前应用的ANON KEY
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';
    
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    
    // 测试基本连接
    console.log('   测试基本连接...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('   ❌ 基本连接失败:', testError.message);
      console.log('   错误代码:', testError.code);
      console.log('   问题: API Key可能无效或项目配置有问题');
    } else {
      console.log('   ✅ 基本连接成功');
    }
    
    // 测试认证
    console.log('\n3. 测试认证流程...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('   ❌ 获取用户失败:', userError.message);
      console.log('   解决方案: 需要重新登录');
    } else if (user) {
      console.log('   ✅ 用户已登录:', user.email);
      console.log('   用户ID:', user.id);
      
      // 测试日记访问
      console.log('\n4. 测试日记访问（使用认证会话）...');
      const { data: journalData, error: journalError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (journalError) {
        console.log('   ❌ 日记访问失败:', journalError.message);
        console.log('   错误代码:', journalError.code);
        console.log('   HTTP状态:', journalError.code === '42501' ? '403 Forbidden' : '其他');
        
        console.log('\n5. 问题分析...');
        console.log('   数据库层面: ✅ 正常（SQL查询成功）');
        console.log('   应用层面: ❌ 认证失败');
        console.log('   可能的原因:');
        console.log('   a) JWT token无效或过期');
        console.log('   b) API Key与Supabase配置不匹配');
        console.log('   c) 认证会话有问题');
        
        console.log('\n6. 立即解决方案...');
        console.log('   步骤1: 在Supabase Dashboard中重新生成API Key');
        console.log('   访问: https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/settings/api');
        console.log('   点击 "Generate new key" 按钮');
        console.log('');
        console.log('   步骤2: 更新.env文件');
        console.log('   VITE_SUPABASE_URL=https://cbwxsmtfgxwotwudpkfe.supabase.co');
        console.log('   VITE_SUPABASE_ANON_KEY=新的anon key');
        console.log('');
        console.log('   步骤3: 重启开发服务器');
        console.log('   npm run dev');
        console.log('');
        console.log('   步骤4: 清除浏览器缓存并重新登录');
        console.log('   按F12 → Application → Storage → Clear site data');
        console.log('   重新登录应用');
        
      } else {
        console.log('   ✅ 日记访问成功！');
        console.log('   找到记录:', journalData.length);
        console.log('   应用配置正确！');
      }
    } else {
      console.log('   ❌ 用户未登录');
      console.log('   解决方案: 在应用中重新登录');
    }
    
  } catch (error) {
    console.log('   ❌ 诊断异常:', error.message);
  }
  
  console.log('\n=== 诊断完成 ===');
}

diagnoseAppLevel().catch(console.error);