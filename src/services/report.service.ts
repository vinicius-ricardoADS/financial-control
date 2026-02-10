import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  FinancialSummary,
  CategoryExpense,
  CategoryIncome,
  MonthlyComparison,
  MonthlyComparisonResponse,
  YearEvolutionResponse,
  ComparativeResponse,
} from '../models/financial-summary.model';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { FixedExpenseService } from './fixed-expense.service';
import { ReleaseTypes } from '../models/fixed-expense.model';
import { environment } from '../environments/environment';
import moment from 'moment';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly apiUrl = `${environment.api}`;

  constructor(
    private http: HttpClient,
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

    const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.value), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.value), 0);

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

  async getYearlyReport(year: number, upToMonth?: number): Promise<FinancialSummary[]> {
    const reports: FinancialSummary[] = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Se for o ano atual, limita até o mês atual
    // Se foi passado upToMonth, usa esse valor
    // Caso contrário, busca todos os 12 meses
    let maxMonth = 12;
    if (upToMonth) {
      maxMonth = upToMonth;
    } else if (year === currentYear) {
      maxMonth = currentMonth;
    }

    for (let month = 1; month <= maxMonth; month++) {
      const report = await this.getMonthlyReport(month, year);
      reports.push(report);
    }

    return reports;
  }

  async getCategoryReport(
    categoryName: string,
    month: number,
    year: number,
  ): Promise<{
    total: number;
    transactions: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const allTransactions = await this.transactionService.getTransactionsByMonth(month, year);
    const transactions = allTransactions.filter(t => t.category_name === categoryName);

    const total = transactions.reduce((sum, t) => sum + parseFloat(t.value), 0);
    const daysInMonth = moment({ year, month: month - 1 }).daysInMonth();
    const average = total / Math.max(daysInMonth, 1);

    // Calcular tendência (comparar primeira metade com segunda metade)
    const midDay = Math.floor(daysInMonth / 2);
    const firstHalf = transactions.filter((t) => {
      const day = moment(t.date).date();
      return day <= midDay;
    });
    const secondHalf = transactions.filter((t) => {
      const day = moment(t.date).date();
      return day > midDay;
    });

    const firstHalfTotal = firstHalf.reduce((sum, t) => sum + parseFloat(t.value), 0);
    const secondHalfTotal = secondHalf.reduce((sum, t) => sum + parseFloat(t.value), 0);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (firstHalfTotal > 0) {
      const change = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
      if (change > 10) trend = 'up';
      else if (change < -10) trend = 'down';
    }

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
    const grouped = _.groupBy(transactions, 'category_name');
    const total = transactions.reduce((sum, t) => sum + parseFloat(t.value), 0);

    return Object.keys(grouped).map((categoryName) => {
      const items = grouped[categoryName];
      const category = categories.find((c) => c.category === categoryName);
      const categoryTotal = items.reduce((sum, t) => sum + parseFloat(t.value), 0);

      const result: any = {
        categoryId: category?.id || categoryName,
        categoryName: categoryName || 'Sem categoria',
        color: category?.color || '#999999',
        icon: items[0]?.category_icon || category?.icon || 'help',
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

  /**
   * Busca comparação mensal do endpoint da API
   */
  async getMonthlyComparisonFromAPI(): Promise<MonthlyComparisonResponse> {
    return firstValueFrom(
      this.http.get<MonthlyComparisonResponse>(`${this.apiUrl}/reportMonthlycomparison`)
    );
  }

  /**
   * Busca evolução do ano do endpoint da API
   */
  async getYearEvolution(): Promise<YearEvolutionResponse> {
    return firstValueFrom(
      this.http.get<YearEvolutionResponse>(`${this.apiUrl}/reportEvolutionyear`)
    );
  }

  /**
   * Busca comparativo mês anterior vs atual do endpoint da API
   */
  async getComparative(): Promise<ComparativeResponse> {
    return firstValueFrom(
      this.http.get<ComparativeResponse>(`${this.apiUrl}/reportComparative`)
    );
  }
}
