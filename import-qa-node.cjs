#!/usr/bin/env node

/**
 * Q&A 知识库导入脚本（Node.js版本）
 * 将 thetahealingdatabase_complete.md 文件导入到Supabase数据库
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  console.error('请检查 .env 文件是否存在于当前目录');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 解析 Q&A 格式的 markdown 文本
 */
function parseQAMarkdown(content, sourceFile) {
  const qaItems = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // 匹配格式：Q数字: 问题 A数字: 答案;
    const qaMatch = line.match(/^Q(\d+):\s*(.+?)\s+A(\d+):\s*(.+?);$/);

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
 * 保存 Q&A 内容到数据库
 */
async function saveQAKnowledge(data, sourceFile) {
  try {
    const { error } = await supabase
      .from('qa_knowledge_base')
      .upsert({
        question_number: data.questionNumber,
        question: data.question,
        answer: data.answer,
        source_file: sourceFile,
        category: data.category,
        tags: data.tags,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'question_number',
      });

    if (error) {
      console.error(`保存 Q${data.questionNumber} 失败:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`保存 Q${data.questionNumber} 时发生错误:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 批量保存 Q&A 内容
 */
async function saveMultipleQA(items, sourceFile) {
  let success = 0;
  let failed = 0;
  const errors = [];

  for (const item of items) {
    const result = await saveQAKnowledge(item, sourceFile);
    if (result.success) {
      success++;
      if (success % 50 === 0) {
        console.log(`✅ 已导入 ${success} 个问答对...`);
      }
    } else {
      failed++;
      errors.push(`Q${item.questionNumber}: ${result.error}`);
    }
  }

  return { success, failed, errors };
}

/**
 * 获取所有 Q&A 内容
 */
async function getAllQAKnowledge() {
  try {
    const { data, error } = await supabase
      .from('qa_knowledge_base')
      .select('*')
      .order('question_number');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

/**
 * 清空所有 Q&A 内容
 */
async function clearAllQA() {
  try {
    const { error } = await supabase
      .from('qa_knowledge_base')
      .delete()
      .neq('question_number', 0);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('Q&A 知识库导入工具');
  console.log('========================================\n');

  try {
    // 1. 检查文件
    const qaFilePath = path.join(__dirname, '../thetahealingdatabase_complete.md');
    if (!fs.existsSync(qaFilePath)) {
      console.error(`❌ 文件不存在: ${qaFilePath}`);
      console.error('请确保 thetahealingdatabase_complete.md 文件存在于上级目录');
      process.exit(1);
    }

    console.log(`📖 读取文件: ${qaFilePath}`);
    const content = fs.readFileSync(qaFilePath, 'utf-8');
    const fileName = path.basename(qaFilePath);
    console.log(`✅ 文件读取成功，内容长度: ${content.length} 字符\n`);

    // 2. 解析 Q&A 内容
    console.log('🔍 解析 Q&A 内容...');
    const qaItems = parseQAMarkdown(content, fileName);
    console.log(`✅ 解析完成: ${qaItems.length} 个问答对\n`);

    // 显示前 3 个示例
    if (qaItems.length > 0) {
      console.log('📋 示例问答:');
      qaItems.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. Q${item.questionNumber}: ${item.question.substring(0, 50)}...`);
        console.log(`      分类: ${item.category}, 标签: ${item.tags?.join(', ')}`);
        console.log();
      });
    }

    // 3. 检查现有数据
    console.log('🔍 检查现有数据库内容...');
    const { data: existingData } = await getAllQAKnowledge();
    const existingCount = existingData?.length || 0;

    if (existingCount > 0) {
      console.log(`⚠️  数据库中已存在 ${existingCount} 个问答对`);
      if (process.argv.includes('--clear')) {
        console.log('🗑️  清空现有数据...');
        await clearAllQA();
        console.log('✅ 数据已清空\n');
      } else {
        console.log('💡 使用 --clear 参数清空现有数据\n');
      }
    } else {
      console.log('✅ 数据库为空，准备导入新数据\n');
    }

    // 4. 确认导入
    if (!process.argv.includes('--confirm')) {
      console.log('💡 使用 --confirm 参数确认导入');
      console.log('   例如: node import-qa-node.cjs --confirm --clear');
      process.exit(0);
    }

    console.log('🔄 开始导入数据到数据库...\n');

    // 5. 导入数据
    const result = await saveMultipleQA(qaItems, fileName);

    // 6. 显示结果
    console.log('\n========================================');
    console.log('导入完成');
    console.log('========================================');
    console.log(`✅ 成功: ${result.success} 个`);
    console.log(`❌ 失败: ${result.failed} 个`);

    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      result.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   ... 还有 ${result.errors.length - 5} 个错误`);
      }
    }

    // 7. 验证导入结果
    const { data: finalData } = await getAllQAKnowledge();
    const finalCount = finalData?.length || 0;
    console.log(`\n📊 数据库中总计: ${finalCount} 个问答对`);

    // 8. 显示分类统计
    const categoryStats = new Map();
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

    // 9. 检查第五界相关问题
    const fifthWorldQAs = finalData?.filter(item =>
      item.question.includes('第五界') || item.answer.includes('第五界')
    ) || [];

    console.log(`\n🌌 第五界相关问题: ${fifthWorldQAs.length} 个`);
    fifthWorldQAs.forEach(qa => {
      console.log(`   Q${qa.question_number}: ${qa.question}`);
    });

    console.log('\n✅ Q&A 知识库导入完成！');

  } catch (error) {
    console.error('\n❌ 导入过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
main();