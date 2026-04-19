-- 创建 Q&A 知识库表
CREATE TABLE qa_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_number INTEGER NOT NULL UNIQUE,  -- 问题编号 (Q1, Q2, etc.)
  question TEXT NOT NULL,  -- 问题内容
  answer TEXT NOT NULL,  -- 答案内容
  source_file TEXT NOT NULL,  -- 来源文件
  category TEXT,  -- 分类（可选）
  tags TEXT[],  -- 标签数组（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 创建时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- 更新时间
);

-- 启用 RLS
ALTER TABLE qa_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取 Q&A 内容（用于搜索）
CREATE POLICY "Anyone can view qa knowledge" ON qa_knowledge_base
  FOR SELECT USING (true);

-- 创建索引
CREATE INDEX idx_qa_knowledge_base_question_number ON qa_knowledge_base(question_number);
CREATE INDEX idx_qa_knowledge_base_question ON qa_knowledge_base USING GIN(to_tsvector('chinese', question));
CREATE INDEX idx_qa_knowledge_base_answer ON qa_knowledge_base USING GIN(to_tsvector('chinese', answer));
CREATE INDEX idx_qa_knowledge_base_category ON qa_knowledge_base(category);
CREATE INDEX idx_qa_knowledge_base_tags ON qa_knowledge_base USING GIN(tags);

-- 添加更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_qa_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qa_knowledge_base_updated_at BEFORE UPDATE ON qa_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_qa_updated_at_column();

-- 创建全文搜索函数
CREATE OR REPLACE FUNCTION search_qa_knowledge_base(search_query TEXT)
RETURNS TABLE (
  id UUID,
  question_number INTEGER,
  question TEXT,
  answer TEXT,
  source_file TEXT,
  category TEXT,
  tags TEXT[],
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    qa.question_number,
    qa.question,
    qa.answer,
    qa.source_file,
    qa.category,
    qa.tags,
    ts_rank(to_tsvector('chinese', qa.question || ' ' || qa.answer), plainto_tsquery('chinese', search_query)) as relevance_score
  FROM qa_knowledge_base qa
  WHERE 
    to_tsvector('chinese', qa.question || ' ' || qa.answer) @@ plainto_tsquery('chinese', search_query)
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON TABLE qa_knowledge_base IS '希塔疗愈 Q&A 知识库表';
COMMENT ON COLUMN qa_knowledge_base.question_number IS '问题编号，对应 Q1, Q2, Q3...';
COMMENT ON COLUMN qa_knowledge_base.source_file IS '来源文件名，如 thetahealingdatabase_complete.md';
COMMENT ON COLUMN qa_knowledge_base.category IS '分类，如 基础知识、疗愈技巧、DNA激活等';
COMMENT ON COLUMN qa_knowledge_base.tags IS '标签数组，用于分类和搜索';