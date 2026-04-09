# Next Steps - Frontend Integration Checklist

## Phase 3: Frontend Integration (Action Items)

After database setup, update the frontend components to use the new database API.

### 1. Install Dependencies ✅
```bash
npm install @prisma/client prisma -D
```

### 2. Update `app/page.tsx` (List page)

**Current Code**:
```typescript
const documents = initDocuments(); // From localStorage
```

**New Code**:
```typescript
import { bomApiClient } from '@/lib/bomApiClient';

const documents = await bomApiClient.listBom();
```

**Changes Needed**:
- [ ] Import `bomApiClient`
- [ ] Replace `initDocuments()` with `bomApiClient.listBom()`
- [ ] Update search to use `bomApiClient.listBom(query)`
- [ ] Replace `saveDocuments()` with `bomApiClient.createBom()`/`deleteBom()`

### 3. Update `app/bom/[id]/page.tsx` (Detail page)

**Changes Needed**:
- [ ] Replace `loadDocuments()` → `bomApiClient.getBom(id)`
- [ ] Replace `saveDocuments()` → `bomApiClient.updateBom(id, payload)`
- [ ] Update version list → `bomApiClient.getVersions(id)`
- [ ] Update create version → `bomApiClient.createVersion(id, payload)`
- [ ] Update audit history → `bomApiClient.getHistory(id)`

### 4. Update `context/BomContext.tsx` (State management)

**Changes Needed**:
- [ ] Replace localStorage calls with API calls
- [ ] Update `saveToStorage()` → use API
- [ ] Update `loadFromStorage()` → use API
- [ ] Add error handling for API failures
- [ ] Add loading states

### 5. Key Components to Update

#### `components/BomHeader.tsx`
- [ ] Save button → use `bomApiClient.updateBom()`

#### `components/VersionBar.tsx`
- [ ] Version dropdown → use `bomApiClient.getVersions()`
- [ ] Create version button → use `bomApiClient.createVersion()`
- [ ] Status change → use `bomApiClient.changeVersionStatus()`

#### `components/VersionDiffModal.tsx`
- [ ] Load version data → use API response

---

## Setup Database First ⏳

Before updating frontend, setup database:

```bash
# 1. Install
npm install @prisma/client prisma -D

# 2. Initialize
cp .env.example .env.local

# 3. Create database
npx prisma migrate dev --name init

# 4. Test API
curl http://localhost:3000/api/bom

# 5. View database
npx prisma studio
```

---

## Frontend Update Examples

### Example 1: Listing BOMs

**Before (localStorage)**:
```typescript
const documents = loadDocuments();
setDocuments(documents);
```

**After (Database)**:
```typescript
const documents = await bomApiClient.listBom();
setDocuments(documents.map(doc => ({
  id: doc.id,
  code: doc.code,
  name: doc.name,
  // ... map other fields
})));
```

### Example 2: Saving BOM

**Before (localStorage)**:
```typescript
saveDocuments(docs);
showToast('Saved');
```

**After (Database)**:
```typescript
try {
  await bomApiClient.updateBom(docId, {
    metadata,
    bomRows,
    hardwareRows,
    operations,
    packingRows,
    packingInfo,
  });
  showToast('Saved');
} catch (error) {
  showToast('Failed to save', 'error');
}
```

### Example 3: Creating New BOM

**Before (localStorage)**:
```typescript
const doc = createBlankDocument(name, code);
const updated = [...documents, doc];
saveDocuments(updated);
```

**After (Database)**:
```typescript
try {
  const newDoc = await bomApiClient.createBom({
    code,
    name,
    metadata: defaultMetadata,
    bomRows: [],
  });
  setDocuments([...documents, newDoc]);
} catch (error) {
  showToast('Failed to create', 'error');
}
```

---

## Error Handling Pattern

```typescript
try {
  const result = await bomApiClient.listBom();
  // Use result
} catch (error) {
  console.error('API Error:', error);
  showToast(
    error instanceof Error ? error.message : 'Operation failed',
    'error'
  );
  // Fallback or retry logic
}
```

---

## Migration Strategy

### Option A: Big Bang (Replace All)
- [ ] Complete all frontend updates at once
- [ ] Test thoroughly
- [ ] Deploy all together
- ⚠️ High risk, requires extensive testing

