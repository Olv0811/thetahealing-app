#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseQAMarkdown, saveMultipleQA, getAllQAKnowledge, clearAllQA } from './src/services/qa-knowledge-local.service';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Q&A knowledge file path
const QA_FILE_PATH = path.join(__dirname, '../thetahealingdatabase_complete.md');

/**
 * Main function
 */
async function main() {
  console.log('========================================');
  console.log('开始导入 Q&A 知识库到本地数据库');
  console.log('========================================\n');

  try {
    // 1. Check if file exists
    if (!fs.existsSync(QA_FILE_PATH)) {
      console.error(`❌ 文件不存在: ${QA_FILE_PATH}`);
      process.exit(1);
    }

    console.log(`📖 读取文件: ${QA_FILE_PATH}`);

    // 2. Read file content
    const content = fs.readFileSync(QA_FILE_PATH, 'utf-8');
    const fileName = path.basename(QA_FILE_PATH);

    console.log(`✅ 文件读取成功，内容长度: ${content.length} 字符\n`);

    // 3. Parse Q&A content
    console.log('🔍 解析 Q&A 内容...');
    const qaItems = parseQAMarkdown(content, fileName);

    console.log(`✅ 解析完成: ${qaItems.length} 个问答对\n`);

    // Display first 3 examples
    if (qaItems.length > 0) {
      console.log('📋 示例问答:');
      qaItems.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. Q${item.questionNumber}: ${item.question.substring(0, 50)}...`);
        console.log(`      A${item.questionNumber}: ${item.answer.substring(0, 50)}...`);
        console.log(`      分类: ${item.category}, 标签: ${item.tags?.join(', ')}`);
        console.log();
      });
    }

    // 4. Check existing data
    console.log('🔍 检查现有数据库内容...');
    const { data: existingData } = await getAllQAKnowledge();
    const existingCount = existingData?.length || 0;

    if (existingCount > 0) {
      console.log(`⚠️  数据库中已存在 ${existingCount} 个问答对`);
      console.log('提示: 如果需要清空现有数据，请手动删除或使用 clearAllQA 函数\n');
    } else {
      console.log('✅ 数据库为空，准备导入新数据\n');
    }

    // 5. Ask for confirmation (unless --confirm flag is present)
    if (process.argv.includes('--confirm')) {
      console.log('🔄 开始导入数据到数据库...\n');
    } else {
      console.log('💡 提示: 使用 --confirm 参数自动确认导入');
      console.log('   例如: npm run -- tsx import-qa-to-localdb.ts --confirm\n');
      console.log('🚀 正在导入数据...\n');
    }

    // 6. Import data
    const result = await saveMultipleQA(qaItems, fileName);

    // 7. Display results
    console.log('========================================');
    console.log('导入完成');
    console.log('========================================');
    console.log(`✅ 成功: ${result.success} 个`);
    console.log(`❌ 失败: ${result.failed} 个`);

    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // 8. Verify import result
    const { data: finalData } = await getAllQAKnowledge();
    const finalCount = finalData?.length || 0;
    console.log(`\n📊 数据库中总计: ${finalCount} 个问答对`);

    // 9. Show category statistics
    const categoryStats = new Map<string, number>();
    finalData?.forEach(item => {
      const category = item.category || '未分类';
      categoryStats.set(category, (categoryStats.get(category) || 0) + 1);
    });

    if (categoryStats.size > 0) {
      console.log('\n📁 分类统计:');
      Array.from(categoryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} 个`);
        });
    }

    console.log('\n✅ Q&A 知识库导入完成！');

  } catch (error) {
    console.error('\n❌ 导入过程中发生错误:', error);
    process.exit(1);
  }
}

// Run main function
main();