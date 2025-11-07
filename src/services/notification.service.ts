import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions, ActionPerformed } from '@capacitor/local-notifications';
import { FixedExpense } from '../models/fixed-expense.model';
import moment from 'moment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private permissionsGranted = false;

  constructor(private router: Router) {
    this.initializeNotifications();
    this.setupNotificationListeners();
  }

  private async initializeNotifications() {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionsGranted = result.display === 'granted';

      if (!this.permissionsGranted) {
        console.warn('⚠️ Permissões de notificação não foram concedidas');
      }
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões de notificação:', error);
      this.permissionsGranted = false;
    }
  }

  private setupNotificationListeners() {
    // Listener para quando a notificação é recebida
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      // Notificação recebida enquanto o app está aberto
    });

    // Listener para quando o usuário clica na notificação
    LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
      const data = action.notification.extra;

      if (data && data.type === 'fixed-expense') {
        // Navega para a página de despesas fixas quando clicado
        this.router.navigate(['/fixed-expenses']);
      }
    });
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      this.permissionsGranted = result.display === 'granted';
      return this.permissionsGranted;
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Solicita permissões de notificação novamente
   * Útil quando o usuário negou inicialmente
   */
  async requestPermissionsAgain(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionsGranted = result.display === 'granted';
      return this.permissionsGranted;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      return false;
    }
  }

  /**
   * Retorna se as permissões estão concedidas
   */
  hasPermissions(): boolean {
    return this.permissionsGranted;
  }

  async scheduleExpenseNotification(expense: FixedExpense): Promise<boolean> {
    if (!expense.notifications || !expense.isActive) {
      return false;
    }

    if (!this.permissionsGranted) {
      await this.checkPermissions();
    }

    if (!this.permissionsGranted) {
      console.warn('⚠️ Sem permissão de notificação para despesa:', expense.name);
      return false;
    }

    try {
      // Cancelar notificações antigas desta despesa
      await this.cancelExpenseNotifications(expense.id);

      const now = moment();
      const currentMonth = now.month();
      const currentYear = now.year();
      let scheduledCount = 0;

      // Agendar para o mês atual e próximo
      for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
        const targetDate = moment({
          year: currentYear,
          month: currentMonth + monthOffset,
          day: expense.dueDay,
        });

        // Subtrair os dias de antecedência
        const notificationDate = targetDate
          .clone()
          .subtract(expense.notifyDaysBefore, 'days')
          .hours(9)
          .minutes(0)
          .seconds(0);

        // Só agendar se a data for futura
        if (notificationDate.isAfter(now)) {
          const notificationId = this.generateNotificationId(
            expense.id,
            monthOffset,
          );

          const schedule: ScheduleOptions = {
            notifications: [
              {
                id: notificationId,
                title: `💰 Despesa Fixa: ${expense.name}`,
                body: `Vence em ${expense.notifyDaysBefore} ${expense.notifyDaysBefore === 1 ? 'dia' : 'dias'} - ${this.formatCurrency(expense.amount)}`,
                schedule: {
                  at: notificationDate.toDate(),
                },
                extra: {
                  expenseId: expense.id,
                  type: 'fixed-expense',
                },
              },
            ],
          };

          await LocalNotifications.schedule(schedule);
          scheduledCount++;
        }
      }

      return scheduledCount > 0;
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
      return false;
    }
  }

  /**
   * Agenda uma notificação de teste imediata (5 segundos)
   * Útil para verificar se as notificações estão funcionando
   */
  async scheduleTestNotification(): Promise<boolean> {
    if (!this.permissionsGranted) {
      const granted = await this.requestPermissionsAgain();
      if (!granted) {
        return false;
      }
    }

    try {
      const testDate = moment().add(5, 'seconds');

      const schedule: ScheduleOptions = {
        notifications: [
          {
            id: 999999,
            title: '✅ Teste de Notificação',
            body: 'Se você está vendo isso, as notificações estão funcionando!',
            schedule: {
              at: testDate.toDate(),
            },
            extra: {
              type: 'test',
            },
          },
        ],
      };

      await LocalNotifications.schedule(schedule);
      return true;
    } catch (error) {
      console.error('❌ Erro ao agendar notificação de teste:', error);
      return false;
    }
  }

  async cancelExpenseNotifications(expenseId: string): Promise<void> {
    try {
      // Cancelar notificações do mês atual e próximo
      const ids = [
        this.generateNotificationId(expenseId, 0),
        this.generateNotificationId(expenseId, 1),
      ];

      await LocalNotifications.cancel({
        notifications: ids.map((id) => ({ id })),
      });
    } catch (error) {
      console.error('❌ Erro ao cancelar notificações:', error);
    }
  }

  async rescheduleAllExpenses(expenses: FixedExpense[]): Promise<number> {
    let scheduledCount = 0;

    for (const expense of expenses) {
      if (expense.notifications && expense.isActive) {
        const success = await this.scheduleExpenseNotification(expense);
        if (success) {
          scheduledCount++;
        }
      }
    }

    return scheduledCount;
  }

  private generateNotificationId(expenseId: string, monthOffset: number): number {
    // Gera um ID único baseado no expenseId e no mês
    const hash = this.simpleHash(expenseId);
    return hash + monthOffset * 10000;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100000;
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('❌ Erro ao buscar notificações pendentes:', error);
      return [];
    }
  }

  /**
   * Cancela a notificação de teste
   */
  async cancelTestNotification(): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: 999999 }],
      });
    } catch (error) {
      console.error('❌ Erro ao cancelar notificação de teste:', error);
    }
  }
}
