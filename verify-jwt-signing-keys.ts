// 验证JWT Signing Keys配置
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIxNjYsImV4cCI6MjA4NTg2ODE2Nn0.boOnhrSlXglTbKSiFp3xikrq1m2PbnNDT3IT8WN4V5A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
});

console.log('=== 验证JWT Signing Keys配置 ===\n');
console.log('您配置的JWT Signing Key:', '5FC7559C-9A11-4A91-AEEB-C849A1631812');
console.log('');

async function verifyJWTConfiguration() {
  console.log('1. 检查当前用户认证状态...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ 获取用户失败:', error.message);
      console.log('   错误代码:', error.code);
      return;
    }
    
    if (!user) {
      console.log('❌ 用户未登录');
      console.log('   需要重新登录以生成新的JWT token');
      return;
    }
    
    console.log('✅ 用户已登录:', user.email);
    console.log('   用户ID:', user.id);
    
    console.log('\n2. 检查JWT token信息...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('❌ 获取会话失败:', sessionError.message);
        return;
      }
      
      if (!session) {
        console.log('❌ 无活跃会话');
        return;
      }
      
      console.log('✅ 会话存在');
      console.log('   Access Token:', session.access_token.substring(0, 50) + '...');
      console.log('   Expires At:', new Date(session.expires_at * 1000).toLocaleString());
      
      // 解析JWT token
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('   Token Payload:');
        console.log('     - User ID:', payload.sub);
        console.log('     - Email:', payload.email);
        console.log('     - Issuer:', payload.iss);
        console.log('     - Expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('     - Role:', payload.role);
        
        // 检查是否有新的 signing key 相关信息
        if (payload.kid) {
          console.log('     - Key ID:', payload.kid);
          console.log('     ✅ 使用了新的JWT signing keys');
        } else {
          console.log('     - Key ID: 未找到');
          console.log('     ⚠️ 可能仍在使用legacy secret');
        }
      }
      
    } catch (error) {
      console.log('❌ 检查token信息失败:', error.message);
    }
    
    console.log('\n3. 测试数据库访问（即使禁用了RLS）...');
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .limit(1);
      
      if (error) {
        console.log('❌ 数据库访问失败:', error.message);
        console.log('   错误代码:', error.code);
        console.log('   错误详情:', error);
        
        console.log('\n4. 问题分析...');
        console.log('   即使禁用了RLS仍然失败，说明:');
        console.log('   a) JWT token验证失败');
        console.log('   b) JWT signing keys配置未生效');
        console.log('   c) 需要重新生成JWT token');
        
        console.log('\n5. 解决方案...');
        console.log('   步骤A: 完全退出登录');
        console.log('   步骤B: 清除所有浏览器存储');
        console.log('   步骤C: 重新登录（会生成新的JWT token）');
        console.log('   步骤D: 如果仍有问题，重启Supabase项目');
        
        console.log('\n6. 如何重启Supabase项目...');
        console.log('   访问: https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/settings/general');
        console.log('   点击 "Restart project" 按钮');
        console.log('   等待项目重启完成（通常需要1-2分钟）');
        console.log('   然后重新登录应用');
        
      } else {
        console.log('✅ 数据库访问成功！');
        console.log('   找到记录:', data.length);
        console.log('   JWT signing keys配置生效了！');
      }
      
    } catch (error) {
      console.log('❌ 数据库访问异常:', error.message);
    }
    
  } catch (error) {
    console.log('❌ 验证过程异常:', error.message);
  }
  
  console.log('\n=== 验证完成 ===');
}

verifyJWTConfiguration().catch(console.error);