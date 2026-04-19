import { supabase } from '../lib/supabase';

export interface QAKnowledge {
  id: string;
  question_number: number;
  question: string;
  answer: string;
  source_file: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface QAParseResult {
  questionNumber: number;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

/**
 * 解析 Q&A 格式的 markdown 文本
 */
export function parseQAMarkdown(content: string, sourceFile: string): QAParseResult[] {
  const qaItems: QAParseResult[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // 匹配格式：Q数字: 问题 A数字: 答案;
    const qaMatch = line.match(/^Q(\d+):\s*(.+?)\s+A(\d+):\s*(.+?);$/);
    
    if (qaMatch) {
      const questionNumber = parseInt(qaMatch[1]);
      const question = qaMatch[2].trim();
      const answer = qaMatch[4].trim();
      
      // 简单的分类逻辑（可以根据问题内容自动分类）
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
function categorizeQuestion(question: string): string {
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
function extractTags(question: string, answer: string): string[] {
  const text = (question + ' ' + answer).toLowerCase();
  const tags: string[] = [];
  
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
export async function saveQAKnowledge(data: QAParseResult, sourceFile: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('qa_knowledge_base')
      .upsert(
        {
          question_number: data.questionNumber,
          question: data.question,
          answer: data.answer,
          source_file: sourceFile,
          category: data.category,
          tags: data.tags,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'question_number',
        }
      );

    if (error) {
      console.error('保存 Q&A 失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('保存 Q&A 时发生错误:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 批量保存 Q&A 内容
 */
export async function saveMultipleQA(items: QAParseResult[], sourceFile: string): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const item of items) {
    const result = await saveQAKnowledge(item, sourceFile);
    if (result.success) {
      success++;
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
export async function getAllQAKnowledge(): Promise<{ data: QAKnowledge[] | null; error?: string }> {
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
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 根据问题编号获取 Q&A
 */
export async function getQAByNumber(questionNumber: number): Promise<{ data: QAKnowledge | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('qa_knowledge_base')
      .select('*')
      .eq('question_number', questionNumber)
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
 * 全文搜索 Q&A 内容
 */
export async function searchQAKnowledge(query: string): Promise<{ data: QAKnowledge[] | null; error?: string }> {
  try {
    if (query.trim().length < 2) {
      return { data: [] };
    }

    // 使用 PostgreSQL 的全文搜索函数
    const { data, error } = await supabase
      .rpc('search_qa_knowledge_base', { search_query: query })
      .limit(10);

    if (error) {
      // 如果自定义函数失败，使用简单搜索
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('qa_knowledge_base')
        .select('*')
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
        .order('question_number')
        .limit(10);

      if (fallbackError) {
        return { data: null, error: fallbackError.message };
      }

      return { data: fallbackData };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 根据分类获取 Q&A
 */
export async function getQAByCategory(category: string): Promise<{ data: QAKnowledge[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('qa_knowledge_base')
      .select('*')
      .eq('category', category)
      .order('question_number');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<{ data: string[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('qa_knowledge_base')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      return { data: null, error: error.message };
    }

    // 提取唯一分类
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return { data: categories };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 检查 Q&A 是否存在
 */
export async function checkQAExists(questionNumber: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('qa_knowledge_base')
      .select('id')
      .eq('question_number', questionNumber)
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
 * 删除 Q&A
 */
export async function deleteQA(questionNumber: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('qa_knowledge_base')
      .delete()
      .eq('question_number', questionNumber);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}

/**
 * 清空所有 Q&A 内容（谨慎使用）
 */
export async function clearAllQA(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('qa_knowledge_base')
      .delete()
      .neq('question_number', 0); // 删除所有记录

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}