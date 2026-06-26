import { getDb } from "./db";

interface SnapshotData {
  totalIncome: number;
  totalInvestments: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  totalMonthlyBills: number;
  totalSavings: number;
  netWorth: number;
  monthlyCashFlow: number;
  details: {
    income: { source: string; amount: number; frequency: string }[];
    investments: { name: string; type: string; currentValue: number }[];
    creditCards: { name: string; balance: number; limit: number }[];
    loans: { name: string; type: string; balance: number; monthlyPayment: number }[];
    bills: { name: string; amount: number; frequency: string }[];
    savings: { name: string; currentAmount: number; targetAmount: number }[];
  };
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function captureSnapshot(force = false): Promise<boolean> {
  const prisma = await getDb();
  const date = todayStr();

  if (!force) {
    const existing = await prisma.snapshot.findUnique({ where: { date } });
    if (existing) return false;
  }

  const [income, investments, creditCards, loans, bills, savings] = await Promise.all([
    prisma.income.findMany(),
    prisma.investment.findMany(),
    prisma.creditCard.findMany(),
    prisma.loan.findMany(),
    prisma.bill.findMany(),
    prisma.savingsGoal.findMany(),
  ]);

  const totalIncome = income
    .filter((i) => i.frequency === "monthly")
    .reduce((s, i) => s + i.amount, 0);
  const totalInvestments = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalCreditCardDebt = creditCards.reduce((s, c) => s + c.balance, 0);
  const totalLoanDebt = loans.reduce((s, l) => s + l.balance, 0);
  const totalMonthlyBills = bills
    .filter((b) => b.frequency === "monthly")
    .reduce((s, b) => s + b.amount, 0);
  const totalSavings = savings.reduce((s, g) => s + g.currentAmount, 0);
  const netWorth = totalInvestments + totalSavings - totalCreditCardDebt - totalLoanDebt;
  const monthlyCashFlow =
    totalIncome -
    totalMonthlyBills -
    loans.reduce((s, l) => s + l.monthlyPayment, 0) -
    creditCards.reduce((s, c) => s + c.minPayment, 0);

  const details: SnapshotData["details"] = {
    income: income.map((i) => ({ source: i.source, amount: i.amount, frequency: i.frequency })),
    investments: investments.map((i) => ({ name: i.name, type: i.type, currentValue: i.currentValue })),
    creditCards: creditCards.map((c) => ({ name: c.name, balance: c.balance, limit: c.limit })),
    loans: loans.map((l) => ({ name: l.name, type: l.type, balance: l.balance, monthlyPayment: l.monthlyPayment })),
    bills: bills.map((b) => ({ name: b.name, amount: b.amount, frequency: b.frequency })),
    savings: savings.map((s) => ({ name: s.name, currentAmount: s.currentAmount, targetAmount: s.targetAmount })),
  };

  await prisma.snapshot.upsert({
    where: { date },
    update: {
      totalIncome, totalInvestments, totalCreditCardDebt, totalLoanDebt,
      totalMonthlyBills, totalSavings, netWorth, monthlyCashFlow,
      details: JSON.stringify(details),
    },
    create: {
      date, totalIncome, totalInvestments, totalCreditCardDebt, totalLoanDebt,
      totalMonthlyBills, totalSavings, netWorth, monthlyCashFlow,
      details: JSON.stringify(details),
    },
  });

  return true;
}

export async function getSnapshotHistory(limit = 30) {
  const prisma = await getDb();
  const snapshots = await prisma.snapshot.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
  return snapshots.map((s) => ({
    ...s,
    details: JSON.parse(s.details),
  }));
}

export async function getSnapshotSummary(): Promise<string> {
  const snapshots = await getSnapshotHistory(12);
  if (snapshots.length === 0) return "No snapshot history available.";

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  let summary = `## Financial Snapshot History (${snapshots.length} snapshots)\n\n`;
  summary += `### Latest (${latest.date})\n`;
  summary += `- Net Worth: $${latest.netWorth.toFixed(2)}\n`;
  summary += `- Monthly Cash Flow: $${latest.monthlyCashFlow.toFixed(2)}\n`;
  summary += `- Total Investments: $${latest.totalInvestments.toFixed(2)}\n`;
  summary += `- Total Savings: $${latest.totalSavings.toFixed(2)}\n`;
  summary += `- Total Debt: $${(latest.totalCreditCardDebt + latest.totalLoanDebt).toFixed(2)}\n`;

  if (snapshots.length > 1 && oldest.date !== latest.date) {
    const netWorthChange = latest.netWorth - oldest.netWorth;
    const debtChange = (latest.totalCreditCardDebt + latest.totalLoanDebt) -
                       (oldest.totalCreditCardDebt + oldest.totalLoanDebt);
    const savingsChange = latest.totalSavings - oldest.totalSavings;

    summary += `\n### Trend (since ${oldest.date})\n`;
    summary += `- Net Worth: ${netWorthChange >= 0 ? "+" : ""}$${netWorthChange.toFixed(2)}\n`;
    summary += `- Total Debt: ${debtChange <= 0 ? "" : "+"}$${debtChange.toFixed(2)}\n`;
    summary += `- Savings: ${savingsChange >= 0 ? "+" : ""}$${savingsChange.toFixed(2)}\n`;
  }

  return summary;
}
