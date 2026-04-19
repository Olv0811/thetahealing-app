import { LocalDatabase, PDFContent, QAKnowledge, SearchResult } from './local-db.service';

export class LocalSearchService {
  private db: LocalDatabase | null = null;

  constructor() {
    // 不在这里初始化，在 init() 方法中初始化
  }

  /**
   * 初始化搜索服务
   */
  async init(): Promise<void> {
    if (!this.db) {
      this.db = new LocalDatabase();
      await this.db.init();
      console.log('Local search service initialized');
    }
  }

  /**
   * 简化的模糊搜索函数
   * 搜索 PDF 内容和 Q&A 知识库
   */
  async simpleFuzzySearch(query: string): Promise<{ matches: SearchResult[]; error?: string }> {
    try {
      console.log('开始本地模糊搜索:', query);

      if (!this.db) {
        return { matches: [], error: 'Database not initialized' };
      }

      if (!query || typeof query !== 'string' || query.trim().length < 1) {
        console.error('无效的查询参数');
        return { matches: [] };
      }

      // 检查缓存
      const cachedResults = await this.db.getSearchCache(query);
      if (cachedResults) {
        console.log('使用缓存结果，数量:', cachedResults.length);
        return { matches: cachedResults };
      }

      const queryLower = query.toLowerCase().trim();

      // 中文修饰词列表（应该忽略的词）
      const chineseModifiers = ['的', '了', '吗', '呢', '啊', '吧', '么', '嘛', '啦'];

      // 提取核心词汇（过滤修饰词和标点符号）
      const queryWords = queryLower
        .split(/\s+/)
        .filter(w => w.length >= 1)
        .filter(w => !chineseModifiers.includes(w))
        .filter(w => !/[，。！？、；：""''（）【】「」『』]/.test(w));

      console.log('查询词:', queryWords);

      // 搜索 PDF 内容
      const pdfContents = await this.db.searchPDFContent(queryLower);
      console.log('PDF 搜索结果:', pdfContents.length);

      // 搜索 Q&A 知识库
      const qaKnowledge = await this.db.searchQAKnowledge(queryLower);
      console.log('Q&A 搜索结果:', qaKnowledge.length);

      const matches: SearchResult[] = [];

      // 处理 PDF 搜索结果
      for (const content of pdfContents) {
        const score = this.calculateRelevance(queryWords, content.title + ' ' + content.content);
        if (score > 0) {
          matches.push({
            bookId: content.book_id,
            bookTitle: content.title,
            title: content.title,
            snippet: content.content.substring(0, 100) + '...',
            relevanceScore: score,
            keywords: [],
          });
        }
      }

      // 处理 Q&A 搜索结果
      for (const knowledge of qaKnowledge) {
        const score = this.calculateRelevance(queryWords, knowledge.question + ' ' + knowledge.answer);
        if (score > 0) {
          matches.push({
            bookId: knowledge.source_file,
            bookTitle: knowledge.source_file,
            title: knowledge.question,
            snippet: knowledge.answer.substring(0, 100) + '...',
            relevanceScore: score,
            keywords: knowledge.tags || [],
          });
        }
      }

      // 按相关性评分排序
      matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // 限制返回数量（最多10个）
      const limitedMatches = matches.slice(0, 10);

      console.log(`找到 ${limitedMatches.length} 个匹配项`);

      // 保存到缓存
      await this.db.saveSearchCache(query, limitedMatches);

      return { matches: limitedMatches };
    } catch (error) {
      console.error('本地模糊搜索失败:', error);
      return {
        matches: [],
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 计算相关性评分
   */
  private calculateRelevance(queryWords: string[], text: string): number {
    if (queryWords.length === 0) return 0;

    const textLower = text.toLowerCase();
    let totalScore = 0;

    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        // 基础匹配分数
        totalScore += 1;

        // 如果单词在文本开头，加分
        if (textLower.startsWith(word)) {
          totalScore += 0.5;
        }

        // 如果单词是完整的词（前后是空格或标点），加分
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(text)) {
          totalScore += 0.3;
        }
      }
    });

    // 归一化分数
    const normalizedScore = totalScore / queryWords.length;

    // 考虑文本长度因素（较短的文本更容易完全匹配）
    const lengthFactor = Math.max(0.5, 1 - (text.length / 1000));

    return Math.min(normalizedScore * lengthFactor, 1);
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{ pdfCount: number; qaCount: number; cacheCount: number }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.getStats();
  }

  /**
   * 清除搜索缓存
   */
  async clearSearchCache(): Promise<void> {
    await this.db.clearSearchCache();
  }

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    await this.db.clearAll();
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}

// 导出单例实例
let localSearchServiceInstance: LocalSearchService | null = null;

export function getLocalSearchService(): LocalSearchService {
  if (!localSearchServiceInstance) {
    localSearchServiceInstance = new LocalSearchService();
  }
  return localSearchServiceInstance;
}

export function destroyLocalSearchService(): void {
  if (localSearchServiceInstance) {
    localSearchServiceInstance.close();
    localSearchServiceInstance = null;
  }
}