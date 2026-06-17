@echo off
title SAA ARCHI Preview
cd /d "%~dp0"
if not exist "index.html" (
  echo ERREUR: index.html introuvable.
  echo Ce fichier doit etre lance depuis le dossier du site SAA ARCHI.
  pause
  exit /b 1
)
echo Starting SAA ARCHI preview...
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:4173/index.html
echo.
"C:\Users\alato\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" preview-server.py
pause