### Option B: Gradual Migration (Recommended)
- [ ] Update one page at a time
- [ ] Keep localStorage fallback
- [ ] Test each component
- [ ] Deploy incrementally
- ✅ Lower risk, easier debugging

### Option C: Feature Flags
- [ ] Add environment variable: `USE_DATABASE=true`
- [ ] Keep both implementations
- [ ] Switch gradually per endpoint
- [ ] Easy rollback if issues

---

## Testing Checklist

After each component update:

- [ ] ✅ Create BOM works
- [ ] ✅ Save/Update works  
- [ ] ✅ Delete works
- [ ] ✅ List/Search works
- [ ] ✅ Versions work
- [ ] ✅ Status changes work
- [ ] ✅ Audit history appears
- [ ] ✅ Error handling works
- [ ] ✅ No network errors
- [ ] ✅ Data persists after refresh

---

## Monitoring & Debugging

### View Database
```bash
npm run db:studio
# Opens http://localhost:5555
```

### Check API Response
```bash
# Terminal
curl http://localhost:3000/api/bom
curl http://localhost:3000/api/bom/[id]
```

### Browser DevTools
- Network tab: Check API calls
- Console: Check for errors
- Application: Check IndexedDB (if used)

### Prisma Logging
Update `lib/db.ts`:
```typescript
new PrismaClient({
  log: ['error', 'warn', 'info', 'query'], // Show SQL queries
})
```

---

## Database Backup Strategy

```bash
# Backup SQLite
cp prisma/dev.db prisma/dev.db.backup

# Backup PostgreSQL
pg_dump -U user bom_app > backup.sql

# Restore
psql -U user bom_app < backup.sql
```

---

## Common Issues & Solutions

### Issue: "TypeError: bomApiClient is not defined"
**Solution**: Import at top of file
```typescript
import { bomApiClient } from '@/lib/bomApiClient';
```

### Issue: "Cannot POST /api/bom - 404"
**Solution**: Ensure API route files exist:
- `app/api/bom/route.ts`
- `app/api/bom/[id]/route.ts`
- etc.

### Issue: "Database not found"
**Solution**: Run migrations
```bash
npx prisma migrate dev --name init
```

### Issue: "Prisma client out of date"
**Solution**: Regenerate client
```bash
npx prisma generate
```

---

## Performance Optimization

After integration, consider:
- [ ] Add caching layer (Redis)
- [ ] Paginate large lists
- [ ] Add indexes to frequently queried fields
- [ ] Implement lazy loading
- [ ] Add rate limiting to API
- [ ] Monitor database query performance

---

## Security Checklist

- [ ] Add authentication middleware
- [ ] Validate all inputs (Zod/joi)
- [ ] Add authorization checks
- [ ] Sanitize data
- [ ] Add rate limiting
- [ ] Use HTTPS in production
- [ ] Add CORS properly
- [ ] Hash sensitive data
- [ ] Audit sensitive operations

---

## Deployment Preparation

```bash
# Build
npm run build

# Test
npm run type-check
npm run test

# Deploy
npm run start
```

**Pre-deployment**:
- [ ] Test on staging
- [ ] Backup production database
- [ ] Have rollback plan
- [ ] Monitor after deploy

---

## Timeline Estimate

| Phase | Time | Status |
|-------|------|--------|
| Database Setup | 15 min | ✅ Ready |
| Frontend Integration | 2-4 hours | 📝 TODO |
| Testing | 1-2 hours | 📝 TODO |
| Deployment | 30 min | 📝 TODO |

---

## Timeline Actions

**This Week**:
1. [ ] Review this document
2. [ ] Setup database locally
3. [ ] Test API endpoints
4. [ ] Start updating `app/page.tsx`

**Next Week**:
1. [ ] Complete all component updates
2. [ ] Run integration tests
3. [ ] Deploy to staging
4. [ ] Final testing

**Following Week**:
1. [ ] Production deployment
2. [ ] Monitor for issues
3. [ ] Plan enhancements

---

## Questions?

Refer to:
- `docs/DATABASE_SETUP.md` - Setup help
- `docs/CRUD_IMPLEMENTATION.md` - API reference
- `docs/PACKAGE_SCRIPTS.md` - Commands
- `lib/bomApiClient.ts` - API method signatures

---

**Start Date**: Today
**Target Completion**: End of this week
**Status**: Ready to begin frontend integration
