import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FixedExpense,
  FixedExpenseCreate,
  PaymentRecord,
} from '../models/fixed-expense.model';
import { StorageService } from './storage.service';
import { CategoryService } from './category.service';
import moment from 'moment';

const STORAGE_KEY = 'fixed-expenses';

@Injectable({
  providedIn: 'root',
})
export class FixedExpenseService {
  private expensesSubject = new BehaviorSubject<FixedExpense[]>([]);
  public expenses$: Observable<FixedExpense[]> =
    this.expensesSubject.asObservable();

  constructor(
    private storage: StorageService,
    private categoryService: CategoryService,
  ) {
    this.loadExpenses();
  }

  private async loadExpenses(): Promise<void> {
    const expenses =
      (await this.storage.get<FixedExpense[]>(STORAGE_KEY)) || [];

    const withCategories = await Promise.all(
      expenses.map(async (e) => ({
        ...e,
        category: await this.categoryService.getCategoryById(e.categoryId),
      })),
    );

    this.expensesSubject.next(withCategories);
  }

  async getAllExpenses(): Promise<FixedExpense[]> {
    return this.expensesSubject.value;
  }

  async getActiveExpenses(): Promise<FixedExpense[]> {
    return this.expensesSubject.value.filter((e) => e.isActive);
  }

  async getExpenseById(id: string): Promise<FixedExpense | undefined> {
    return this.expensesSubject.value.find((e) => e.id === id);
  }

  async addExpense(data: FixedExpenseCreate): Promise<FixedExpense> {
    const expenses = [...this.expensesSubject.value];
    const category = await this.categoryService.getCategoryById(data.categoryId);

    const newExpense: FixedExpense = {
      id: this.generateId(),
      name: data.name,
      amount: data.amount,
      dueDay: data.dueDay,
      categoryId: data.categoryId,
      category,
      isActive: true,
      notifications: data.notifications ?? true,
      notifyDaysBefore: data.notifyDaysBefore ?? 3,
      description: data.description,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.push(newExpense);
    await this.saveExpenses(expenses);

    return newExpense;
  }

  async updateExpense(
    id: string,
    updates: Partial<FixedExpenseCreate>,
  ): Promise<void> {
    let expenses = [...this.expensesSubject.value];
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) return;

    const category = updates.categoryId
      ? await this.categoryService.getCategoryById(updates.categoryId)
      : expenses[index].category;

    expenses[index] = {
      ...expenses[index],
      ...updates,
      category,
      updatedAt: new Date().toISOString(),
    };

    await this.saveExpenses(expenses);
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = this.expensesSubject.value.filter((e) => e.id !== id);
    await this.saveExpenses(expenses);
  }

  async toggleActive(id: string): Promise<void> {
    const expense = await this.getExpenseById(id);
    if (!expense) return;

    await this.updateExpense(id, { isActive: !expense.isActive } as any);
  }

  async markAsPaid(
    expenseId: string,
    month: number,
    year: number,
    amount?: number,
    notes?: string,
  ): Promise<void> {
    const expenses = [...this.expensesSubject.value];
    const index = expenses.findIndex((e) => e.id === expenseId);

    if (index === -1) return;

    const expense = expenses[index];
    const paymentDate = moment({ year, month: month - 1, day: expense.dueDay });

    // Verifica se já existe pagamento para esse mês
    const existingPaymentIndex = expense.paymentHistory.findIndex((p) => {
      const pDate = moment(p.date);
      return pDate.month() === month - 1 && pDate.year() === year;
    });

    const payment: PaymentRecord = {
      id: this.generatePaymentId(),
      date: paymentDate.toISOString(),
      amount: amount || expense.amount,
      paid: true,
      paidDate: new Date().toISOString(),
      notes,
    };

    if (existingPaymentIndex >= 0) {
      expense.paymentHistory[existingPaymentIndex] = payment;
    } else {
      expense.paymentHistory.push(payment);
    }

    expenses[index] = {
      ...expense,
      updatedAt: new Date().toISOString(),
    };

    await this.saveExpenses(expenses);
  }

  async getUpcomingExpenses(daysAhead: number = 7): Promise<FixedExpense[]> {
    const today = moment();
    const futureDate = moment().add(daysAhead, 'days');
    const activeExpenses = await this.getActiveExpenses();

    return activeExpenses.filter((expense) => {
      const currentMonth = today.month();
      const currentYear = today.year();
      const dueDate = moment({
        year: currentYear,
        month: currentMonth,
        day: expense.dueDay,
      });

      // Se a data de vencimento já passou, verifica o próximo mês
      if (dueDate.isBefore(today)) {
        dueDate.add(1, 'month');
      }

      return dueDate.isBetween(today, futureDate, 'day', '[]');
    });
  }

  async getMonthlyTotal(month: number, year: number): Promise<number> {
    const activeExpenses = await this.getActiveExpenses();
    return activeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  private async saveExpenses(expenses: FixedExpense[]): Promise<void> {
    const toSave = expenses.map(({ category, ...rest }) => rest);
    await this.storage.set(STORAGE_KEY, toSave);
    this.expensesSubject.next(expenses);
  }

  private generateId(): string {
    return `fexp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
