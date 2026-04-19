#!/usr/bin/env node

import dotenv from 'dotenv';
import { getLocalDatabase, LocalDatabase } from './src/services/local-db.service';
import { getLocalSearchService } from './src/services/local-search.service';

// Load environment variables
dotenv.config();

/**
 * Test local database functionality
 */
async function testLocalDB() {
  console.log('========================================');
  console.log('测试本地数据库功能');
  console.log('========================================');

  try {
    // Initialize database
    console.log('\n1. 初始化数据库...');
    const db = getLocalDatabase();
    await db.init();
    console.log('✅ 数据库初始化成功');

    // Get stats
    console.log('\n2. 获取数据库统计...');
    const stats = await db.getStats();
    console.log('📊 数据库统计:');
    console.log(`   - PDF 内容: ${stats.pdfCount} 条`);
    console.log(`   - Q&A 知识: ${stats.qaCount} 条`);
    console.log(`   - 搜索缓存: ${stats.cacheCount} 条`);

    // Initialize search service
    console.log('\n3. 初始化搜索服务...');
    const searchService = getLocalSearchService();
    await searchService.init();
    console.log('✅ 搜索服务初始化成功');

    // Test search
    console.log('\n4. 测试搜索功能...');
    const testQueries = ['希塔', '疗愈', 'DNA', 'test'];

    for (const query of testQueries) {
      console.log(`\n🔍 搜索: "${query}"`);
      const result = await searchService.simpleFuzzySearch(query);

      if (result.error) {
        console.log(`❌ 错误: ${result.error}`);
      } else {
        console.log(`✅ 找到 ${result.matches.length} 个匹配项`);
        if (result.matches.length > 0) {
          result.matches.slice(0, 2).forEach((match, idx) => {
            console.log(`   ${idx + 1}. ${match.title.substring(0, 60)}...`);
          });
        }
      }
    }

    // Clear search cache
    console.log('\n5. 清除搜索缓存...');
    await searchService.clearSearchCache();
    console.log('✅ 搜索缓存已清除');

    // Close database
    console.log('\n6. 关闭数据库连接...');
    searchService.close();
    console.log('✅ 数据库连接已关闭');

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// Run test
testLocalDB();