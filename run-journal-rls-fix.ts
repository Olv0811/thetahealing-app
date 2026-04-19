import { supabase } from './src/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('开始执行 journal_entries RLS 修复迁移...');

    // 读取 SQL 文件
    const sqlPath = join(__dirname, 'supabase', 'migrations', '004_fix_journal_rls.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('SQL 文件内容:');
    console.log(sql);
    console.log('\n开始执行...');

    // 执行 SQL (注意：这需要 service role key，普通的 anon key 可能无法执行 DDL)
    // 如果这个失败，需要手动在 Supabase 仪表板中执行

    console.log('\n重要提示：');
    console.log('1. 如果你有 service role key，请在 .env 文件中添加 VITE_SUPABASE_SERVICE_ROLE_KEY');
    console.log('2. 然后使用 service role key 来执行这个迁移');
    console.log('3. 或者手动在 Supabase 仪表板的 SQL Editor 中执行上述 SQL');

    // 尝试使用当前客户端执行（可能会失败）
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('执行失败（预期中，因为 anon key 可能没有 DDL 权限）:', error);
      console.log('\n请手动在 Supabase 仪表板中执行 SQL:');
      console.log('1. 访问 https://supabase.com/dashboard/project/cbwxsmtfgxwotwudpkfe/sql');
      console.log('2. 复制并执行 supabase/migrations/004_fix_journal_rls.sql 中的 SQL');
    } else {
      console.log('执行成功:', data);
    }

  } catch (error) {
    console.error('迁移执行失败:', error);
  }
}

runMigration();