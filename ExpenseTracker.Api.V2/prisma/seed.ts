import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Example: Create sample categories
  const categories = [
    { name: "Food & Dining", color: "#FF6B6B" },
    { name: "Transportation", color: "#4ECDC4" },
    { name: "Shopping", color: "#45B7D1" },
    { name: "Entertainment", color: "#96CEB4" },
    { name: "Bills & Utilities", color: "#FECA57" },
  ];

  console.log("📝 Seeding sample data...");

  // Add your seeding logic here
  // Example:
  // for (const category of categories) {
  //   await prisma.categories.upsert({
  //     where: { user_id_name: { user_id: 'sample-user-id', name: category.name } },
  //     update: {},
  //     create: {
  //       user_id: 'sample-user-id',
  //       name: category.name,
  //       color: category.color,
  //     },
  //   });
  // }

  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
