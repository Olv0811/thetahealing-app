#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromPDF } from './src/services/pdf-extract.service';
import { getLocalDatabase, PDFContent } from './src/services/local-db.service';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF file mapping
const PDF_FILE_MAP: Record<string, string> = {
  '1': '/basic-dna-manual.pdf',
  '2': '/advanced-dna-practitioner.pdf',
  '3': '/dig-deeper-guide.pdf',
  '4': '/theta-healing-knowledge-base.pdf',
};

// Book metadata
const BOOKS = [
  { id: '1', title: '基础 DNA 实用手册' },
  { id: '2', title: '进阶 DNA 执业者指南' },
  { id: '3', title: '深度探索指南' },
  { id: '4', title: '希塔疗愈知识库' },
];

/**
 * Import all PDF content to local database
 */
async function importPDFContent() {
  console.log('========================================');
  console.log('开始导入 PDF 内容到本地数据库');
  console.log('========================================');

  const startTime = Date.now();
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    totalBytes: 0,
    errors: [] as Array<{ bookId: string; title: string; error: string }>,
  };

  // Initialize local database
  const db = getLocalDatabase();
  await db.init();

  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i];
    const pdfFile = PDF_FILE_MAP[book.id];

    if (!pdfFile) {
      console.log(`⚠️  跳过 ${book.title}：未找到 PDF 文件映射`);
      results.skipped++;
      continue;
    }

    // Construct full file path
    const pdfPath = path.join(__dirname, 'public', pdfFile);

    if (!fs.existsSync(pdfPath)) {
      console.log(`⚠️  跳过 ${book.title}：PDF 文件不存在 - ${pdfPath}`);
      results.skipped++;
      continue;
    }

    try {
      // Check if already exists
      const exists = await db.getPDFContent(book.id);
      if (exists) {
        console.log(`⏭️  [${i + 1}/${BOOKS.length}] 跳过 ${book.title}：已存在于数据库`);
        results.skipped++;
        continue;
      }

      console.log(`\n📖 [${i + 1}/${BOOKS.length}] 正在提取：${book.title}`);
      console.log(`   文件路径：${pdfPath}`);

      const pageStartTime = Date.now();

      // Extract PDF text
      const extractResult = await extractTextFromPDF(pdfPath, book.id, book.title);

      const pageEndTime = Date.now();
      const pageDuration = ((pageEndTime - pageStartTime) / 1000).toFixed(2);

      console.log(`✅ 提取成功（耗时：${pageDuration}秒）`);
      console.log(`   总页数：${extractResult.totalPages}`);
      console.log(`   内容长度：${extractResult.content.length.toLocaleString()} 字符`);

      results.totalBytes += extractResult.content.length;

      // Save to local database
      const pdfContent: PDFContent = {
        book_id: book.id,
        title: book.title,
        content: extractResult.content,
        total_pages: extractResult.totalPages,
        file_path: pdfPath,
        extracted_at: extractResult.extractedAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saveStartTime = Date.now();
      await db.savePDFContent(pdfContent);
      const saveEndTime = Date.now();
      const saveDuration = ((saveEndTime - saveStartTime) / 1000).toFixed(2);

      console.log(`✅ 保存成功（耗时：${saveDuration}秒）`);
      results.success++;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error(`❌ 处理失败：${book.title}`);
      console.error(`   错误：${error instanceof Error ? error.message : '未知错误'}`);
      results.failed++;
      results.errors.push({
        bookId: book.id,
        title: book.title,
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n========================================');
  console.log('PDF 内容导入完成');
  console.log('========================================');
  console.log(`✅ 成功：${results.success} 个`);
  console.log(`❌ 失败：${results.failed} 个`);
  console.log(`⏭️  跳过：${results.skipped} 个`);
  console.log(`📊 总耗时：${totalDuration} 秒`);
  console.log(`💾 总字符数：${results.totalBytes.toLocaleString()}`);

  if (results.errors.length > 0) {
    console.log('\n错误详情：');
    results.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.title} (${err.bookId})`);
      console.log(`   错误：${err.error}`);
    });
  }

  console.log('========================================');
}

// Run import
importPDFContent().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});