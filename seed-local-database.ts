/**
 * 种子本地数据库
 * 在浏览器中运行，为 IndexedDB 添加初始数据
 */

// 示例 PDF 内容数据
const samplePDFData = [
  {
    book_id: '1',
    title: '基础 DNA 实用手册',
    content: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，达到希塔脑波状态（4-7HZ）的一种疗愈方法。希塔脑波是深度放松的状态，类似于深度睡眠或深度冥想。在希塔脑波状态下，人们更容易接受建议和改变信念。',
    total_pages: 50,
    file_path: '/basic-dna-manual.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    book_id: '2',
    title: '进阶 DNA 执业者指南',
    content: '信念挖掘是希塔疗愈的核心技术之一，通过挖掘潜意识的信念系统，找到影响个人成长的限制性信念。DNA激活是通过希塔疗愈技术激活个体的DNA潜能，帮助人们实现身心灵的和谐。',
    total_pages: 45,
    file_path: '/advanced-dna-practitioner.pdf',
    extracted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 示例 Q&A 知识数据
const sampleQAData = [
  {
    question_number: 1,
    question: '什么是希塔疗愈？',
    answer: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，达到希塔脑波状态（4-7HZ）的一种疗愈方法。',
    source_file: 'sample-knowledge.md',
    category: '基础知识',
    tags: ['希塔疗愈', '希塔脑波', '造物主'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    question_number: 2,
    question: '希塔脑波的频率范围是多少？',
    answer: '希塔脑波的频率范围是4-7HZ。这是大脑在深度放松状态下的频率，类似于深度睡眠或深度冥想。',
    source_file: 'sample-knowledge.md',
    category: '基础知识',
    tags: ['希塔脑波', '频率', '脑波'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    question_number: 3,
    question: '什么是信念挖掘？',
    answer: '信念挖掘是希塔疗愈的核心技术之一，通过挖掘潜意识的信念系统，找到影响个人成长的限制性信念。',
    source_file: 'sample-knowledge.md',
    category: '信念挖掘',
    tags: ['信念挖掘', '潜意识', '限制性信念'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 导出数据，供浏览器使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { samplePDFData, sampleQAData };
}

// 浏览器端脚本
const seedDatabaseScript = `
<script type="module">
  import { getLocalDatabase } from './src/services/local-db.service.js';

  async function seedDatabase() {
    try {
      console.log('开始为数据库添加种子数据...');

      const db = getLocalDatabase();
      await db.init();

      // 检查现有数据
      const stats = await db.getStats();
      if (stats.pdfCount > 0 || stats.qaCount > 0) {
        console.log('数据库中已有数据，跳过种子数据添加');
        return;
      }

      // 添加 PDF 内容
      console.log('添加 PDF 内容数据...');
      for (const pdf of samplePDFData) {
        await db.savePDFContent(pdf);
      }

      // 添加 Q&A 知识
      console.log('添加 Q&A 知识数据...');
      for (const qa of sampleQAData) {
        await db.saveQAKnowledge(qa);
      }

      console.log('✅ 数据库种子数据添加完成！');

      // 验证数据
      const finalStats = await db.getStats();
      console.log('数据库统计:', finalStats);
    } catch (error) {
      console.error('❌ 添加种子数据失败:', error);
    }
  }

  // 页面加载时自动执行
  window.addEventListener('load', () => {
    console.log('页面加载完成，开始初始化数据库...');
    seedDatabase();
  });
</script>
`;