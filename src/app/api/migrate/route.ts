import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const prisma = await getDb();

  const [income, investments, creditCards, loans, bills, savings, memoryFiles, snapshots, chatSessions, chatMessages, settings] =
    await Promise.all([
      prisma.income.findMany(),
      prisma.investment.findMany(),
      prisma.creditCard.findMany(),
      prisma.loan.findMany(),
      prisma.bill.findMany(),
      prisma.savingsGoal.findMany(),
      prisma.memoryFile.findMany(),
      prisma.snapshot.findMany(),
      prisma.chatSession.findMany(),
      prisma.chatMessage.findMany(),
      prisma.setting.findMany(),
    ]);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    income,
    investments,
    creditCards,
    loans,
    bills,
    savings,
    memoryFiles,
    snapshots,
    chatSessions,
    chatMessages,
    settings,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="finpilot-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();

  if (!data.version) {
    return NextResponse.json({ error: "Invalid export file" }, { status: 400 });
  }

  const results: Record<string, number> = {};

  // Import settings (skip DB_BACKEND, TURSO_URL, TURSO_TOKEN — those are local config)
  if (data.settings) {
    const skipKeys = ["DB_BACKEND", "TURSO_URL", "TURSO_TOKEN"];
    for (const s of data.settings) {
      if (skipKeys.includes(s.key)) continue;
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }
    results.settings = data.settings.length;
  }

  // Import income
  if (data.income) {
    for (const item of data.income) {
      await prisma.income.upsert({
        where: { id: item.id },
        update: { source: item.source, amount: item.amount, frequency: item.frequency, notes: item.notes },
        create: { id: item.id, source: item.source, amount: item.amount, frequency: item.frequency, notes: item.notes },
      });
    }
    results.income = data.income.length;
  }

  // Import investments
  if (data.investments) {
    for (const item of data.investments) {
      await prisma.investment.upsert({
        where: { id: item.id },
        update: { name: item.name, type: item.type, ticker: item.ticker, shares: item.shares, costBasis: item.costBasis, currentValue: item.currentValue, notes: item.notes },
        create: { id: item.id, name: item.name, type: item.type, ticker: item.ticker, shares: item.shares, costBasis: item.costBasis, currentValue: item.currentValue, notes: item.notes },
      });
    }
    results.investments = data.investments.length;
  }

  // Import credit cards
  if (data.creditCards) {
    for (const item of data.creditCards) {
      await prisma.creditCard.upsert({
        where: { id: item.id },
        update: { name: item.name, balance: item.balance, limit: item.limit, apr: item.apr, minPayment: item.minPayment, notes: item.notes },
        create: { id: item.id, name: item.name, balance: item.balance, limit: item.limit, apr: item.apr, minPayment: item.minPayment, notes: item.notes },
      });
    }
    results.creditCards = data.creditCards.length;
  }

  // Import loans
  if (data.loans) {
    for (const item of data.loans) {
      await prisma.loan.upsert({
        where: { id: item.id },
        update: { name: item.name, type: item.type, balance: item.balance, interestRate: item.interestRate, monthlyPayment: item.monthlyPayment, termMonths: item.termMonths, notes: item.notes },
        create: { id: item.id, name: item.name, type: item.type, balance: item.balance, interestRate: item.interestRate, monthlyPayment: item.monthlyPayment, termMonths: item.termMonths, notes: item.notes },
      });
    }
    results.loans = data.loans.length;
  }

  // Import bills
  if (data.bills) {
    for (const item of data.bills) {
      await prisma.bill.upsert({
        where: { id: item.id },
        update: { name: item.name, amount: item.amount, category: item.category, frequency: item.frequency, notes: item.notes },
        create: { id: item.id, name: item.name, amount: item.amount, category: item.category, frequency: item.frequency, notes: item.notes },
      });
    }
    results.bills = data.bills.length;
  }

  // Import savings
  if (data.savings) {
    for (const item of data.savings) {
      await prisma.savingsGoal.upsert({
        where: { id: item.id },
        update: { name: item.name, targetAmount: item.targetAmount, currentAmount: item.currentAmount, targetDate: item.targetDate, notes: item.notes },
        create: { id: item.id, name: item.name, targetAmount: item.targetAmount, currentAmount: item.currentAmount, targetDate: item.targetDate, notes: item.notes },
      });
    }
    results.savings = data.savings.length;
  }

  // Import memory files
  if (data.memoryFiles) {
    for (const item of data.memoryFiles) {
      await prisma.memoryFile.upsert({
        where: { path: item.path },
        update: { content: item.content },
        create: { path: item.path, content: item.content },
      });
    }
    results.memoryFiles = data.memoryFiles.length;
  }

  // Import snapshots
  if (data.snapshots) {
    for (const item of data.snapshots) {
      await prisma.snapshot.upsert({
        where: { date: item.date },
        update: {
          totalIncome: item.totalIncome, totalInvestments: item.totalInvestments,
          totalCreditCardDebt: item.totalCreditCardDebt, totalLoanDebt: item.totalLoanDebt,
          totalMonthlyBills: item.totalMonthlyBills, totalSavings: item.totalSavings,
          netWorth: item.netWorth, monthlyCashFlow: item.monthlyCashFlow,
          details: item.details,
        },
        create: {
          date: item.date, totalIncome: item.totalIncome, totalInvestments: item.totalInvestments,
          totalCreditCardDebt: item.totalCreditCardDebt, totalLoanDebt: item.totalLoanDebt,
          totalMonthlyBills: item.totalMonthlyBills, totalSavings: item.totalSavings,
          netWorth: item.netWorth, monthlyCashFlow: item.monthlyCashFlow,
          details: item.details,
        },
      });
    }
    results.snapshots = data.snapshots.length;
  }

  // Import chat sessions
  if (data.chatSessions) {
    for (const item of data.chatSessions) {
      await prisma.chatSession.upsert({
        where: { id: item.id },
        update: { name: item.name },
        create: { id: item.id, name: item.name },
      });
    }
    results.chatSessions = data.chatSessions.length;
  }

  // Import chat messages
  if (data.chatMessages) {
    for (const item of data.chatMessages) {
      await prisma.chatMessage.upsert({
        where: { id: item.id },
        update: { role: item.role, content: item.content, toolName: item.toolName, provider: item.provider, sessionId: item.sessionId },
        create: { id: item.id, role: item.role, content: item.content, toolName: item.toolName, provider: item.provider, sessionId: item.sessionId },
      });
    }
    results.chatMessages = data.chatMessages.length;
  }

  return NextResponse.json({ success: true, imported: results });
}
