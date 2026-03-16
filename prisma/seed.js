const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a super admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@example.com",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("✓ Created Super Admin:", superAdmin.email);

  // Create a regular admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Regular Admin",
      email: "user@example.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("✓ Created Regular Admin:", admin.email);

  console.log("\nSeeding complete! 🌱");
  console.log("\nYou can login with:");
  console.log("  Super Admin: admin@example.com / admin123");
  console.log("  Regular Admin: user@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
