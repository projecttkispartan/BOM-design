@echo off
REM scripts\setup-db.bat - Windows database initialization script

echo.
echo 🚀 BOM App - Database Setup
echo ============================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local from .env.example...
    copy .env.example .env.local
    echo    ✅ Done. Please update .env.local with your database credentials.
    echo.
)

REM Install dependencies if needed
if not exist "node_modules\@prisma\client" (
    echo 📦 Installing Prisma dependencies...
    call npm install @prisma/client prisma --save
    echo    ✅ Done
    echo.
)

REM Generate Prisma Client
echo 🔄 Generating Prisma Client...
call npx prisma generate
echo    ✅ Done
echo.

REM Run migrations
echo 🗄️  Setting up database...
call npx prisma migrate dev --name init
echo    ✅ Done
echo.

REM Optional: Show Prisma Studio
set /p SHOW_STUDIO="Would you like to open Prisma Studio to view the database? (y/n): "
if /i "%SHOW_STUDIO%"=="y" (
    call npx prisma studio
)

echo.
echo ✨ Database setup complete!
echo Run: npm run dev
echo.
pause
