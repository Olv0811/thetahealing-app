import { searchPDFContents } from './pdf-content.service';

export interface MatchedItem {
  bookId: string;
  bookTitle: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  keywords: string[];
}

// 从原始数据中提取问答对数据
const getTHETA_HEALING_DATABASE_QA = () => {
  return [
    { Q: '什么是希塔疗愈？', A: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，启发身心灵疗愈的体系' },
    { Q: '希塔疗愈是什么？', A: '希塔疗愈是在冥想过程中，透过对造物主专注的祈求，启发身心灵疗愈的体系' },
    { Q: '希塔脑波的频率范围是多少？', A: '4-7HZ' },
    { Q: '希塔脑波的频率是多少？', A: '4-7HZ，希塔脑波是一种深度放松、做梦般的状态' },
    { Q: '达尔塔波（Delta）的频率是多少？', A: '0-4HZ，代表深度睡眠状态' },
    { Q: '阿尔法波（Alpha）的频率是多少？', A: '7-14HZ，代表非常放松的状态' },
    { Q: '贝塔波（Beta）的频率是多少？', A: '14-28HZ，代表活动、思考、说话的状态' },
    { Q: '伽玛波（Gamma）的频率是多少？', A: '40HZ-5000HZ，代表较快速的脑部活动' },
    { Q: '在希塔波状态下进行显化，成功率大约是多少？', A: '80-90%' },
    { Q: '纯粹用言语陈述显化的成功率是多少？', A: '30-40%' },
    { Q: '用观想进行显化的成功率是多少？', A: '50%' },
    { Q: '希塔疗愈的核心先决条件是什么？', A: '必须对创造一切万有的造物主有全然的信任' },
    { Q: '什么是信念挖掘？', A: '信念挖掘是希塔疗愈的核心技术之一，用于识别和释放限制性信念' },
    { Q: '如何进入希塔脑波状态？', A: '找一个安静舒适的地方坐下，闭上眼睛，深呼吸三次，想象自己进入一个宁静的空间' },
    { Q: '什么是DNA激活？', A: 'DNA激活是一种灵性技术，旨在唤醒人类潜在的灵性基因，提升意识水平' },
    { Q: '什么是肌肉测试？', A: '肌肉测试是透过身体对潜意识真伪的物理反应，用于判断信念系统的状态' },
    { Q: '肌肉测试的原理是什么？', A: '肌肉测试的原理是透过身体肌肉对潜意识真伪的物理反应来判断信念系统的状态，当身体接触到真实的信念时肌肉会保持强壮，而接触到虚假的信念时肌肉会变弱' },
    { Q: '肌肉测试如何工作？', A: '肌肉测试通过观察身体肌肉在不同信念刺激下的反应来判断潜意识的真伪，基于身体的生物反馈机制' },
    { Q: '什么是"细胞之间的对话"？', A: '细胞之间的对话是指人体细胞间可通过意念进行交流和能量传递，细胞能够感应到疗愈师的纯净意念，并对不同信念和情绪做出反应' },
    { Q: '细胞之间是如何交流的？', A: '细胞之间通过意念进行交流和能量传递，能够感应到疗愈师的纯净意念，并对不同信念和情绪做出反应' },
    { Q: '什么是细胞交流？', A: '细胞交流是指人体细胞间可通过意念进行交流和能量传递，细胞能够感应到疗愈师的纯净意念' },
    { Q: '细胞之间有对话吗？', A: '有，人体细胞间可通过意念进行交流和能量传递，细胞能够感应到疗愈师的纯净意念，并对不同信念和情绪做出反应' },
    { Q: '细胞能够感应到疗愈师的意念吗？', A: '可以，人体细胞间可通过意念交流，且对纯净的疗愈意念极其敏感' },
    { Q: '细胞的接收器对习惯的情绪有什么反应？', A: '细胞的接收器会像犯了毒瘾一样持续制造并接收这种情绪，形成情绪循环' },
    { Q: '什么是感觉的"接收器"？', A: '细胞层面的感受通道，如果没有接收器，正面的感觉下载就无法生效' },
    { Q: '希塔疗愈能对抗衰老吗？', A: '可以，通过下指令拔除老化程序并下载细胞永续再生的程序来对抗衰老' },
    { Q: '启动DNA后身体为何会像感冒一样酸痛？', A: '因为身体的细胞正在经历深层的解毒过程，这是身体重建的正常反应' },
    { Q: '清理"三个R"有什么好处？', A: '能清空脑细胞空间，增加心灵能量，甚至实现念动力' },
    { Q: '什么是能量切割？', A: '能量切割是一种保护机制，用于清除疗愈师和个案间产生的能量干扰' },
    { Q: '什么是自由意志法则？', A: '自由意志是有能力选择自己所相信的，这是一个无法打破的宇宙法则' },
    { Q: '脉轮有几个？', A: '七个主要脉轮，从下到上分别是根脉轮、脐轮、太阳神经丛、心轮、喉轮、眉心轮、顶轮' },
    { Q: '什么是显化？', A: '显化是将想法和愿望变为现实的过程，在希塔脑波状态下效果最佳' },
    { Q: '什么是丰盛？', A: '丰盛是一种内在的状态，认识到自己拥有足够的一切，包括爱、健康、财富、智慧等' },
    { Q: '什么是存有的第一界？', A: '第一界是构成有机生命的基石，包含无机物如矿物、水晶、土壤和岩石' },
    { Q: '存有的第一界是什么？', A: '第一界是构成有机生命的基石，包含无机物如矿物、水晶、土壤和岩石' },
    { Q: '什么是存有的第二界？', A: '第二界由有机物质组成，包含维他命、花草树木、仙子和精灵' },
    { Q: '存有的第二界是什么？', A: '第二界由有机物质组成，包含维他命、花草树木、仙子和精灵' },
    { Q: '什么是存有的第三界？', A: '第三界是以蛋白质和碳为基础的结构，是人类和动物共生、受二元论支配的存有界' },
    { Q: '存有的第三界是什么？', A: '第三界是以蛋白质和碳为基础的结构，是人类和动物共生、受二元论支配的存有界' },
    { Q: '什么是存有的第四界？', A: '第四界是灵界，祖先的灵和图腾动物所在之处' },
    { Q: '存有的第四界是什么？', A: '第四界是灵界，祖先的灵和图腾动物所在之处' },
    { Q: '什么是存有的第五界？', A: '第五界是天使、高我、扬升大师、灵魂家族所在之处' },
    { Q: '存有的第五界是什么？', A: '第五界是天使、高我、扬升大师、灵魂家族所在之处' },
    { Q: '什么是存有的第六界？', A: '第六界是宇宙法则的所在地，以及一切万有的神圣音乐/音律' },
    { Q: '存有的第六界是什么？', A: '第六界是宇宙法则的所在地，以及一切万有的神圣音乐/音律' },
    { Q: '什么是存有的第七界？', A: '第七界是纯粹的创造能量，是"一切万有的造物主"与无条件的爱所在之处' },
    { Q: '存有的第七界是什么？', A: '第七界是纯粹的创造能量，是"一切万有的造物主"与无条件的爱所在之处' },
    // ... 可以继续添加更多问答对
  ];
};

/**
 * 简化的模糊搜索函数
 */
export async function simpleFuzzySearch(query: string): Promise<{ matches: MatchedItem[]; error?: string }> {
  try {
    console.log('开始简化模糊搜索:', query);

    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      console.error('无效的查询参数');
      return { matches: [] };
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
    
    // 创建完整的查询短语（去除所有标点符号）
    const queryPhraseClean = queryLower
      .replace(/[，。！？、；：""''（）【】「」『』\s]/g, '');
    
    console.log('清理后的查询短语:', queryPhraseClean);
    
    // 提取引号内的内容作为核心概念
    const quotedContent = query.match(/[「」『']'"]([^「」『']'"]+)[「」『']'"]/);
    let quotedPhrase = '';
    if (quotedContent && quotedContent[1]) {
      quotedPhrase = quotedContent[1].toLowerCase().trim();
      console.log('引号内容:', quotedPhrase);
    }

    const matches: MatchedItem[] = [];
    const databaseQA = getTHETA_HEALING_DATABASE_QA();

    // 搜索数据库问答对
    for (const qa of databaseQA) {
      if (!qa || !qa.Q || !qa.A) continue;

      const questionLower = qa.Q.toLowerCase();
      const answerLower = qa.A.toLowerCase();
      
      // 计算匹配度评分
      let score = 0;
      const matchedKeywords: string[] = [];
      
      // 改进的关键词匹配逻辑
      for (const word of queryWords) {
        if (word.length < 1) continue;
        
        // 在问题中匹配，权重更高
        if (questionLower.includes(word)) {
          score += 10;
          if (!matchedKeywords.includes(word)) {
            matchedKeywords.push(word);
          }
        }
        // 在答案中匹配
        if (answerLower.includes(word)) {
          score += 5;
          if (!matchedKeywords.includes(word)) {
            matchedKeywords.push(word);
          }
        }
        
        // 特殊处理：匹配"什么是"/"是什么"的变化
        if ((word === '是什么' && questionLower.includes('什么是')) ||
            (word === '什么是' && questionLower.includes('是什么'))) {
          score += 8;
          if (!matchedKeywords.includes('是什么')) {
            matchedKeywords.push('是什么');
          }
        }
      }
      
      // 特殊处理：如果查询是"什么是X"或"X是什么"格式
      // 检查问题是否包含相同的核心词汇，无论顺序如何
      const questionWords = questionLower.split(/\s+/).filter(w => w.length >= 1);
      const matchedWordCount = queryWords.filter(w => 
        questionWords.some(qw => qw.includes(w) || w.includes(qw))
      ).length;
      
      // 如果匹配的词汇数量足够，给予额外分数
      if (matchedWordCount >= 2) {
        score += matchedWordCount * 8;
      }
      
      // 检查复合词匹配（如"肌肉测试"）
      const queryPhrase = queryWords.join('');
      const questionPhrase = questionWords.join('');
      if (questionPhrase.includes(queryPhrase) || queryPhrase.includes(questionPhrase)) {
        score += 15; // 复合词匹配给予额外加分
      }
      
      // 检查完整短语匹配（去除所有标点符号）
      const questionPhraseClean = questionLower
        .replace(/[，。！？、；：""''（）【】「」『』\s]/g, '');
      
      if (queryPhraseClean.length >= 3 && questionPhraseClean.includes(queryPhraseClean)) {
        score += 25; // 完整短语匹配给予大幅加分
      }
      
      // 检查关键概念匹配（如"细胞对话"）
      const keyConcepts = [
        '细胞对话', '细胞交流', '细胞感应', '细胞意念',
        '信念挖掘', '肌肉测试', '能量切割', 'dna激活',
        '脉轮平衡', '能量净化', '显化', '丰盛'
      ];
      
      for (const concept of keyConcepts) {
        if (queryPhraseClean.includes(concept) && questionPhraseClean.includes(concept)) {
          score += 20; // 关键概念匹配给予大幅加分
        }
      }
      
      // 特殊处理：如果查询包含引号内容，优先匹配引号内的概念
      if (quotedPhrase && quotedPhrase.length >= 2) {
        const quotedPhraseClean = quotedPhrase.replace(/[\s，。！？、；：]/g, '');
        if (questionPhraseClean.includes(quotedPhraseClean)) {
          score += 30; // 引号内容匹配给予最高加分
        }
        
        // 检查引号内容的部分匹配
        const quotedWords = quotedPhraseClean.split('').filter(w => w.length >= 1);
        const quotedMatchCount = quotedWords.filter(w => questionPhraseClean.includes(w)).length;
        if (quotedMatchCount >= Math.ceil(quotedWords.length * 0.7)) {
          score += 25; // 引号内容大部分匹配时给予高分
        }
      }
      
      // 检查核心词汇是否大部分匹配（至少50%的核心词汇匹配）
      if (queryWords.length >= 2 && matchedWordCount >= Math.ceil(queryWords.length * 0.5)) {
        score += 20; // 核心词汇匹配度高时给予大幅加分
      }
      
      // 如果有匹配，添加到结果
      if (score > 0) {
        const snippet = qa.A.length > 100
          ? qa.A.substring(0, 100) + '...'
          : qa.A;

        matches.push({
          bookId: 'thetahealing-database',
          bookTitle: '希塔疗愈知识库',
          title: qa.Q,
          snippet: snippet,
          relevanceScore: score,
          keywords: [...new Set(matchedKeywords)],
        });
        console.log(`  ✓ 匹配: Q="${qa.Q}" 评分=${score} 匹配词汇=${matchedWordCount}`);
      }
    }

    // 按相关性评分排序
    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 限制返回数量（最多5个）
    const limitedMatches = matches.slice(0, 5);

    console.log(`找到 ${limitedMatches.length} 个匹配项`);
    limitedMatches.forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.bookTitle}] Q="${m.title}" (评分: ${m.relevanceScore})`);
    });

    return { matches: limitedMatches };
  } catch (error) {
    console.error('简化模糊搜索失败:', error);
    return {
      matches: [],
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}