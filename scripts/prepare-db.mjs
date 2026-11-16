// Runs before every build: creates/updates the database tables and seeds demo
// data the first time (when there are no products yet). Safe to run repeatedly.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("npx prisma db push --skip-generate");

const prisma = new PrismaClient();
const count = await prisma.product.count().catch(() => 0);
await prisma.$disconnect();

if (count === 0) {
  console.log("Empty database – seeding demo catalogue…");
  run("npx tsx prisma/seed.ts");
} else {
  console.log(`Database ready (${count} products).`);
}
