# PDF AI 智能搜索功能使用指南

## 功能概述

本功能将疗愈知识库中的 PDF 文件转换为文本格式，并使用 AI 模型进行智能搜索，为用户提供有意义的搜索结果和内容解析。

## 功能特点

1. **PDF 文本提取**：自动从 PDF 文件中提取文本内容
2. **数据库存储**：将提取的文本内容存储到数据库中
3. **AI 智能搜索**：使用 GLM 智谱 AI 模型进行语义搜索
4. **智能解析**：AI 根据搜索查询分析知识库内容，提供专业答案
5. **相关章节**：显示与搜索结果相关的具体章节和页码

## 使用步骤

### 1. 创建数据库表

首先需要在 Supabase 中创建 `pdf_contents` 表：

```bash
# 方法 1：在 Supabase SQL Editor 中执行
# 打开 supabase/migrations/002_add_pdf_content.sql
# 复制 SQL 语句到 Supabase SQL Editor 中执行

# 方法 2：使用数据库迁移脚本
# 确保 .env 文件中配置了 Supabase URL 和 Key
npm run -- tsx extract-pdf-content.ts
```

### 2. 提取 PDF 文本内容

运行提取脚本，从 PDF 文件中提取文本内容：

```bash
npm run -- tsx extract-pdf-content.ts
```

这个脚本会：
- 读取所有 PDF 文件
- 提取每页的文本内容
- 将内容保存到数据库
- 显示提取进度和结果

**预期输出**：
```
========================================
开始提取 PDF 文本内容
========================================

📖 正在提取：基础 DNA 实用手册
   文件路径：/basic-dna-manual.pdf
✅ 提取成功：
   总页数：XXX
   内容长度：XXXXX 字符
✅ 保存成功

...（继续处理其他 PDF 文件）

========================================
提取完成
========================================
✅ 成功：4 个
❌ 失败：0 个
⏭️  跳过：0 个
========================================
```

### 3. 测试 AI 智能搜索

1. 启动应用：
```bash
npm run dev
```

2. 打开浏览器，访问 `http://localhost:3000`

3. 进入"疗愈知识库"页面

4. 在搜索框中输入查询，例如：
   - "希塔脑波是什么？"
   - "如何进行 DNA 激活？"
   - "信念挖掘的步骤"
   - "脉轮平衡的方法"

5. 点击搜索按钮

6. 查看搜索结果：
   - **传统搜索**：显示匹配的书籍列表
   - **AI 智能解析**：显示 AI 分析的答案和相关章节

## 技术架构

### 文件结构

```
celestial-sanctuary/
├── supabase/migrations/
│   ├── 001_initial_schema.sql        # 原始数据库 schema
│   └── 002_add_pdf_content.sql        # PDF 内容表
├── src/
│   ├── services/
│   │   ├── pdf-extract.service.ts    # PDF 文本提取服务
│   │   ├── pdf-content.service.ts    # PDF 内容 API 服务
│   │   └── ai-search.service.ts      # AI 智能搜索服务
│   └── components/
│       └── KnowledgeBase.tsx         # 知识库组件（已更新）
└── extract-pdf-content.ts            # PDF 内容提取脚本
```

### 数据库表结构

```sql
CREATE TABLE pdf_contents (
  id UUID PRIMARY KEY,
  book_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  total_pages INTEGER DEFAULT 0,
  file_path TEXT NOT NULL,
  extracted_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API 服务

1. **PDF 文本提取服务** (`pdf-extract.service.ts`)
   - `extractTextFromPDF()`：提取单个 PDF 文件的文本
   - `extractMultiplePDFs()`：批量提取多个 PDF 文件

2. **PDF 内容服务** (`pdf-content.service.ts`)
   - `savePDFContent()`：保存 PDF 内容到数据库
   - `getAllPDFContents()`：获取所有 PDF 内容
   - `getPDFContentByBookId()`：根据书籍 ID 获取内容
   - `searchPDFContents()`：全文搜索 PDF 内容
   - `checkPDFContentExists()`：检查内容是否存在
   - `deletePDFContent()`：删除 PDF 内容

3. **AI 智能搜索服务** (`ai-search.service.ts`)
   - `intelligentSearch()`：执行 AI 智能搜索
   - `analyzePDFContent()`：分析 PDF 内容并生成答案

## 使用示例

### 示例 1：搜索希塔脑波

**查询**：`希塔脑波是什么？`

**AI 回答**：
```
希塔脑波（Theta brainwaves）是指频率在 4-8Hz 的脑波状态，
这是深度冥想和潜意识活动的关键状态。在希塔疗愈中，
我们通过引导进入希塔脑波状态，以便更有效地进行信念挖掘和疗愈工作。

来源：基础 DNA 实用手册
```

**相关章节**：
- 第 15 页：关于希塔脑波的详细介绍
- 第 23 页：如何进入希塔脑波状态

### 示例 2：搜索 DNA 激活

**查询**：`如何进行 DNA 激活？`

**AI 回答**：
```
DNA 激活是希塔疗愈的核心技术之一，旨在唤醒沉睡的灵性基因
并连接更高维度的能量。具体步骤包括：

1. 进入希塔脑波状态
2. 连接造物主的智慧
3. 使用特定的激活命令
4. 引导能量流经全身

建议在专业导师指导下进行。

来源：进阶 DNA 执业者指南
```

## 注意事项

1. **首次使用**：
   - 必须先运行 `extract-pdf-content.ts` 脚本提取 PDF 内容
   - 确保 Supabase 数据库表已创建
   - 确保环境变量配置正确

2. **性能优化**：
   - PDF 文本提取可能需要几分钟时间
   - 建议在低流量时段执行提取脚本
   - 可以使用 `checkPDFContentExists()` 避免重复提取

3. **AI 搜索限制**：
   - 需要配置 GLM API Key
   - AI 搜索响应时间约为 1-3 秒
   - 建议使用明确的查询关键词

4. **错误处理**：
   - 如果 PDF 文件损坏，提取会失败
   - 如果数据库连接失败，保存会失败
   - 查看 `extract-pdf-content.ts` 的错误日志

## 故障排除

### 问题 1：提取脚本失败

**症状**：
```
❌ 提取失败：基础 DNA 实用手册
   错误：Failed to fetch dynamically imported module
```

**解决方案**：
1. 确保 `pdf.worker.min.js` 文件在 `public` 目录中
2. 检查 PDF 文件路径是否正确
3. 确保所有 PDF 文件都在 `public` 目录中

### 问题 2：数据库连接失败

**症状**：
```
❌ 保存失败：JWT expired
```

**解决方案**：
1. 检查 `.env` 文件中的 Supabase 配置
2. 确保 Supabase 项目正在运行
3. 检查网络连接

### 问题 3：AI 搜索无结果

**症状**：
```
AI 暂时无法找到相关内容
```

**解决方案**：
1. 确保 PDF 内容已成功提取
2. 检查 GLM API Key 是否配置
3. 尝试使用不同的搜索关键词
4. 查看浏览器控制台错误信息

## 下一步优化

1. **增量更新**：支持 PDF 文件更新后重新提取
2. **分页显示**：优化长文档的显示效果
3. **缓存机制**：减少重复的 API 调用
4. **搜索历史**：记录用户的搜索历史
5. **相关性评分**：改进搜索结果的相关性排序

## 技术支持

如有问题，请参考：
- 项目文档：`DATABASE_SCHEMA.md`、`BACKEND_SETUP.md`
- 服务代码：`src/services/` 目录
- 组件代码：`src/components/KnowledgeBase.tsx`

---

**最后更新**：2026年4月13日
**版本**：1.0.0