# Package.json Scripts to Add

Add these scripts to your `package.json` file in the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "db:setup": "node scripts/setup-db.js",
    
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

## Usage

```bash
# Development
npm run dev                # Start development server

# Database commands
npm run db:migrate        # Create/run migrations
npm run db:push           # Push schema to database (for quick setup)
npm run db:studio         # Open Prisma Studio UI
npm run db:seed           # Seed database with sample data
npm run db:reset          # Reset database (⚠️ deletes all data)

# Setup
npm run db:setup          # One-time setup (runs all db operations)

# Building
npm run build             # Build for production
npm run start             # Start production server
npm run type-check        # Check TypeScript errors
npm run format            # Format code with Prettier
```

## Installation of Prisma

If you haven't already, install Prisma:

```bash
npm install @prisma/client prisma -D
```

Then initialize Prisma (creates prisma/ folder):

```bash
npx prisma init
```

## Most Important Commands (In Order)

1. **First time setup:**
   ```bash
   npm run db:setup
   # OR manually:
   npm install @prisma/client prisma -D
   cp .env.example .env.local
   npx prisma migrate dev --name init
   ```

2. **Development:**
   ```bash
   npm run dev
   ```

3. **View data:**
   ```bash
   npm run db:studio
   ```

4. **After changing schema:**
   ```bash
   npm run db:migrate
   ```
