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
    { label: "Net Worth", value: data.netWorth, color: data.netWorth >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Monthly Cash Flow", value: data.monthlyCashFlow, color: data.monthlyCashFlow >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Total Investments", value: data.totalInvestments, color: "text-blue-400" },
    { label: "Total Debt", value: data.totalCreditCardDebt + data.totalLoanDebt, color: "text-red-400" },
    { label: "Monthly Bills", value: data.totalMonthlyBills, color: "text-orange-400" },
    { label: "Savings", value: data.totalSavings, color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>
            ${card.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      ))}
    </div>
  );
}
