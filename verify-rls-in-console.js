// 快速验证RLS修复是否成功
console.log('=== 验证RLS修复状态 ===\n');

// 在浏览器控制台中复制并执行这段代码
// 按F12打开控制台，粘贴下面的代码，按Enter执行

async function verifyRLSFix() {
  console.log('开始验证RLS修复...');
  
  try {
    // 1. 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ 用户未登录，请先在应用中重新登录');
      return;
    }
    
    console.log('✅ 用户已登录:', user.email);
    console.log('   用户ID:', user.id);
    
    // 2. 测试日记访问
    console.log('\n测试 journal_entries 访问...');
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .limit(5);
    
    if (error) {
      console.log('❌ 访问失败:', error.message);
      console.log('   错误代码:', error.code);
      console.log('   错误详情:', error);
      console.log('\n问题分析:');
      console.log('   - SQL脚本可能没有正确执行');
      console.log('   - 需要重新执行SQL脚本');
      console.log('   - 或者需要刷新应用页面');
    } else {
      console.log('✅ 访问成功！');
      console.log('   找到记录数:', data.length);
      if (data.length > 0) {
        console.log('   最新记录:');
        data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.title || '无标题'} (${new Date(item.created_at).toLocaleString()})`);
        });
      }
      console.log('\n🎉 RLS修复成功！应用应该可以正常工作了');
    }
    
  } catch (error) {
    console.log('❌ 验证过程异常:', error.message);
    console.log('   异常详情:', error);
  }
  
  console.log('\n=== 验证完成 ===');
}

// 执行验证
verifyRLSFix();