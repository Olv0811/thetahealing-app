import { supabase } from '../lib/supabase';
import type { PDFExtractResult } from './pdf-extract.service';

export interface PDFContent {
  id: string;
  book_id: string;
  title: string;
  content: string;
  total_pages: number;
  file_path: string;
  extracted_at: string;
  updated_at: string;
}

/**
 * 保存 PDF 内容到数据库
 */
export async function savePDFContent(data: PDFExtractResult): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('保存 PDF 内容到数据库:', data.bookId);

    const { error } = await supabase
      .from('pdf_contents')
      .upsert(
        {
          book_id: data.bookId,
          title: data.title,
          content: data.content,
          total_pages: data.totalPages,
          file_path: `/book-${data.bookId}.pdf`, // 简化的文件路径
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'book_id',
        }
      );

    if (error) {
      console.error('保存 PDF 内容失败:', error);
      return { success: false, error: error.message };
    }

    console.log('PDF 内容保存成功:', data.bookId);
    return { success: true };
  } catch (error) {
    console.error('保存 PDF 内容时发生错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 获取所有 PDF 内容
 */
export async function getAllPDFContents(): Promise<{ data: PDFContent[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('pdf_contents')
      .select('*')
      .order('title');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 根据书籍 ID 获取 PDF 内容
 */
export async function getPDFContentByBookId(bookId: string): Promise<{ data: PDFContent | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('pdf_contents')
      .select('*')
      .eq('book_id', bookId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 全文搜索 PDF 内容（优化版本）
 */
export async function searchPDFContents(query: string): Promise<{ data: PDFContent[] | null; error?: string }> {
  try {
    // 如果查询太短，直接返回空结果
    if (query.trim().length < 2) {
      return { data: [] };
    }

    // 使用 PostgreSQL 的全文搜索，限制结果数量
    const { data, error } = await supabase
      .from('pdf_contents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('title')
      .limit(10); // 限制最多返回 10 条结果

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 检查 PDF 内容是否存在
 */
export async function checkPDFContentExists(bookId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('pdf_contents')
      .select('id')
      .eq('book_id', bookId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 删除 PDF 内容
 */
export async function deletePDFContent(bookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('pdf_contents')
      .delete()
      .eq('book_id', bookId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}