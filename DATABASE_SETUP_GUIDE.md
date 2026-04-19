# 希塔疗愈知识库数据库设置指南

## 问题说明

当前知识库无法加载内容的原因是数据库中缺少 `pdf_contents` 表。

## 解决方案

### 方法一：使用 Supabase Dashboard（推荐）

1. 打开 Supabase Dashboard
   - 访问 https://supabase.com
   - 登录你的账户
   - 选择你的项目（celestial-sanctuary）

2. 打开 SQL Editor
   - 在左侧菜单中找到 "SQL Editor"
   - 点击 "New Query"

3. 执行以下 SQL

```sql
CREATE TABLE IF NOT EXISTS pdf_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  total_pages INTEGER DEFAULT 0,
  file_path TEXT NOT NULL,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pdf_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view pdf contents" ON pdf_contents
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert pdf contents" ON pdf_contents
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can update pdf contents" ON pdf_contents
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can delete pdf_contents" ON pdf_contents
  FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_pdf_contents_book_id ON pdf_contents(book_id);
CREATE INDEX IF NOT EXISTS idx_pdf_contents_title ON pdf_contents USING GIN(to_tsvector('chinese', title));
CREATE INDEX IF NOT EXISTS idx_pdf_contents_content ON pdf_contents USING GIN(to_tsvector('chinese', content));
```

4. 点击 "Run" 执行 SQL

5. 验证表创建成功
   - 在左侧菜单中找到 "Table Editor"
   - 你应该能看到 `pdf_contents` 表

### 方法二：使用 Supabase CLI

如果你安装了 Supabase CLI，可以运行：

```bash
# 设置 Supabase 链接
supabase link --project-ref your-project-id

# 运行迁移
supabase db push
```

## 验证数据库

运行以下脚本验证数据库是否正常：

```bash
npx tsx check-db-content.ts
```

## 临时解决方案

如果你暂时无法创建数据库表，应用已经配置了本地静态内容作为后备。AI 搜索功能仍然可以正常工作，但使用的是本地预定义的希塔疗愈内容。

## 数据库优势

使用数据库的好处：
- 可以存储完整的 PDF 文本内容
- 支持全文搜索
- 可以动态更新内容
- 支持多用户访问

## 技术说明

- 应用已经实现了数据库和本地内容的双重机制
- 如果数据库表不存在，会自动使用本地内容
- 一旦表创建成功，应用会自动切换到数据库内容
- 无需修改代码，只需创建表即可

## 后续步骤

1. 创建数据库表（按照上述方法）
2. 运行验证脚本检查表是否正常
3. 刷新知识库页面
4. 测试搜索功能

---

如有问题，请检查：
- Supabase 项目配置是否正确
- 环境变量是否设置正确
- 是否有足够的权限创建表