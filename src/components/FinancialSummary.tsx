"use client";

interface SummaryProps {
  data: {
    totalIncome: number;
    totalInvestments: number;
    totalCreditCardDebt: number;
    totalLoanDebt: number;
    totalMonthlyBills: number;
    totalSavings: number;
    netWorth: number;
    monthlyCashFlow: number;
    debtToIncomeRatio: number;
  };
}

export default function FinancialSummary({ data }: SummaryProps) {
  const cards = [
    { label: "Net Worth", value: data.netWorth, color: data.netWorth >= 0 ? "text-ok" : "text-err" },
    { label: "Monthly Cash Flow", value: data.monthlyCashFlow, color: data.monthlyCashFlow >= 0 ? "text-ok" : "text-err" },
    { label: "Total Investments", value: data.totalInvestments, color: "text-accent" },
    { label: "Total Debt", value: data.totalCreditCardDebt + data.totalLoanDebt, color: "text-err" },
    { label: "Monthly Bills", value: data.totalMonthlyBills, color: "text-warn" },
    { label: "Savings", value: data.totalSavings, color: "text-ok" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-base-200 rounded-lg p-3 border border-base-500">
          <p className="text-xs txt-muted mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>
            ${card.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      ))}
    </div>
  );
}
