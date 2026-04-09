import { PrismaClient } from "../generated/prisma/client";
import { Role } from "../generated/prisma/enums";
import bcrypt from "bcryptjs";
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";


const connectionString = process.env.DATABASE_URL

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding started...");

  // Admin 
  const hashedPassword = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ecospark.com" },
    update: {},
    create: {
      name: "EcoSpark Admin",
      email: "admin@ecospark.com",
      password: hashedPassword,
      role: Role.ADMIN,
      profileImage: null,
    },
  });

  console.log("✅ Admin created:", admin.email);

  // Test Member 
  const memberPassword = await bcrypt.hash("member123456", 12);

  const member = await prisma.user.upsert({
    where: { email: "member@ecospark.com" },
    update: {},
    create: {
      name: "Test Member",
      email: "member@ecospark.com",
      password: memberPassword,
      role: Role.MEMBER,
    },
  });

  console.log("✅ Test member created:", member.email);

  // Categories
  const categories = [
    "Energy",
    "Waste",
    "Transportation",
    "Water",
    "Agriculture",
    "Biodiversity",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Categories created:", categories.join(", "));
  console.log("🌿 Seeding completed!");
  console.log("Admin     → admin@ecospark.com   / admin123456");
  console.log("Member    → member@ecospark.com  / member123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
