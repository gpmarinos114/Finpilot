export type ProviderName = "mimo" | "deepseek" | "minimax";

export interface FinancialSummary {
  totalIncome: number;
  totalInvestments: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  totalMonthlyBills: number;
  totalSavings: number;
  netWorth: number;
  monthlyCashFlow: number;
  debtToIncomeRatio: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolName?: string | null;
  provider?: string | null;
  createdAt: Date;
}

export interface MemoryFile {
  path: string;
  content: string;
  preview: string;
}
