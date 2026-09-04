@echo off
setlocal enabledelayedexpansion

:: Try preferred ports in order
set "PORTS=5173 5174 5175 5176 5177 5178 5179 5180"

:: Find first free port
for %%p in (%PORTS%) do (
  netstat -ano | findstr ":%%p .*LISTENING" >nul 2>&1
  if errorlevel 1 (
    set "PORT=%%p"
    goto :found
  )
)

echo No free port found in range %PORTS%
pause
exit /b 1

:found
echo Starting Lumina dev server on port %PORT%...
start "" cmd /c "npm run dev -- --host 0.0.0.0 --port %PORT%"
timeout /t 2 /nobreak >nul
start http://localhost:%PORT%
endlocal
