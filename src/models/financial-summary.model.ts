export interface FinancialSummary {
  period: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  expensesByCategory: CategoryExpense[];
  incomeByCategory: CategoryIncome[];
  dailyAverage: number;
  projection: {
    estimatedExpenses: number;
    estimatedIncome: number;
    estimatedBalance: number;
  };
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  transactionCount: number;
  budget?: number;
  remaining?: number;
}

export interface CategoryIncome {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyComparison {
  currentMonth: FinancialSummary;
  previousMonth: FinancialSummary;
  incomeChange: number; // percentual
  expenseChange: number; // percentual
  balanceChange: number; // percentual
}
