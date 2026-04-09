#!/bin/bash
# scripts/setup-db.sh - One-time database initialization script

echo "🚀 BOM App - Database Setup"
echo "============================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "   ✅ Done. Please update .env.local with your database credentials."
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "📦 Installing Prisma dependencies..."
    npm install @prisma/client prisma --save
    echo "   ✅ Done"
    echo ""
fi

# Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate
echo "   ✅ Done"
echo ""

# Run migrations
echo "🗄️  Setting up database..."
npx prisma migrate dev --name init
echo "   ✅ Done"
echo ""

# Optional: Show Prisma Studio
read -p "Would you like to open Prisma Studio to view the database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma studio
fi

echo ""
echo "✨ Database setup complete!"
echo "Run: npm run dev"
echo ""
