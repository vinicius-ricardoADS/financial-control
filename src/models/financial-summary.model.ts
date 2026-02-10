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
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

// ============================================
// Interfaces para endpoints da API de Reports
// ============================================

// Transação simplificada retornada pelos endpoints
export interface ReportTransaction {
  id: number;
  description: string;
  value: number;
  date: string;
  category_name: string;
  category_icon: string;
  payment_method: string;
  payment_status: string;
}

// /reportMonthlycomparison
export interface MonthlyComparisonData {
  month: number;
  year: number;
  total_incomes: number;
  total_expenses: number;
}

export interface MonthlyComparisonSummary {
  total_incomes: number;
  total_expenses: number;
  average_incomes: number;
  average_expenses: number;
  months_count: number;
}

export interface MonthlyComparisonResponse {
  monthly: MonthlyComparisonData[];
  summary: MonthlyComparisonSummary;
}

// /reportEvolutionyear
export interface YearMonthData {
  month: number;
  year: number;
  incomes: ReportTransaction[];
  expenses: ReportTransaction[];
  total_incomes: number;
  total_expenses: number;
}

export interface YearEvolutionResponse {
  year: number;
  months: YearMonthData[];
}

// /reportComparative
export interface MonthData {
  month: number;
  year: number;
  incomes: ReportTransaction[];
  expenses: ReportTransaction[];
  total_incomes: number;
  total_expenses: number;
}

export interface ComparativeResponse {
  previous_month: MonthData;
  current_month: MonthData;
}
