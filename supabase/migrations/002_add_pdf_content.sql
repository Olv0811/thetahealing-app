-- 创建 PDF 内容表
CREATE TABLE pdf_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL UNIQUE,  -- 对应 BOOKS 中的 id
  title TEXT NOT NULL,  -- 书籍标题
  content TEXT NOT NULL,  -- PDF 文本内容
  total_pages INTEGER DEFAULT 0,  -- 总页数
  file_path TEXT NOT NULL,  -- PDF 文件路径
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 提取时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE pdf_contents ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取 PDF 内容（用于搜索）
CREATE POLICY "Anyone can view pdf contents" ON pdf_contents
  FOR SELECT USING (true);

-- 创建索引
CREATE INDEX idx_pdf_contents_book_id ON pdf_contents(book_id);
CREATE INDEX idx_pdf_contents_title ON pdf_contents USING GIN(to_tsvector('chinese', title));
CREATE INDEX idx_pdf_contents_content ON pdf_contents USING GIN(to_tsvector('chinese', content));

-- 添加更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_contents_updated_at BEFORE UPDATE ON pdf_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（实际数据需要通过脚本提取）
INSERT INTO pdf_contents (book_id, title, content, total_pages, file_path) VALUES
('1', '基础 DNA 实用手册', '', 0, '/basic-dna-manual.pdf'),
('2', '进阶 DNA 执业者指南', '', 0, '/advanced-dna-practitioner.pdf'),
('3', '深度探索指南', '', 0, '/dig-deeper-guide.pdf'),
('4', '希塔疗愈知识库', '', 0, '/theta-healing-knowledge-base.pdf')
ON CONFLICT (book_id) DO NOTHING;