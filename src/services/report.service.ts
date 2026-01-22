import { Injectable } from '@angular/core';
import {
  FinancialSummary,
  CategoryExpense,
  CategoryIncome,
  MonthlyComparison,
} from '../models/financial-summary.model';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { FixedExpenseService } from './fixed-expense.service';
import { ReleaseTypes } from '../models/fixed-expense.model';
import moment from 'moment';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private fixedExpenseService: FixedExpenseService,
  ) {}

  async getMonthlyReport(month: number, year: number): Promise<FinancialSummary> {
    const transactions = await this.transactionService.getTransactionsByMonth(
      month,
      year,
    );
    const categories = await this.categoryService.getAllCategories();

    const startDate = moment({ year, month: month - 1, day: 1 })
      .startOf('month')
      .toDate();
    const endDate = moment({ year, month: month - 1, day: 1 })
      .endOf('month')
      .toDate();

    const income = transactions.filter((t) => t.release_type === ReleaseTypes.INCOME);
    const expenses = transactions.filter((t) => t.release_type === ReleaseTypes.EXPENSE);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Agrupar por categoria
    const expensesByCategory = this.groupByCategory(expenses, categories, ReleaseTypes.EXPENSE);
    const incomeByCategory = this.groupByCategory(income, categories, ReleaseTypes.INCOME);

    // Calcular média diária
    const daysInMonth = moment({ year, month: month - 1 }).daysInMonth();
    const dailyAverage = totalExpense / daysInMonth;

    // Projeção (baseado em despesas fixas + média de variáveis)
    const fixedExpensesTotal = await this.fixedExpenseService.getMonthlyTotal(
      month,
      year,
    );
    const estimatedExpenses = fixedExpensesTotal + dailyAverage * daysInMonth;

    return {
      period: {
        month,
        year,
        startDate,
        endDate,
      },
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      expensesByCategory,
      incomeByCategory,
      dailyAverage,
      projection: {
        estimatedExpenses,
        estimatedIncome: totalIncome,
        estimatedBalance: totalIncome - estimatedExpenses,
      },
    };
  }

  async getMonthlyComparison(
    currentMonth: number,
    currentYear: number,
  ): Promise<MonthlyComparison> {
    const current = await this.getMonthlyReport(currentMonth, currentYear);

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    const previous = await this.getMonthlyReport(prevMonth, prevYear);

    const incomeChange = this.calculatePercentageChange(
      previous.totalIncome,
      current.totalIncome,
    );
    const expenseChange = this.calculatePercentageChange(
      previous.totalExpense,
      current.totalExpense,
    );
    const balanceChange = this.calculatePercentageChange(
      previous.balance,
      current.balance,
    );

    return {
      currentMonth: current,
      previousMonth: previous,
      incomeChange,
      expenseChange,
      balanceChange,
    };
  }

  async getYearlyReport(year: number): Promise<FinancialSummary[]> {
    const reports: FinancialSummary[] = [];

    for (let month = 1; month <= 12; month++) {
      const report = await this.getMonthlyReport(month, year);
      reports.push(report);
    }

    return reports;
  }

  async getCategoryReport(
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    transactions: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const transactions = await this.transactionService.getFilteredTransactions({
      categoryId,
      startDate,
      endDate,
    });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const days = moment(endDate).diff(moment(startDate), 'days') + 1;
    const average = total / Math.max(days, 1);

    // Calcular tendência (comparar primeira metade com segunda metade)
    const midPoint = moment(startDate).add(days / 2, 'days');
    const firstHalf = transactions.filter((t) =>
      moment(t.date).isBefore(midPoint),
    );
    const secondHalf = transactions.filter((t) =>
      moment(t.date).isSameOrAfter(midPoint),
    );

    const firstHalfTotal = firstHalf.reduce((sum, t) => sum + t.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, t) => sum + t.amount, 0);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    const change = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;

    if (change > 10) trend = 'up';
    else if (change < -10) trend = 'down';

    return {
      total,
      transactions: transactions.length,
      average,
      trend,
    };
  }

  private groupByCategory(
    transactions: any[],
    categories: any[],
    type: ReleaseTypes,
  ): CategoryExpense[] | CategoryIncome[] {
    const grouped = _.groupBy(transactions, 'categoryId');
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    return Object.keys(grouped).map((categoryId) => {
      const items = grouped[categoryId];
      const category = categories.find((c) => c.id === categoryId);
      const categoryTotal = items.reduce((sum, t) => sum + t.amount, 0);

      const result: any = {
        categoryId,
        categoryName: category?.name || 'Sem categoria',
        color: category?.color || '#999999',
        icon: category?.icon || 'help',
        total: categoryTotal,
        percentage: total > 0 ? (categoryTotal / total) * 100 : 0,
        transactionCount: items.length,
      };

      // Adicionar budget se for expense
      if (type === ReleaseTypes.EXPENSE && category?.budget) {
        result.budget = category.budget;
        result.remaining = category.budget - categoryTotal;
      }

      return result;
    });
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
}
