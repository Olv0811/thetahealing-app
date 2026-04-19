@echo off
chcp 65001 >nul
echo ========================================
echo PDF 内容提取工具
echo ========================================
echo.

cd /d "%~dp0"

echo [提示] 此脚本将提取所有 PDF 文件的文本内容并保存到数据库
echo.

pause

echo.
echo [1/2] 检查环境变量...
if exist ".env" (
    echo ✅ 环境变量已配置
) else (
    echo ❌ 错误：.env 文件不存在！
    echo 请检查 Supabase 配置
    pause
    exit /b 1
)

echo.
echo [2/2] 开始提取 PDF 内容...
echo.

call npm run -- tsx extract-pdf-content.ts

if errorlevel 1 (
    echo.
    echo ❌ 提取失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 提取完成！
echo ========================================
echo.
echo 现在可以在知识库中使用 AI 智能搜索功能了
echo.
pause