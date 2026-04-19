/**
 * Q&A 知识库导入脚本 (JavaScript 版本)
 * 
 * 将 thetahealingdatabase_complete.md 文件导入到数据库中
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env' });

// Q&A 知识库文件路径（使用绝对路径）
const QA_FILE_PATH = 'D:/claude proj/thetahealing/thetahealingdatabase_complete.md';

/**
 * 解析 Q&A 格式的 markdown 文本
 */
function parseQAMarkdown(content, sourceFile) {
  const qaItems = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // 匹配格式：Q数字: 问题 A数字: 答案; 或 Q数字: 问题 A数字: 答案。
    // 修复：分号可选，支持多种结尾符号
    const qaMatch = line.match(/^Q(\d+):\s*(.+?)\s+A(\d+):\s*(.+?)[;。]$/);
    
    if (qaMatch) {
      const questionNumber = parseInt(qaMatch[1]);
      const question = qaMatch[2].trim();
      const answer = qaMatch[4].trim();
      
      // 简单的分类逻辑
      const category = categorizeQuestion(question);
      const tags = extractTags(question, answer);
      
      qaItems.push({
        questionNumber,
        question,
        answer,
        category,
        tags
      });
    }
  }
  
  return qaItems;
}

/**
 * 根据问题内容自动分类
 */
function categorizeQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('希塔') || lowerQuestion.includes('脑波') || lowerQuestion.includes('疗愈')) {
    return '基础知识';
  } else if (lowerQuestion.includes('挖掘') || lowerQuestion.includes('信念') || lowerQuestion.includes('潜意识')) {
    return '信念挖掘';
  } else if (lowerQuestion.includes('下载') || lowerQuestion.includes('感觉') || lowerQuestion.includes('显化')) {
    return '感觉下载';
  } else if (lowerQuestion.includes('DNA') || lowerQuestion.includes('基因') || lowerQuestion.includes('激活')) {
    return 'DNA激活';
  } else if (lowerQuestion.includes('脉轮') || lowerQuestion.includes('能量') || lowerQuestion.includes('净化')) {
    return '能量工作';
  } else if (lowerQuestion.includes('金钱') || lowerQuestion.includes('丰盛') || lowerQuestion.includes('成功')) {
    return '丰盛显化';
  } else if (lowerQuestion.includes('灵魂') || lowerQuestion.includes('伴侣') || lowerQuestion.includes('关系')) {
    return '关系与灵魂';
  } else if (lowerQuestion.includes('高我') || lowerQuestion.includes('造物主') || lowerQuestion.includes('连接')) {
    return '灵性连接';
  } else if (lowerQuestion.includes('健康') || lowerQuestion.includes('疾病') || lowerQuestion.includes('身体')) {
    return '健康疗愈';
  }
  
  return '其他';
}

/**
 * 提取关键词标签
 */
function extractTags(question, answer) {
  const text = (question + ' ' + answer).toLowerCase();
  const tags = [];
  
  // 常见关键词
  const keywords = [
    '希塔脑波', '造物主', '潜意识', '信念', '挖掘', 
    '下载', '感觉', 'DNA', '激活', '脉轮', 
    '能量', '净化', '丰盛', '显化', '金钱',
    '灵魂', '伴侣', '高我', '连接', '健康',
    '疗愈', '疾病', '身体', '自由意志', '法则'
  ];
  
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      tags.push(keyword);
    }
  }
  
  return tags.length > 0 ? tags : ['通用'];
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('开始导入 Q&A 知识库');
  console.log('========================================\n');

  try {
    // 1. 检查文件是否存在
    if (!fs.existsSync(QA_FILE_PATH)) {
      console.error(`❌ 文件不存在: ${QA_FILE_PATH}`);
      process.exit(1);
    }

    console.log(`📖 读取文件: ${QA_FILE_PATH}`);

    // 2. 读取文件内容
    const content = fs.readFileSync(QA_FILE_PATH, 'utf-8');
    const fileName = path.basename(QA_FILE_PATH);

    console.log(`✅ 文件读取成功，内容长度: ${content.length} 字符\n`);

    // 3. 解析 Q&A 内容
    console.log('🔍 解析 Q&A 内容...');
    const qaItems = parseQAMarkdown(content, fileName);

    console.log(`✅ 解析完成: ${qaItems.length} 个问答对\n`);

    // 显示前 3 个示例
    if (qaItems.length > 0) {
      console.log('📋 示例问答:');
      qaItems.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. Q${item.questionNumber}: ${item.question.substring(0, 50)}...`);
        console.log(`      A${item.questionNumber}: ${item.answer.substring(0, 50)}...`);
        console.log(`      分类: ${item.category}, 标签: ${item.tags?.join(', ')}`);
        console.log();
      });
    }

    // 4. 显示准备好的数据统计
    console.log('📊 数据统计:');
    const categoryStats = new Map();
    qaItems.forEach(item => {
      const category = item.category || '未分类';
      categoryStats.set(category, (categoryStats.get(category) || 0) + 1);
    });

    Array.from(categoryStats.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} 个`);
      });

    console.log('\n✅ Q&A 知识库解析完成！');
    console.log('💡 下一步: 需要通过 Supabase SQL 执行数据库迁移，然后使用 TypeScript 脚本导入数据');
    console.log('\n📝 数据库迁移文件: supabase/migrations/003_add_qa_knowledge_base.sql');
    console.log('📝 导入脚本: import-qa-knowledge.ts');
    console.log('📝 服务文件: src/services/qa-knowledge.service.ts');

  } catch (error) {
    console.error('\n❌ 解析过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
main();