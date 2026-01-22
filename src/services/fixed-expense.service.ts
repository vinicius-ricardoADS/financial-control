import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Release,
  ReleasesCreate,
  ReleaseTypes,
  ActiveStatus,
} from '../models/fixed-expense.model';
import { CategoryService } from './category.service';
import { NotificationService } from './notification.service';
import { TransactionService } from './transaction.service';
import { TransactionCreate } from '../models/transaction.model';
import { environment } from '../environments/environment';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class FixedExpenseService {
  private readonly apiUrl = `${environment.api}/fixedrelease`;
  private expensesSubject = new BehaviorSubject<Release[]>([]);
  public expenses$: Observable<Release[]> =
    this.expensesSubject.asObservable();

  private expensesLoaded = false;

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private transactionService: TransactionService,
  ) {}

  async getAllExpenses(): Promise<Release[]> {
    if (this.expensesLoaded && this.expensesSubject.value.length > 0) {
      return this.expensesSubject.value;
    }

    const expenses = await firstValueFrom(
      this.http.get<Release[]>(this.apiUrl).pipe(
        tap((data) => {
          this.expensesSubject.next(data);
          this.expensesLoaded = true;
        })
      )
    );
    return expenses;
  }

  async getActiveExpenses(): Promise<Release[]> {
    const expenses = await this.getAllExpenses();
    return expenses.filter((e) => e.is_active === ActiveStatus.ACTIVE);
  }

  async getExpenseById(id: string): Promise<Release | undefined> {
    if (this.expensesLoaded) {
      const cached = this.expensesSubject.value.find((e) => e.id === id);
      if (cached) return cached;
    }

    try {
      const expense = await firstValueFrom(
        this.http.get<Release>(`${this.apiUrl}/${id}`)
      );
      return expense;
    } catch {
      return undefined;
    }
  }

  async addExpense(data: ReleasesCreate): Promise<Release> {
    const newExpense = await firstValueFrom(
      this.http.post<Release>(this.apiUrl, data)
    );

    const expenses = [...this.expensesSubject.value, newExpense];
    this.expensesSubject.next(expenses);

    // Agendar notificação de lembrete
    await this.notificationService.scheduleExpenseNotification(newExpense);

    // Notificação instantânea de despesa adicionada
    await this.notificationService.notifyFixedExpenseAdded(
      newExpense.description,
      newExpense.value,
    );

    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<ReleasesCreate>): Promise<void> {
    const updatedExpense = await firstValueFrom(
      this.http.put<Release>(`${this.apiUrl}/${id}`, updates)
    );

    const expenses = this.expensesSubject.value.map((e) =>
      e.id === id ? updatedExpense : e
    );
    this.expensesSubject.next(expenses);

    // Reagendar notificação com novos dados
    await this.notificationService.scheduleExpenseNotification(updatedExpense);
  }

  async deleteExpense(id: string): Promise<void> {
    // Cancelar notificações antes de deletar
    await this.notificationService.cancelExpenseNotifications(id);

    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`)
    );

    const expenses = this.expensesSubject.value.filter((e) => e.id !== id);
    this.expensesSubject.next(expenses);
  }

  async toggleActive(id: string): Promise<void> {
    const expense = await this.getExpenseById(id);
    if (!expense) return;

    const newActiveState = expense.is_active === ActiveStatus.ACTIVE
      ? ActiveStatus.INACTIVE
      : ActiveStatus.ACTIVE;

    await this.updateExpense(id, { is_active: newActiveState });

    // Se desativou, cancelar notificações. Se ativou, reagendar
    if (newActiveState === ActiveStatus.INACTIVE) {
      await this.notificationService.cancelExpenseNotifications(id);
    } else {
      const updatedExpense = await this.getExpenseById(id);
      if (updatedExpense) {
        await this.notificationService.scheduleExpenseNotification(updatedExpense);
      }
    }
  }

  /**
   * Verifica se uma despesa está ativa
   */
  isActive(expense: Release): boolean {
    return expense.is_active === ActiveStatus.ACTIVE;
  }

  async markAsPaid(
    expenseId: string,
    month: number,
    year: number,
    amount?: number,
    notes?: string,
  ): Promise<void> {
    const expense = await this.getExpenseById(expenseId);
    if (!expense) return;

    const paymentData = {
      month,
      year,
      amount: amount || expense.value,
      notes,
    };

    await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/${expenseId}/pay`, paymentData)
    );

    // Recarrega os dados para atualizar o cache
    await this.refreshExpenses();
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
        day: expense.payment_day,
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
    return activeExpenses.reduce((sum, expense) => sum + expense.value, 0);
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
    const paymentAmount = amount || expense.value;

    // 1. Marcar como paga no histórico
    await this.markAsPaid(expenseId, targetMonth, targetYear, paymentAmount, notes);

    // 2. Criar transação automaticamente
    const transactionData: TransactionCreate = {
      release_type: ReleaseTypes.EXPENSE,
      amount: paymentAmount,
      categoryId: expense.category_id,
      description: expense.description,
      date: moment({ year: targetYear, month: targetMonth - 1, day: expense.payment_day }).format('YYYY-MM-DD'),
      notes: notes || `Pagamento automático de despesa fixa`,
    };

    await this.transactionService.addTransaction(transactionData);

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
    return expense.paymentHistory?.some((payment) => {
      const paymentDate = moment(payment.date);
      return (
        payment.paid &&
        paymentDate.month() === month - 1 &&
        paymentDate.year() === year
      );
    }) ?? false;
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
        day: expense.payment_day,
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

  /**
   * Força recarregar as despesas do servidor
   */
  async refreshExpenses(): Promise<Release[]> {
    this.expensesLoaded = false;
    return this.getAllExpenses();
  }
}
