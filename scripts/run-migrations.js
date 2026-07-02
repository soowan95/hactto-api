require('dotenv').config();
const { execSync } = require('child_process');

function runMigrations() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  if (!host || !user || !password || !database) {
    console.error("Missing required database environment variables.");
    process.exit(1);
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  
  // Construct Prisma connection string
  const dbUrl = `mysql://${encodedUser}:${encodedPassword}@${host}:3306/${database}?sslaccept=accept_invalid_certs`;

  console.log("Starting Prisma Migration...");
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit'
    });
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed.");
    process.exit(1);
  }
}

runMigrations();
