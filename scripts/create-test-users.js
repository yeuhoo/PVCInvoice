const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test user accounts...\n");

  // Get existing brokers
  const brokers = await prisma.broker.findMany();
  console.log(`Found ${brokers.length} brokers in database\n`);

  // Create test admin accounts
  const adminAccounts = [
    {
      name: "John Admin",
      email: "admin1@example.com",
      password: "admin123",
      role: "ADMIN",
    },
    {
      name: "Sarah Admin",
      email: "admin2@example.com",
      password: "admin123",
      role: "ADMIN",
    },
  ];

  console.log("Creating Admin accounts...");
  for (const account of adminAccounts) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: account.email },
      });

      if (existing) {
        console.log(`  ✓ ${account.name} (${account.email}) - Already exists`);
        continue;
      }

      const passwordHash = await bcrypt.hash(account.password, 10);
      const user = await prisma.user.create({
        data: {
          name: account.name,
          email: account.email,
          passwordHash,
          role: account.role,
        },
      });
      console.log(`  ✓ Created: ${account.name} (${account.email})`);
    } catch (error) {
      console.log(`  ✗ Error creating ${account.name}: ${error.message}`);
    }
  }

  // Create broker accounts if brokers exist
  if (brokers.length > 0) {
    console.log("\nCreating Broker accounts...");

    // Get users that are already linked to brokers
    const linkedBrokerIds = await prisma.user.findMany({
      where: { linkedBrokerId: { not: null } },
      select: { linkedBrokerId: true },
    });
    const usedBrokerIds = linkedBrokerIds.map((u) => u.linkedBrokerId);

    // Filter out brokers that already have users
    const availableBrokers = brokers.filter(
      (b) => !usedBrokerIds.includes(b.id),
    );

    if (availableBrokers.length === 0) {
      console.log("  All brokers already have user accounts");
    } else {
      // Create broker users for first 2 available brokers
      const brokersToCreate = availableBrokers.slice(0, 2);

      for (let i = 0; i < brokersToCreate.length; i++) {
        const broker = brokersToCreate[i];
        const brokerAccount = {
          name: `${broker.name} Account`,
          email: `broker${i + 1}@example.com`,
          password: "broker123",
          role: "BROKER",
          linkedBrokerId: broker.id,
        };

        try {
          const existing = await prisma.user.findUnique({
            where: { email: brokerAccount.email },
          });

          if (existing) {
            console.log(
              `  ✓ ${brokerAccount.name} (${brokerAccount.email}) - Already exists`,
            );
            continue;
          }

          const passwordHash = await bcrypt.hash(brokerAccount.password, 10);
          const user = await prisma.user.create({
            data: {
              name: brokerAccount.name,
              email: brokerAccount.email,
              passwordHash,
              role: brokerAccount.role,
              linkedBrokerId: brokerAccount.linkedBrokerId,
            },
          });
          console.log(
            `  ✓ Created: ${brokerAccount.name} (${brokerAccount.email})`,
          );
          console.log(`    Linked to broker: ${broker.name}`);
        } catch (error) {
          console.log(
            `  ✗ Error creating ${brokerAccount.name}: ${error.message}`,
          );
        }
      }
    }
  } else {
    console.log(
      "\nNo brokers found. Create some brokers first to add broker accounts.",
    );
  }

  console.log("\n✅ Test user creation complete!\n");
  console.log("=".repeat(60));
  console.log("TEST ACCOUNTS SUMMARY:");
  console.log("=".repeat(60));
  console.log("\n📋 ADMIN ACCOUNTS:");
  console.log("  Email: admin1@example.com | Password: admin123");
  console.log("  Email: admin2@example.com | Password: admin123");

  if (brokers.length > 0) {
    console.log("\n🔑 BROKER ACCOUNTS:");
    console.log("  Email: broker1@example.com | Password: broker123");
    console.log("  Email: broker2@example.com | Password: broker123");
  }

  console.log("\n💎 SUPER ADMIN ACCOUNT:");
  console.log("  Email: admin@example.com | Password: admin123");
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
