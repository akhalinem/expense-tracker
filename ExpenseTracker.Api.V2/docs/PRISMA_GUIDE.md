# Prisma Development Guide

## 🚀 Quick Reference Commands

```bash
# Daily Development
npm run db:generate          # Generate Prisma client after schema changes
npm run db:migrate           # Create and apply new migration
npm run db:studio            # Open Prisma Studio (database GUI)
npm run db:migrate:status    # Check migration status

# Schema Development
npm run db:push             # Push schema changes without migration (dev only)
npm run db:format           # Format schema.prisma file
npm run db:introspect       # Pull changes from database to schema

# Production Deployment
npm run db:migrate:deploy   # Apply migrations in production

# Troubleshooting
npm run db:migrate:reset    # Reset database (DANGEROUS - loses data)
```

## Complete Development Workflow

### 1. **Making Schema Changes**

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
npm run db:migrate
# When prompted, enter descriptive name: "add_budget_table"

# 3. Generate updated types
npm run db:generate

# 4. Test your changes
npm run start:dev
```

### 2. **Quick Prototyping (No Migration)**

```bash
# For rapid development without migration files
npm run db:push
npm run db:generate
```

**⚠️ Warning:** `db:push` bypasses migration system - use only in development

### 3. **Viewing/Editing Data**

```bash
# Opens browser-based database GUI
npm run db:studio
```

### 4. **Production Deployment**

```bash
# Check what will be applied
npm run db:migrate:status

# Apply pending migrations
npm run db:migrate:deploy

# Verify deployment
npm run db:migrate:status
```

## Schema Best Practices

### Model Naming Conventions

```prisma
// ✅ Good
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  profile   Profile?
  expenses  Expense[]
  @@map("users")  // Maps to existing table
}

// ✅ Relations
model Expense {
  id       String @id @default(uuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id])
  @@map("expenses")
}
```

### Index Optimization

```prisma
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  amount      Decimal
  date        DateTime
  type        String

  @@index([userId])
  @@index([userId, date])
  @@index([type])
  @@map("transactions")
}
```

## Common Pitfalls & Solutions

### 1. **Migration Conflicts**

```bash
# If migration fails or conflicts
npm run db:migrate:status

# For development databases only:
npm run db:migrate:reset

# For production - never reset! Instead:
# 1. Create manual migration to fix conflict
# 2. Use npx prisma migrate resolve --applied <migration_name>
```

### 2. **Schema Drift Detection**

```bash
# Check if database schema matches Prisma schema
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

### 3. **Type Generation Issues**

```bash
# If types are outdated
npm run db:generate

# If still issues, delete node_modules/.prisma and regenerate
rm -rf node_modules/.prisma/client
npm run db:generate
```

## Environment Setup

### .env Variables Required

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=5&pool_timeout=10"
DIRECT_URL="postgresql://user:pass@host:5432/db?schema=public"  # For migrations

# Supabase (for auth only)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="xxx"
```

**Note:** We use a **hybrid approach**:

- **Prisma** for all database operations (categories, transactions, sync jobs)
- **Supabase** only for authentication (login, register, password reset)

### Migration from Supabase Database to Prisma

This project was migrated from Supabase database operations to Prisma while keeping Supabase for authentication. The benefits include:

✅ **Type Safety**: Full TypeScript support with generated types  
✅ **Performance**: Direct database connections with connection pooling  
✅ **Consistency**: All database operations use the same ORM  
✅ **Migration Management**: Proper schema versioning and deployment  
✅ **Query Optimization**: Better control over database queries

**What Changed:**

- Database queries: `supabase.from('table')` → `prisma.table.operation()`
- Type generation: Manual interfaces → Auto-generated Prisma types
- Schema management: Manual SQL → Prisma migrations
- Background jobs: Supabase client → Direct Prisma operations

**What Stayed the Same:**

- Authentication flows (login, register, password reset)
- User management and sessions
- Auth middleware and token validation

## Performance Tips

### 1. **Connection Pooling**

```typescript
// Global Prisma instance
import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 2. **Query Optimization**

```typescript
// ✅ Include related data in single query
const userWithExpenses = await prisma.user.findUnique({
  where: { id },
  include: {
    expenses: {
      take: 10,
      orderBy: { date: "desc" },
    },
  },
});

// ✅ Use select for specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    // Don't include heavy fields unless needed
  },
});
```

## Troubleshooting Guide

| Problem                      | Solution                                          |
| ---------------------------- | ------------------------------------------------- |
| "Schema file not found"      | Run from project root directory                   |
| "Database connection failed" | Check DATABASE_URL in .env                        |
| "Migration failed"           | Check database permissions, backup data first     |
| "Types not updating"         | Run `npm run db:generate`                         |
| "Prisma Studio won't start"  | Check port 5555 is available                      |
| "Schema drift detected"      | Use `npx prisma migrate diff` to identify changes |

## Deployment Checklist

- [ ] All migrations committed to version control
- [ ] DATABASE_URL and DIRECT_URL set in production
- [ ] Run `npm run db:migrate:deploy` in production
- [ ] Run `npm run db:generate` in production build process
- [ ] Test database connectivity after deployment
- [ ] Monitor application logs for Prisma errors

## Database Seeding

### Run Seed Script

```bash
npm run db:seed
```

### Custom Seed Data

Edit `prisma/seed.ts` to add your custom seed data for development/testing.

---

_Last Updated: September 6, 2025_
