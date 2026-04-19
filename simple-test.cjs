#!/usr/bin/env node

// 简单的搜索测试脚本
// 直接检查Q&A数据导入和搜索逻辑

const fs = require('fs');
const path = require('path');

// 检查thetahealingdatabase_complete.md文件
const dbFile = path.join(__dirname, '../thetahealingdatabase_complete.md');
console.log('1. 检查知识库文件...');
console.log(`文件路径: ${dbFile}`);
console.log(`文件存在: ${fs.existsSync(dbFile)}`);

if (fs.existsSync(dbFile)) {
  const content = fs.readFileSync(dbFile, 'utf-8');
  console.log(`文件大小: ${content.length} 字符`);
  console.log(`包含的问答对数量: ${content.split(/Q\d+:/).length - 1}`);

  // 检查是否包含"第五界"
  if (content.includes('第五界')) {
    console.log('✅ 文件包含"第五界"相关内容');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('第五界')) {
        console.log(`  第${idx + 1}行: ${line.trim()}`);
      }
    });
  } else {
    console.log('❌ 文件不包含"第五界"相关内容');
  }

  // 显示Q24和Q25
  console.log('\n2. 检查Q24-Q25（第五界相关问题）...');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/Q2[45]:/)) {
      console.log(`  ${lines[i].trim()}`);
      if (i + 1 < lines.length && lines[i + 1].match(/A2[45]:/)) {
        console.log(`  ${lines[i + 1].trim()}`);
      }
    }
  }
}

// 检查mock-qa-data.json
const mockFile = path.join(__dirname, 'mock-qa-data.json');
console.log('\n3. 检查mock-qa-data.json...');
console.log(`文件存在: ${fs.existsSync(mockFile)}`);

if (fs.existsSync(mockFile)) {
  const mockData = JSON.parse(fs.readFileSync(mockFile, 'utf-8'));
  console.log(`数据条数: ${mockData.data.length}`);

  // 查找第五界相关问题
  const fifthWorldQAs = mockData.data.filter(item =>
    item.question.includes('第五界') || item.answer.includes('第五界')
  );

  if (fifthWorldQAs.length > 0) {
    console.log(`✅ 找到 ${fifthWorldQAs.length} 个关于第五界的Q&A:`);
    fifthWorldQAs.forEach(qa => {
      console.log(`  Q${qa.question_number}: ${qa.question}`);
      console.log(`  A${qa.question_number}: ${qa.answer}`);
    });
  } else {
    console.log('❌ 没有找到关于第五界的Q&A');
    console.log('所有Q&A:');
    mockData.data.forEach(qa => {
      console.log(`  Q${qa.question_number}: ${qa.question.substring(0, 50)}...`);
    });
  }
}

console.log('\n4. 分析搜索逻辑问题...');
console.log(`
可能的问题原因：
1. 数据未正确导入到IndexedDB
2. 搜索算法的分词逻辑问题
3. 中文搜索的特殊字符处理
4. 缓存问题

建议的解决方案：
1. 使用浏览器打开test-search.html进行调试
2. 检查IndexedDB中的实际数据
3. 优化搜索算法对中文问题的处理
`);