// 检查Supabase中实际的RLS策略
import { createClient } from '@supabase/supabase-js';

// 使用SERVICE_ROLE KEY进行诊断
const SUPABASE_URL = 'https://cbwxsmtfgxwotwudpkfe.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid3hzbXRmZ3h3b3R3dWRwa2ZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI5MjE2NiwiZXhwIjoyMDg1ODY4MTY2fQ.uvhe-0fl5QGse653rIN4g_Rp_iR2WAZtpZsjBNs3WTo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
});

console.log('=== 检查实际的RLS策略 ===\n');

async function checkRLSPolicies() {
  console.log('1. 检查 journal_entries 表的RLS状态...');
  
  try {
    // 检查RLS是否启用
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'journal_entries' });
    
    if (rlsError) {
      console.log('❌ 检查RLS状态失败:', rlsError.message);
      console.log('   使用备用方法...');
      
      // 备用方法：直接查询系统表
      const { data: tables } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', 'journal_entries')
        .single();
      
      if (tables) {
        console.log('   RLS状态:', tables.rowsecurity ? '✅ 已启用' : '❌ 未启用');
      }
    } else {
      console.log('   RLS状态:', rlsStatus ? '✅ 已启用' : '❌ 未启用');
    }
    
    console.log('\n2. 检查现有的RLS策略...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'journal_entries');
    
    if (policiesError) {
      console.log('❌ 检查策略失败:', policiesError.message);
    } else {
      if (policies && policies.length > 0) {
        console.log(`   找到 ${policies.length} 个策略:`);
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname}`);
          console.log(`      - 命令: ${policy.cmd}`);
          console.log(`      - 角色: ${policy.roles}`);
          console.log(`      - 使用条件: ${policy.qual || '无'}`);
          console.log(`      - 检查条件: ${policy.with_check || '无'}`);
        });
      } else {
        console.log('   ❌ 没有找到任何RLS策略！');
        console.log('   这就是问题所在：表启用了RLS但没有策略');
      }
    }
    
    console.log('\n3. 诊断结果...');
    if (!policies || policies.length === 0) {
      console.log('   🔴 问题确认：RLS已启用但没有策略');
      console.log('   🔧 解决方案：创建RLS策略');
      
      console.log('\n4. 创建策略SQL...');
      console.log('   请在Supabase SQL Editor中执行以下SQL:');
      console.log('   https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql/new');
      console.log('');
      console.log('   -- 确保RLS启用');
      console.log('   ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('   -- 创建必要的策略');
      console.log('   CREATE POLICY "journal_entries_select_policy"');
      console.log('     ON journal_entries');
      console.log('     FOR SELECT');
      console.log('     TO authenticated');
      console.log('     USING (auth.uid() = user_id);');
      console.log('');
      console.log('   CREATE POLICY "journal_entries_insert_policy"');
      console.log('     ON journal_entries');
      console.log('     FOR INSERT');
      console.log('     TO authenticated');
      console.log('     WITH CHECK (auth.uid() = user_id);');
      console.log('');
      console.log('   CREATE POLICY "journal_entries_update_policy"');
      console.log('     ON journal_entries');
      console.log('     FOR UPDATE');
      console.log('     TO authenticated');
      console.log('     USING (auth.uid() = user_id)');
      console.log('     WITH CHECK (auth.uid() = user_id);');
      console.log('');
      console.log('   CREATE POLICY "journal_entries_delete_policy"');
      console.log('     ON journal_entries');
      console.log('     FOR DELETE');
      console.log('     TO authenticated');
      console.log('     USING (auth.uid() = user_id);');
      
    } else {
      console.log('   ✅ 策略存在');
      console.log('   🔍 可能的问题:');
      console.log('   a) 策略配置错误');
      console.log('   b) 用户会话问题');
      console.log('   c) 用户Profile问题');
    }
    
  } catch (error) {
    console.log('❌ 诊断异常:', error.message);
  }
  
  console.log('\n=== 诊断完成 ===');
}

checkRLSPolicies().catch(console.error);