import 'dotenv/config';
import { prisma } from '../src/libs/prisma';

async function main() {
  console.log("Fixing migration for prediction table...");
  try {
    await prisma.$executeRawUnsafe("ALTER TABLE `prediction` CHANGE `visitor_id` `user_id` VARCHAR(191) NULL;");
    console.log("prediction fixed.");
  } catch (e) { console.log(e.message); }

  try {
    await prisma.$executeRawUnsafe("ALTER TABLE `subscription` CHANGE `visitor_id` `user_id` VARCHAR(191) NOT NULL;");
    console.log("subscription fixed.");
  } catch (e) { console.log(e.message); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`login_fail_log\` (
          \`id\` INTEGER NOT NULL AUTO_INCREMENT,
          \`ip\` VARCHAR(191) NOT NULL,
          \`fail_count\` INTEGER NOT NULL DEFAULT 1,
          \`last_failed_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updated_at\` DATETIME(3) NOT NULL,
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("login_fail_log created.");
  } catch (e) { console.log(e.message); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`privacy_policy\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`version\` VARCHAR(191) NOT NULL,
          \`content\` TEXT NOT NULL,
          \`is_active\` BOOLEAN NOT NULL DEFAULT false,
          \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updated_at\` DATETIME(3) NOT NULL,
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("privacy_policy created.");
  } catch (e) { console.log(e.message); }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`terms_of_service\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`version\` VARCHAR(191) NOT NULL,
          \`content\` TEXT NOT NULL,
          \`is_active\` BOOLEAN NOT NULL DEFAULT false,
          \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updated_at\` DATETIME(3) NOT NULL,
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log("terms_of_service created.");
  } catch (e) { console.log(e.message); }

  console.log("All manual fixes applied!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
