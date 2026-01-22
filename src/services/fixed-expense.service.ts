import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Release,
  ReleasesCreate,
  PaymentRecord,
  ReleaseTypes,
} from '../models/fixed-expense.model';
import { StorageService } from './storage.service';
import { CategoryService } from './category.service';
import { NotificationService } from './notification.service';
import { TransactionService } from './transaction.service';
import { TransactionCreate } from '../models/transaction.model';
import moment from 'moment';
import { R } from '@angular/material/ripple.d-2fb57d04';

const STORAGE_KEY = 'fixed-expenses';

@Injectable({
  providedIn: 'root',
})
export class FixedExpenseService {
  private expensesSubject = new BehaviorSubject<Release[]>([]);
  public expenses$: Observable<Release[]> =
    this.expensesSubject.asObservable();

  constructor(
    private storage: StorageService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private transactionService: TransactionService,
  ) {
    this.loadExpenses();
  }

  private async loadExpenses(): Promise<void> {
    const expenses =
      (await this.storage.get<Release[]>(STORAGE_KEY)) || [];

    const withCategories = await Promise.all(
      expenses.map(async (e) => ({
        ...e,
        category: await this.categoryService.getCategoryById(e.categoryId),
      })),
    );

    this.expensesSubject.next(withCategories);
  }

  async getAllExpenses(): Promise<Release[]> {
    return this.expensesSubject.value;
  }

  async getActiveExpenses(): Promise<Release[]> {
    return this.expensesSubject.value.filter((e) => e.isActive);
  }

  async getExpenseById(id: string): Promise<Release | undefined> {
    return this.expensesSubject.value.find((e) => e.id === id);
  }

  async addExpense(data: ReleasesCreate): Promise<Release> {
    const expenses = [...this.expensesSubject.value];
    const category = await this.categoryService.getCategoryById(data.categoryId);

    const newExpense: Release = {
      id: this.generateId(),
      description: data.description,
      detail_description: data.detail_description,
      release_type: ReleaseTypes.EXPENSE,
      payment_method: data.payment_method,
      is_active: data.isActive ?? true,
      amount: data.amount,
      dueDay: data.dueDay,
      categoryId: data.categoryId,
      category,
      isActive: true,
      notifications: data.notifications ?? true,
      notifyDaysBefore: data.notifyDaysBefore ?? 3,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.push(newExpense);
    await this.saveExpenses(expenses);

    // Agendar notificação de lembrete
    await this.notificationService.scheduleExpenseNotification(newExpense);

    // Notificação instantânea de despesa adicionada
    await this.notificationService.notifyFixedExpenseAdded(
      newExpense.description,
      newExpense.amount,
    );

    return newExpense;
  }

  async updateExpense(
    id: string,
    updates: Partial<ReleasesCreate>,
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

    // Reagendar notificação com novos dados
    await this.notificationService.scheduleExpenseNotification(expenses[index]);
  }

  async deleteExpense(id: string): Promise<void> {
    // Cancelar notificações antes de deletar
    await this.notificationService.cancelExpenseNotifications(id);

    const expenses = this.expensesSubject.value.filter((e) => e.id !== id);
    await this.saveExpenses(expenses);
  }

  async toggleActive(id: string): Promise<void> {
    const expense = await this.getExpenseById(id);
    if (!expense) return;

    const newActiveState = !expense.isActive;
    await this.updateExpense(id, { isActive: newActiveState } as any);

    // Se desativou, cancelar notificações. Se ativou, reagendar
    if (!newActiveState) {
      await this.notificationService.cancelExpenseNotifications(id);
    } else {
      const updatedExpense = await this.getExpenseById(id);
      if (updatedExpense) {
        await this.notificationService.scheduleExpenseNotification(updatedExpense);
      }
    }
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

  async getUpcomingExpenses(daysAhead: number = 7): Promise<Release[]> {
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

  /**
   * Marca uma despesa como paga E cria automaticamente uma transação
   */
  async markAsPaidAndCreateTransaction(
    expenseId: string,
    month?: number,
    year?: number,
    amount?: number,
    notes?: string,
  ): Promise<void> {
    const expense = await this.getExpenseById(expenseId);
    if (!expense) {
      throw new Error('Despesa não encontrada');
    }

    const targetMonth = month || moment().month() + 1;
    const targetYear = year || moment().year();
    const paymentAmount = amount || expense.amount;

    // 1. Marcar como paga no histórico
    await this.markAsPaid(expenseId, targetMonth, targetYear, paymentAmount, notes);

    // 2. Criar transação automaticamente (sem notificação duplicada)
    const transactionData: TransactionCreate = {
      release_type: ReleaseTypes.EXPENSE,
      amount: paymentAmount,
      categoryId: expense.categoryId,
      description: expense.description,
      date: moment({ year: targetYear, month: targetMonth - 1, day: expense.dueDay }).format('YYYY-MM-DD'),
      notes: notes || `Pagamento automático de despesa fixa`,
    };

    // Não usar addTransaction pois ele já enviaria uma notificação
    // Aqui queremos apenas a notificação de pagamento marcado
    const transactions = [...this.transactionService['transactionsSubject'].value];
    const category = await this.categoryService.getCategoryById(transactionData.categoryId);

    const newTransaction = {
      id: this.generateTransactionId(),
      release_type: transactionData.release_type,
      amount: transactionData.amount,
      categoryId: transactionData.categoryId,
      category,
      description: transactionData.description,
      date: transactionData.date || new Date().toISOString(),
      isRecurring: false,
      notes: transactionData.notes,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    await this.transactionService['saveTransactions'](transactions);

    // 3. Notificar pagamento marcado
    await this.notificationService.notifyPaymentMarked(
      expense.description,
      paymentAmount,
    );
  }

  /**
   * Verifica se uma despesa foi paga em determinado mês
   */
  isExpensePaidInMonth(expense: Release, month: number, year: number): boolean {
    return expense.paymentHistory.some((payment) => {
      const paymentDate = moment(payment.date);
      return (
        payment.paid &&
        paymentDate.month() === month - 1 &&
        paymentDate.year() === year
      );
    });
  }

  /**
   * Verifica se a despesa foi paga no mês atual
   */
  isExpensePaidThisMonth(expense: Release): boolean {
    const now = moment();
    return this.isExpensePaidInMonth(expense, now.month() + 1, now.year());
  }

  /**
   * Retorna o status de pagamento de todas as despesas ativas no mês atual
   */
  async getMonthlyPaymentStatus(): Promise<
    Array<{
      expense: Release;
      isPaid: boolean;
      dueDate: Date;
      daysUntilDue: number;
      isOverdue: boolean;
    }>
  > {
    const activeExpenses = await this.getActiveExpenses();
    const now = moment();
    const currentMonth = now.month() + 1;
    const currentYear = now.year();

    return activeExpenses.map((expense) => {
      const isPaid = this.isExpensePaidInMonth(expense, currentMonth, currentYear);
      const dueDate = moment({
        year: currentYear,
        month: currentMonth - 1,
        day: expense.dueDay,
      });

      const daysUntilDue = dueDate.diff(now, 'days');
      const isOverdue = !isPaid && daysUntilDue < 0;

      return {
        expense,
        isPaid,
        dueDate: dueDate.toDate(),
        daysUntilDue,
        isOverdue,
      };
    });
  }

  private async saveExpenses(expenses: Release[]): Promise<void> {
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

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
