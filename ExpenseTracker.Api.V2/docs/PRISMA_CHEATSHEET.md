# Prisma Quick Reference Card

## 🚀 Daily Commands

```bash
# Most common workflow
npm run db:migrate          # Create migration after schema changes
npm run db:generate         # Update TypeScript types
npm run db:studio          # Open database GUI

# Quick prototyping (no migration)
npm run db:push            # Push schema directly (dev only)
```

## 📋 Complete Workflow

### 1. Schema Change → Migration

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run db:migrate
# Enter name: "add_category_color_field"
# 3. Generate types
npm run db:generate
```

### 2. Production Deployment

```bash
npm run db:migrate:status   # Check pending migrations
npm run db:migrate:deploy   # Apply to production
```

## 🔧 Troubleshooting

```bash
# Check status
npm run db:migrate:status

# Reset development database (DANGEROUS)
npm run db:migrate:reset

# Fix type generation issues
rm -rf node_modules/.prisma/client
npm run db:generate
```

## 💡 Pro Tips

1. **Always run `db:generate` after schema changes**
2. **Use `db:studio` to visually inspect data**
3. **Never run `db:reset` in production**
4. **Commit migration files to git**
5. **Use descriptive migration names**

## 🏗️ Schema Patterns

```prisma
// Table mapping
model User {
  id    String @id @default(uuid())
  email String @unique
  @@map("users")  // Maps to existing table
}

// Relations
model Expense {
  userId String
  user   User   @relation(fields: [userId], references: [id])
}

// Indexes
model Transaction {
  userId String
  date   DateTime

  @@index([userId])
  @@index([userId, date])
}
```

---

_Keep this handy for quick reference!_
