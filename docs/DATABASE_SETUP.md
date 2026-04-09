# Database Setup & Migration Guide

## Prerequisites
- Node.js 18+
- npm or yarn

## Installation Steps

### 1. Install Dependencies
```bash
npm install @prisma/client @prisma/cli
npm install -D prisma
```

### 2. Setup Environment
```bash
# Copy example to .env.local
cp .env.example .env.local

# For SQLite (default - no setup needed)
# For PostgreSQL/MySQL, update DATABASE_URL in .env.local
```

### 3. Initialize Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates/updates tables)
npx prisma migrate dev --name init

# Or for first time setup:
npx prisma db push
```

### 4. View Database (optional)
```bash
# Open Prisma Studio to view/edit data
npx prisma studio
```

### 5. Run Application
```bash
npm run dev
```

## Database Options

### Option A: SQLite (Recommended for Development)
- File-based database
- No server needed
- Perfect for development & small deployments
- Default setup in schema.prisma

### Option B: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL locally or use cloud provider (Heroku, AWS RDS, etc.)

# Update .env.local:
DATABASE_URL="postgresql://user:password@localhost:5432/bom_app"

# Run migrations
npx prisma migrate dev --name init
```

### Option C: MySQL
```bash
# Update .env.local:
DATABASE_URL="mysql://user:password@localhost:3306/bom_app"

# Also update datasource provider in prisma/schema.prisma:
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

# Run migrations
npx prisma migrate dev --name init
```

## API Endpoints Reference

### BOM Documents
- **GET** `/api/bom` - List all BOMs (supports ?q=search)
- **POST** `/api/bom` - Create new BOM
- **GET** `/api/bom/{id}` - Get BOM with all versions
- **PUT** `/api/bom/{id}` - Update current version
- **DELETE** `/api/bom/{id}` - Delete BOM

### Versions
- **GET** `/api/bom/{id}/versions` - Get all versions
- **POST** `/api/bom/{id}/versions` - Create new version
- **PATCH** `/api/bom/version/{versionId}/status` - Change version status

### Audit & History
- **GET** `/api/bom/{id}/audit` - Get document history

## Frontend Client Usage

```typescript
import { bomApiClient } from '@/lib/bomApiClient';

// List all BOMs
const documents = await bomApiClient.listBom();

// Create new BOM
const newBom = await bomApiClient.createBom({
  code: 'MB-001',
  name: 'MEJA BELAJAR',
  metadata: {...},
  bomRows: [...],
});

// Get single BOM
const bom = await bomApiClient.getBom(id);

// Update current version
await bomApiClient.updateBom(id, {
  metadata: {...},
  bomRows: [...],
});

// Create new version
const newVersion = await bomApiClient.createVersion(id, {
  version: '2.0',
  status: 'draft',
  metadata: {...},
});

// Change version status
await bomApiClient.changeVersionStatus(versionId, 'final');

// Get audit history
const history = await bomApiClient.getHistory(id);
```

## Service Functions (Backend)

Located in `lib/bomService.ts`:
- `createBomDocument(input)` - Create new document
- `getAllBomDocuments()` - Fetch all documents
- `getBomDocument(id)` - Fetch single document
- `updateBomVersion(docId, updates)` - Update current version
- `createNewVersion(docId, input)` - Create new version
- `deleteBomDocument(id)` - Delete document
- `searchBomDocuments(query)` - Search BOMs
- `logAction(docId, action, userId, details)` - Log action
- `getDocumentHistory(docId)` - Get audit log

## Database Schema

### Tables
1. **BomDocument** - Main BOM document record
2. **BomVersion** - Version history for each BOM
3. **AuditLog** - Action history/audit trail

### Key Relationships
- BomDocument → BomVersion (1:many)
- BomVersion → BomVersion (self-reference for parent-child)
- BomDocument → AuditLog (1:many)

## Troubleshooting

### Issue: "PrismaClientInitializationError"
**Solution:** 
```bash
npx prisma generate
npx prisma db push
```

### Issue: "SQLITE_CANTOPEN"
**Solution:** Ensure `prisma` directory exists and has write permissions
```bash
mkdir -p prisma
chmod 755 prisma
```

### Issue: Connection refused (PostgreSQL/MySQL)
**Solution:** Verify database server is running and credentials are correct
```bash
# Test connection
psql -U user -d bom_app -h localhost
```

### Issue: Data not persisting
**Solution:** Check that DATABASE_URL is correct and migrations ran successfully
```bash
npx prisma migrate status
npx prisma db push
```

## Next Steps

1. ✅ Initialize database with migrations
2. ✅ Verify API endpoints working (test with Postman/curl)
3. ✅ Update frontend components to use `bomApiClient` instead of `localStorage`
4. ✅ Test CRUD operations
5. ✅ Setup backup/disaster recovery plan
6. ✅ Monitor performance with Prisma Studio

## File Structure
```
bom-app/
├── app/
│   └── api/
│       └── bom/
│           ├── route.ts                 # List/Create
│           ├── [id]/
│           │   ├── route.ts             # Get/Update/Delete
│           │   ├── versions/
│           │   │   └── route.ts         # Version management
│           │   └── audit/
│           │       └── route.ts         # History
│           └── version/
│               └── [versionId]/
│                   └── status/
│                       └── route.ts     # Status change
├── lib/
│   ├── db.ts                           # Database client
│   ├── bomService.ts                   # Business logic
│   └── bomApiClient.ts                 # Client API
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── dev.db                          # SQLite database (auto-created)
└── .env.local                          # Environment variables
```
