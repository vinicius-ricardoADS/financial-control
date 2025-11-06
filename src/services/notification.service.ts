import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { FixedExpense } from '../models/fixed-expense.model';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('Notification permissions:', result);
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async scheduleExpenseNotification(expense: FixedExpense): Promise<void> {
    if (!expense.notifications || !expense.isActive) {
      return;
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      console.log('No notification permission for expense:', expense.name);
      return;
    }

    try {
      // Cancelar notificações antigas desta despesa
      await this.cancelExpenseNotifications(expense.id);

      const now = moment();
      const currentMonth = now.month();
      const currentYear = now.year();

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
          .subtract(expense.notifyDaysBefore, 'days');

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
                body: `Vence em ${expense.notifyDaysBefore} dias - ${this.formatCurrency(expense.amount)}`,
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
          console.log(
            `Notification scheduled for ${expense.name} on ${notificationDate.format('DD/MM/YYYY HH:mm')}`,
          );
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
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

      console.log('Notifications canceled for expense:', expenseId);
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  async rescheduleAllExpenses(expenses: FixedExpense[]): Promise<void> {
    console.log('Rescheduling all expense notifications...');

    for (const expense of expenses) {
      if (expense.notifications && expense.isActive) {
        await this.scheduleExpenseNotification(expense);
      }
    }

    console.log('All notifications rescheduled!');
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
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }
}
