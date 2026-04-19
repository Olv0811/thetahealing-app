#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock PDF content for testing
const mockPDFContent = [
  {
    book_id: '1',
    title: '基础 DNA 实用手册',
    content: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，达到希塔脑波状态（4-7HZ）的一种疗愈方法。希塔脑波是深度放松的状态，类似于深度睡眠或深度冥想。',
    total_pages: 245,
    file_path: '/basic-dna-manual.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    book_id: '2',
    title: '进阶 DNA 执业者指南',
    content: '信念挖掘是希塔疗愈的核心技术之一，通过挖掘潜意识的信念系统，找到影响个人成长的限制性信念。DNA激活是通过希塔疗愈技术激活个体的DNA潜能。',
    total_pages: 189,
    file_path: '/advanced-dna-practitioner.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    book_id: '3',
    title: '深度探索指南',
    content: '感觉下载是希塔疗愈的重要技术，通过下载造物主的智慧和感觉，帮助个案显化丰盛和喜悦。脉轮净化是通过能量工作净化身体的七个脉轮系统。',
    total_pages: 312,
    file_path: '/dig-deeper-guide.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    book_id: '4',
    title: '希塔疗愈知识库',
    content: '丰盛显化是通过希塔疗愈技术显化金钱、关系、健康的丰盛状态。灵魂伴侣是通过与高我连接找到合适的伴侣关系。自由意志与法则是希塔疗愈的重要法则。',
    total_pages: 423,
    file_path: '/theta-healing-knowledge-base.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Q&A knowledge
const mockQAKnowledge = [
  {
    question_number: 1,
    question: '什么是希塔疗愈？',
    answer: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，达到希塔脑波状态（4-7HZ）的一种疗愈方法。',
    source_file: 'thetahealingdatabase_complete.md',
    category: '基础知识',
    tags: ['希塔疗愈', '希塔脑波'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    question_number: 2,
    question: '希塔脑波的频率范围是多少？',
    answer: '希塔脑波的频率范围是4-7HZ。',
    source_file: 'thetahealingdatabase_complete.md',
    category: '基础知识',
    tags: ['希塔脑波', '频率'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    question_number: 3,
    question: '什么是信念挖掘？',
    answer: '信念挖掘是希塔疗愈的核心技术之一，通过挖掘潜意识的信念系统，找到影响个人成长的限制性信念。',
    source_file: 'thetahealingdatabase_complete.md',
    category: '信念挖掘',
    tags: ['信念挖掘', '潜意识'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Create mock data files for testing
 */
async function createMockData() {
  console.log('========================================');
  console.log('创建模拟数据文件用于测试');
  console.log('========================================');

  try {
    // Create mock PDF content file
    console.log('\n1. 创建模拟 PDF 内容文件...');
    const pdfData = {
      type: 'pdf_contents',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: mockPDFContent,
    };
    fs.writeFileSync('mock-pdf-data.json', JSON.stringify(pdfData, null, 2));
    console.log('✅ PDF 数据文件已创建: mock-pdf-data.json');

    // Create mock Q&A knowledge file
    console.log('\n2. 创建模拟 Q&A 知识文件...');
    const qaData = {
      type: 'qa_knowledge_base',
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: mockQAKnowledge,
    };
    fs.writeFileSync('mock-qa-data.json', JSON.stringify(qaData, null, 2));
    console.log('✅ Q&A 数据文件已创建: mock-qa-data.json');

    // Create a simple test HTML file to verify the frontend works
    console.log('\n3. 创建测试 HTML 文件...');
    const testHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>希塔疗愈知识库测试</title>
    <script type="module">
        // Simple test to verify IndexedDB works in browser
        async function testIndexedDB() {
            try {
                const request = indexedDB.open('TestDB', 1);
                request.onerror = () => console.error('IndexedDB 不可用');
                request.onsuccess = () => {
                    console.log('IndexedDB 可用');
                    const db = request.result;
                    db.close();
                };
            } catch (error) {
                console.error('IndexedDB 测试失败:', error);
            }
        }
        testIndexedDB();
    </script>
</head>
<body>
    <h1>希塔疗愈知识库测试页面</h1>
    <p>请查看控制台输出以验证 IndexedDB 功能。</p>
    <p>在浏览器中打开开发者工具（F12）查看日志。</p>
</body>
</html>
`;
    fs.writeFileSync('test-indexeddb.html', testHTML);
    console.log('✅ 测试 HTML 文件已创建: test-indexeddb.html');

    console.log('\n========================================');
    console.log('模拟数据创建完成');
    console.log('========================================');
    console.log('\n使用说明:');
    console.log('1. 启动开发服务器: npm run dev');
    console.log('2. 在浏览器中打开应用');
    console.log('3. 知识库将使用浏览器 IndexedDB 存储数据');
    console.log('4. 本地搜索功能将在浏览器中工作');

  } catch (error) {
    console.error('\n❌ 创建模拟数据时发生错误:', error);
    process.exit(1);
  }
}

// Run creation
createMockData();