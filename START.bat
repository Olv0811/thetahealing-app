@echo off
chcp 65001 >nul
echo ========================================
echo Celestial Sanctuary 快速启动
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo 依赖未安装，正在安装...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [2/3] 检查环境变量...
if exist ".env" (
    echo ✅ 环境变量已配置
) else (
    echo ⚠️  警告：.env 文件不存在！
    echo 请参考 INIT_DATABASE.md 配置环境变量
    pause
    exit /b 1
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ========================================
echo 应用将在 http://localhost:3000 启动
echo ========================================
echo.
echo 按 Ctrl+C 可以停止服务器
echo.

call npm run dev

pause