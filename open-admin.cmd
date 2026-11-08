@echo off
rem Plant Atlas World: double-click to open the local photo dashboard.
rem Starts "npm run dev" in a minimized window if it is not running, then opens /admin.
chcp 65001 >nul
cd /d "%~dp0"
set "URL=http://localhost:3000/admin"

rem Already running? Just open the browser.
curl.exe -s -o nul "%URL%" && goto open

where npm >nul 2>nul || (
  echo 没有找到 Node.js / npm，请先安装 Node.js：https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo 首次运行，正在安装依赖（npm install），需要几分钟……
  call npm install || (pause & exit /b 1)
)

echo 正在启动本地服务……（关闭标题为 "Plant Atlas dev server" 的窗口即可停止）
start "Plant Atlas dev server" /min cmd /k "npm run dev"

rem Wait up to 90 seconds for the server.
for /l %%i in (1,1,90) do (
  curl.exe -s -o nul "%URL%" && goto open
  timeout /t 1 /nobreak >nul
)
echo 服务启动超时，请查看 "Plant Atlas dev server" 窗口中的错误信息。
pause
exit /b 1

:open
start "" "%URL%"
