import { getDb } from "./db";
import { readAllMemories, seedMemoryFromFs } from "./memory";
import { getSnapshotSummary } from "./snapshots";

export async function buildFinancialContext(): Promise<string> {
  await seedMemoryFromFs();
  const prisma = await getDb();
  const [income, investments, creditCards, loans, bills, savings, memories, snapshots] =
    await Promise.all([
      prisma.income.findMany(),
      prisma.investment.findMany(),
      prisma.creditCard.findMany(),
      prisma.loan.findMany(),
      prisma.bill.findMany(),
      prisma.savingsGoal.findMany(),
      readAllMemories(),
      getSnapshotSummary(),
    ]);

  const context = `
## User's Financial Data

### Income Sources
${income.length > 0 ? income.map((i) => `- ${i.source}: $${i.amount.toFixed(2)}/${i.frequency}${i.notes ? ` (${i.notes})` : ""}`).join("\n") : "- No income recorded yet"}

### Investments
${investments.length > 0 ? investments.map((i) => `- ${i.name} (${i.type}): $${i.currentValue.toFixed(2)}${i.ticker ? ` [${i.ticker}]` : ""}${i.shares ? `, ${i.shares} shares` : ""}${i.costBasis ? `, cost basis: $${i.costBasis.toFixed(2)}` : ""}${i.notes ? ` (${i.notes})` : ""}`).join("\n") : "- No investments recorded yet"}

### Credit Cards
${creditCards.length > 0 ? creditCards.map((c) => `- ${c.name}: Balance $${c.balance.toFixed(2)} / Limit $${c.limit.toFixed(2)}, APR ${c.apr}%, Min Payment $${c.minPayment.toFixed(2)}${c.notes ? ` (${c.notes})` : ""}`).join("\n") : "- No credit cards recorded yet"}

### Loans
${loans.length > 0 ? loans.map((l) => `- ${l.name} (${l.type}): Balance $${l.balance.toFixed(2)}, Rate ${l.interestRate}%, Monthly Payment $${l.monthlyPayment.toFixed(2)}${l.termMonths ? `, ${l.termMonths} months remaining` : ""}${l.notes ? ` (${l.notes})` : ""}`).join("\n") : "- No loans recorded yet"}

### Monthly Bills
${bills.length > 0 ? bills.map((b) => `- ${b.name}: $${b.amount.toFixed(2)}/${b.frequency} (${b.category})${b.notes ? ` (${b.notes})` : ""}`).join("\n") : "- No bills recorded yet"}

### Savings Goals
${savings.length > 0 ? savings.map((s) => `- ${s.name}: $${s.currentAmount.toFixed(2)} / $${s.targetAmount.toFixed(2)}${s.targetDate ? ` (target: ${s.targetDate})` : ""}${s.notes ? ` (${s.notes})` : ""}`).join("\n") : "- No savings goals recorded yet"}

## User's Memory (Goals, Decisions, Focus, Preferences)
${memories || "No memories recorded yet."}

${snapshots}

## Financial Summary
- Total Monthly Income: $${income.filter((i) => i.frequency === "monthly").reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
- Total Investment Value: $${investments.reduce((sum, i) => sum + i.currentValue, 0).toFixed(2)}
- Total Credit Card Debt: $${creditCards.reduce((sum, c) => sum + c.balance, 0).toFixed(2)}
- Total Loan Debt: $${loans.reduce((sum, l) => sum + l.balance, 0).toFixed(2)}
- Total Monthly Bills: $${bills.filter((b) => b.frequency === "monthly").reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
- Total Savings: $${savings.reduce((sum, s) => sum + s.currentAmount, 0).toFixed(2)}
`.trim();

  return context;
}
