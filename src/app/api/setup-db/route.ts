import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST() {
  try {
    const prisma = await getDb();
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Income" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "source" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "frequency" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Investment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "ticker" TEXT,
        "shares" REAL,
        "costBasis" REAL,
        "currentValue" REAL NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditCard" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "balance" REAL NOT NULL,
        "limit" REAL NOT NULL,
        "apr" REAL NOT NULL,
        "minPayment" REAL NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Loan" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "balance" REAL NOT NULL,
        "interestRate" REAL NOT NULL,
        "monthlyPayment" REAL NOT NULL,
        "termMonths" INTEGER,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Bill" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "category" TEXT NOT NULL,
        "frequency" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SavingsGoal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "targetAmount" REAL NOT NULL,
        "currentAmount" REAL NOT NULL,
        "targetDate" TEXT,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "toolName" TEXT,
        "toolCallId" TEXT,
        "provider" TEXT,
        "sessionId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Add toolCallId column if it doesn't exist (for existing databases)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "ChatMessage" ADD COLUMN "toolCallId" TEXT`);
    } catch { /* column already exists */ }
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MemoryFile" (
        "path" TEXT NOT NULL PRIMARY KEY,
        "content" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Snapshot" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "date" TEXT NOT NULL UNIQUE,
        "totalIncome" REAL NOT NULL,
        "totalInvestments" REAL NOT NULL,
        "totalCreditCardDebt" REAL NOT NULL,
        "totalLoanDebt" REAL NOT NULL,
        "totalMonthlyBills" REAL NOT NULL,
        "totalSavings" REAL NOT NULL,
        "netWorth" REAL NOT NULL,
        "monthlyCashFlow" REAL NOT NULL,
        "details" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return NextResponse.json({ success: true, message: "All tables created" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
