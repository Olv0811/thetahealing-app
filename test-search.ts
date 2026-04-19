#!/usr/bin/env node

import { simpleFuzzySearch } from './src/services/simple-search.service.ts';

async function testSearch() {
  console.log('========================================');
  console.log('测试希塔疗愈知识库搜索功能');
  console.log('========================================\n');

  const testQueries = [
    '什么是希塔疗愈？',
    '希塔脑波频率',
    '信念挖掘',
    '肌肉测试',
    '细胞对话',
    'DNA激活',
    '脉轮',
    '显化',
    '丰盛',
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 测试查询: "${query}"`);
    console.log('─'.repeat(50));

    try {
      const { matches, error } = await simpleFuzzySearch(query);

      if (error) {
        console.error(`❌ 错误: ${error}`);
        continue;
      }

      if (matches.length === 0) {
        console.log('⚠️  没有找到匹配项');
        continue;
      }

      console.log(`✅ 找到 ${matches.length} 个匹配项:\n`);

      matches.forEach((item, index) => {
        console.log(`   ${index + 1}. 问题: ${item.title}`);
        console.log(`      答案: ${item.snippet}`);
        console.log(`      相关性: ${(item.relevanceScore * 10).toFixed(1)}% | 来源: ${item.bookTitle}`);
        if (item.keywords.length > 0) {
          console.log(`      关键词: ${item.keywords.join(', ')}`);
        }
        console.log();
      });
    } catch (err) {
      console.error(`❌ 搜索时发生错误:`, err);
    }
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 运行测试
testSearch().catch(console.error);
