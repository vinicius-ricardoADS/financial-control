import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Release,
  ReleasesCreate,
  ReleaseTypes,
  ReleaseTypesId,
  ActiveStatus,
  PaymentStatus,
  PaymentStatusId,
} from '../models/fixed-expense.model';
import { CategoryService } from './category.service';
import { NotificationService } from './notification.service';
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
    return expenses;
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
      data!.description,
      data!.value,
    );

    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<ReleasesCreate>): Promise<void> {
    const response = await firstValueFrom(
      this.http.put<any>(`${this.apiUrl}/${id}`, updates)
    );

    // A API pode retornar { data: Release } ou Release diretamente
    const updatedExpense: Release = response?.data || response;

    if (updatedExpense && updatedExpense.id) {
      // Atualizar o cache local com o item atualizado
      const expenses = this.expensesSubject.value.map((e) =>
        e.id === id ? updatedExpense : e
      );
      this.expensesSubject.next(expenses);

      // Reagendar notificação com novos dados
      await this.notificationService.scheduleExpenseNotification(updatedExpense);
    } else {
      // Se não conseguiu obter dados válidos, força refresh do servidor
      await this.refreshExpenses();
    }
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

    const newActiveState = expense.is_active !== ActiveStatus.ACTIVE;

    const categoryId = expense.category_id
      || await this.getCategoryIdByName(expense.category_name);

    // Determinar o ID numérico do tipo de lançamento
    const releaseTypeId = expense.release_type === 'entrada' || expense.release_type_id === ReleaseTypes.INCOME
      ? ReleaseTypesId.INCOME
      : ReleaseTypesId.EXPENSE;

    const updateData = {
      release_type_id: releaseTypeId,
      category_id: Number(categoryId),
      description: expense.description,
      value: expense.value,
      payment_day: expense.payment_day,
      payment_method: expense.payment_method || '',
      notes: expense.notes || '',
      is_active: newActiveState,
      start_date: expense.start_date || moment().format('YYYY-MM-DD'),
      end_date: expense.end_date || '',
    };

    await this.updateExpense(id, updateData as any);

    // Forçar refresh para garantir dados atualizados
    await this.refreshExpenses();

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

  private async getCategoryIdByName(categoryName?: string): Promise<string> {
    if (!categoryName) return '';
    const categories = await this.categoryService.getAllCategories();
    const category = categories.find(cat => cat.category === categoryName);
    return category ? category.id : '';
  }

  /**
   * Verifica se uma despesa está ativa
   */
  isActive(expense: Release): boolean {
    return expense.is_active === ActiveStatus.ACTIVE;
  }

  async markAsPaid(expenseId: string): Promise<void> {
    const expense = await this.getExpenseById(expenseId);
    if (!expense) return;

    const paymentData = {
      id: expenseId,
      payment_day: new Date().getDate(), // Dia real do pagamento
      status: PaymentStatusId.PAID
    };

    await firstValueFrom(
      this.http.patch<any>(`${this.apiUrl}/${expenseId}`, paymentData)
    );

    // Recarrega os dados para atualizar o cache
    await this.refreshExpenses();
  }

  async getUpcomingExpenses(daysAhead: number = 7): Promise<Release[]> {
    const today = moment().startOf('day');
    const futureDate = moment().startOf('day').add(daysAhead, 'days');
    const activeExpenses = await this.getActiveExpenses();

    return activeExpenses.filter((expense) => {
      const currentMonth = today.month();
      const currentYear = today.year();
      const dueDate = moment({
        year: currentYear,
        month: currentMonth,
        day: expense.payment_day,
      }).startOf('day');

      // Se a data de vencimento já passou (comparando apenas por dia), verifica o próximo mês
      if (dueDate.isBefore(today, 'day')) {
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
   * Marca uma despesa como paga
   */
  async markAsPaidAndCreateTransaction(
    expenseId: string,
    notes?: string,
  ): Promise<void> {
    const expense = await this.getExpenseById(expenseId);
    if (!expense) {
      throw new Error('Despesa não encontrada');
    }

    // Marcar como paga via PATCH
    await this.markAsPaid(expenseId);
  }

  /**
   * Verifica se uma despesa está paga no mês atual
   */
  isExpensePaid(expense: Release): boolean {
    // Verificar pelo status do mês atual ou se já existe uma transação associada
    return expense.current_month_payment_status === PaymentStatus.PAID
      || !!expense.current_month_release_id;
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
      const isPaid = this.isExpensePaid(expense);
      const dueDate = moment({
        year: currentYear,
        month: currentMonth - 1,
        day: expense.payment_day,
      });

      // Comparar apenas as datas (sem hora) para calcular dias até o vencimento
      // Isso garante que no dia do vencimento, daysUntilDue = 0 (não negativo)
      const today = moment().startOf('day');
      const dueDateStart = dueDate.startOf('day');
      const daysUntilDue = dueDateStart.diff(today, 'days');
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
