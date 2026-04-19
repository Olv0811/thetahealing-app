import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface PDFTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

export interface PDFPageContent {
  pageNumber: number;
  text: string;
  items: PDFTextItem[];
}

export interface PDFExtractResult {
  bookId: string;
  title: string;
  content: string;
  totalPages: number;
  pages: PDFPageContent[];
  extractedAt: Date;
}

/**
 * 从 PDF 文件提取文本内容
 */
export async function extractTextFromPDF(
  fileUrl: string,
  bookId: string,
  title: string
): Promise<PDFExtractResult> {
  console.log('开始提取 PDF 文本:', { bookId, title, fileUrl });

  try {
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const pages: PDFPageContent[] = [];
    let fullContent = '';

    // 逐页提取文本
    for (let i = 1; i <= totalPages; i++) {
      console.log(`正在提取第 ${i}/${totalPages} 页...`);

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // 提取文本项
      const items: PDFTextItem[] = textContent.items.map((item: any) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      }));

      // 提取纯文本
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({
        pageNumber: i,
        text: pageText,
        items,
      });

      fullContent += `\n\n--- 第 ${i} 页 ---\n\n${pageText}`;
    }

    console.log('PDF 文本提取完成:', {
      bookId,
      totalPages,
      contentLength: fullContent.length,
    });

    return {
      bookId,
      title,
      content: fullContent.trim(),
      totalPages,
      pages,
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error('PDF 文本提取失败:', error);
    throw new Error(`PDF 文本提取失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量提取多个 PDF 文件的文本
 */
export async function extractMultiplePDFs(
  pdfList: Array<{ bookId: string; title: string; fileUrl: string }>
): Promise<PDFExtractResult[]> {
  const results: PDFExtractResult[] = [];

  for (const pdf of pdfList) {
    try {
      const result = await extractTextFromPDF(pdf.fileUrl, pdf.bookId, pdf.title);
      results.push(result);
    } catch (error) {
      console.error(`提取 PDF 失败: ${pdf.title}`, error);
    }
  }

  return results;
}
