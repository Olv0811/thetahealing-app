import { supabase } from './src/lib/supabase';

async function diagnoseDatabase() {
  console.log('=== 数据库诊断工具 ===\n');

  try {
    // 1. 检查当前用户
    console.log('1. 检查当前用户...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ 获取用户失败:', userError);
      return;
    }

    if (!user) {
      console.log('❌ 用户未登录');
      console.log('请先登录后再运行此诊断工具');
      return;
    }

    console.log(`✅ 用户已登录: ${user.email}`);
    console.log(`   用户ID: ${user.id}\n`);

    // 2. 检查 profile 表
    console.log('2. 检查用户 profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ 查询 profile 失败:', profileError);
      console.log('   这可能意味着 profile 不存在或 RLS 策略有问题');
    } else {
      console.log('✅ 用户 profile 存在');
      console.log('   Profile 数据:', profile);
    }
    console.log();

    // 3. 检查 journal_entries 表是否存在
    console.log('3. 检查 journal_entries 表...');
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (entriesError) {
        console.error('❌ 查询 journal_entries 失败:', entriesError);
        console.log('   错误代码:', entriesError.code);
        console.log('   错误信息:', entriesError.message);

        if (entriesError.code === '42P01') {
          console.log('   💡 表不存在！需要运行数据库迁移');
        } else if (entriesError.code === '42501') {
          console.log('   💡 权限被拒绝！RLS 策略配置有问题');
        }
      } else {
        console.log(`✅ journal_entries 表可访问`);
        console.log(`   找到 ${entries.length} 条记录`);
      }
    } catch (error: any) {
      console.error('❌ 查询出错:', error.message);
    }
    console.log();

    // 4. 检查 RLS 策略
    console.log('4. RLS 策略诊断建议...');
    console.log('请手动在 Supabase SQL Editor 中执行以下 SQL 来检查 RLS 策略:');
    console.log(`
-- 检查 journal_entries 表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'journal_entries';

-- 检查 RLS 是否启用
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'journal_entries';

-- 检查当前用户的 ID
SELECT auth.uid();
    `);
    console.log();

    // 5. 提供修复方案
    console.log('5. 修复建议...');
    console.log('如果遇到权限问题，请在 Supabase SQL Editor 中执行以下 SQL:');
    console.log(`
-- 完全重新配置 journal_entries 的 RLS 策略
-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "Users can view own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

-- 2. 启用 RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- 3. 创建新的策略
CREATE POLICY "Users can view own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. 验证策略
SELECT * FROM pg_policies WHERE tablename = 'journal_entries';
    `);
    console.log();

    console.log('=== 诊断完成 ===');

  } catch (error: any) {
    console.error('诊断过程中出错:', error);
  }
}

// 运行诊断
diagnoseDatabase();