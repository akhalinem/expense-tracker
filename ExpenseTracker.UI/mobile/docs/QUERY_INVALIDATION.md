# Query Invalidation System

## Overview

This document describes the query invalidation system used to maintain data consistency across the mobile app after major data operations like sync and data import/export.

## Purpose

The query invalidation system ensures that:

- UI components display fresh data after sync operations
- Imported data immediately appears across all screens
- Database clearing operations properly reset the UI state
- No stale cached data is shown to users

## Architecture

### Core Components

1. **QueryInvalidationService** (`~/services/queryInvalidation.ts`)

   - Centralized service for managing query invalidation
   - Singleton pattern for global access
   - Handles both specific and global invalidation

2. **Integration Points**
   - Sync Service (`~/services/sync.ts`)
   - Data Transfer Service (`~/services/data-transfer.ts`)
   - App Layout (`~/app/_layout.tsx`)

### Query Keys Registry

All React Query keys used in the app are documented in `QUERY_KEYS`:

```typescript
export const QUERY_KEYS = {
  CATEGORIES: ['categories'],
  CATEGORIES_WITH_TRANSACTION_COUNT: ['categoriesWithTransactionsCount'],
  TRANSACTIONS: ['transactions'],
  RECORDINGS: ['recordings'],
  EXPENSE_SUGGESTIONS: ['expenseSuggestions'],
  // Add new keys here when adding new queries
} as const;
```

## When Queries Are Invalidated

### Automatic Invalidation Triggers

1. **After Sync Operations**:

   - Full sync completion
   - Upload data completion
   - Download data completion
   - Called via `invalidateAfterSync()`

2. **After Data Import**:

   - XLSX file import completion
   - Only when data was actually imported (categories.added > 0 || expenses.added > 0 || incomes.added > 0)
   - Called via `invalidateAfterImport()`

3. **After Database Operations**:
   - Database clearing (`clearDb()`)
   - Called via `invalidateAllQueries()`

### Implementation Examples

```typescript
// In sync service
try {
  // ... sync logic
  console.log('✅ Sync completed successfully');
} finally {
  // Always invalidate after sync
  await queryInvalidationService.invalidateAfterSync();
}

// In data transfer service
if (
  importResult.categories.added > 0 ||
  importResult.expenses.added > 0 ||
  importResult.incomes.added > 0
) {
  console.log('🔄 Invalidating queries after successful import...');
  await queryInvalidationService.invalidateAfterImport();
}
```

## How It Works

### Initialization

The service is initialized in the app's root layout:

```typescript
// In _layout.tsx
export default function RootLayout() {
  const queryClient = new QueryClient(/* config */);

  // Initialize query invalidation service
  queryInvalidationService.setQueryClient(queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {/* app content */}
    </QueryClientProvider>
  );
}
```

### Invalidation Methods

1. **Global Invalidation** (Recommended for major operations)

   ```typescript
   await queryInvalidationService.invalidateAllQueries();
   ```

2. **Specific Invalidation** (For targeted updates)

   ```typescript
   await queryInvalidationService.invalidateCategories();
   await queryInvalidationService.invalidateTransactions();
   ```

3. **Custom Query Invalidation**
   ```typescript
   await queryInvalidationService.invalidateQuery(['custom-key']);
   ```

## ⚠️ CRITICAL MAINTENANCE REQUIREMENTS

### When Adding New Query Keys

**YOU MUST UPDATE THE SYSTEM** when adding new React Query hooks to the app:

1. **Add to QUERY_KEYS constant**:

   ```typescript
   export const QUERY_KEYS = {
     // ... existing keys
     NEW_FEATURE: ['newFeature'], // ADD HERE
   } as const;
   ```

2. **Consider specific invalidation method** (optional):

   ```typescript
   async invalidateNewFeature(): Promise<void> {
     // Implementation for targeted invalidation
   }
   ```

3. **Test invalidation behavior**:
   - Verify data refreshes after sync
   - Verify data refreshes after import
   - Check console logs for invalidation messages

### Testing Invalidation

1. **Sync Testing**:

   - Make changes in another client/web app
   - Perform sync in mobile app
   - Verify UI updates with new data

2. **Import Testing**:

   - Import XLSX file with new data
   - Verify all screens show imported data immediately
   - Check that counts and statistics update

3. **Clear Database Testing**:
   - Clear database via settings
   - Verify all screens show empty state
   - Ensure no cached data remains visible

## Debugging

### Console Logs

The service provides detailed logging:

```
🔄 Invalidating all queries...
✅ All queries invalidated successfully

🔄 Post-sync query invalidation...
🔄 Post-import query invalidation...
```

### Common Issues

1. **Stale Data After Sync**:

   - Check if new query keys were added without updating invalidation
   - Verify sync service calls `invalidateAfterSync()`
   - Check console for invalidation logs

2. **Import Data Not Showing**:

   - Verify import service calls `invalidateAfterImport()`
   - Check import condition (only invalidates if data was actually imported)
   - Ensure QueryClient is properly initialized

3. **Performance Issues**:
   - Global invalidation (`invalidateAllQueries()`) refetches all active queries
   - Consider specific invalidation methods for frequent operations
   - Monitor query refetch behavior in React Query DevTools

## Best Practices

1. **Use Global Invalidation for Major Operations**:

   - Sync operations (safest approach)
   - Data import/export
   - Database migrations

2. **Use Specific Invalidation for Targeted Updates**:

   - Single record updates
   - Category-specific changes
   - Small, focused operations

3. **Always Update Documentation**:

   - Add new query keys to this document
   - Update QUERY_KEYS constant
   - Test invalidation behavior

4. **Monitor Performance**:
   - Watch for unnecessary refetches
   - Use React Query DevTools in development
   - Consider query staleTime and cacheTime settings

## Migration Guide

If you need to add a new query to the app:

1. **Create the query hook**:

   ```typescript
   export const useNewFeatureData = () => {
     return useQuery({
       queryKey: ['newFeature'], // 1. Define key
       queryFn: fetchNewFeatureData,
     });
   };
   ```

2. **Add to QUERY_KEYS**:

   ```typescript
   export const QUERY_KEYS = {
     // ... existing
     NEW_FEATURE: ['newFeature'], // 2. Add here
   } as const;
   ```

3. **Test invalidation**:

   - Import data that affects this query
   - Perform sync operation
   - Verify the query refetches and UI updates

4. **Update this documentation** with the new query key and its purpose.

---

**Remember**: The goal is to ensure users always see fresh, consistent data across all screens after major data operations. When in doubt, prefer global invalidation for reliability.
