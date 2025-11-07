import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonFab,
  IonFabButton,
  IonToggle,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonModal,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButtons,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { FixedExpenseService } from '../../../services/fixed-expense.service';
import { CategoryService } from '../../../services/category.service';
import { FixedExpense, FixedExpenseCreate } from '../../../models/fixed-expense.model';
import { Category } from '../../../models/category.model';
import { addIcons } from 'ionicons';
import { add, trash, pencil, close, checkmark, notifications, checkmarkCircle, alertCircle, timeOutline } from 'ionicons/icons';
import moment from 'moment';

@Component({
  selector: 'app-fixed-expenses',
  templateUrl: './fixed-expenses.page.html',
  styleUrls: ['./fixed-expenses.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    IonToggle,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButtons,
  ],
})
export class FixedExpensesPage implements OnInit {
  expenses: FixedExpense[] = [];
  categories: Category[] = [];
  isModalOpen = false;
  isEditMode = false;
  currentExpense: FixedExpense | null = null;

  // Status de pagamento
  paymentStatusMap: Map<string, {
    isPaid: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
  }> = new Map();

  formData: FixedExpenseCreate = {
    name: '',
    amount: 0,
    dueDay: 1,
    categoryId: '',
    notifications: true,
    notifyDaysBefore: 3,
  };

  constructor(
    private expenseService: FixedExpenseService,
    private categoryService: CategoryService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ add, trash, pencil, close, checkmark, notifications, checkmarkCircle, alertCircle, timeOutline });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.expenses = await this.expenseService.getAllExpenses();
    this.categories = await this.categoryService.getCategoriesByType('expense');

    // Carregar status de pagamento
    await this.loadPaymentStatus();
  }

  async loadPaymentStatus() {
    const statusList = await this.expenseService.getMonthlyPaymentStatus();

    this.paymentStatusMap.clear();
    statusList.forEach(item => {
      this.paymentStatusMap.set(item.expense.id, {
        isPaid: item.isPaid,
        daysUntilDue: item.daysUntilDue,
        isOverdue: item.isOverdue,
      });
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentExpense = null;
    this.formData = {
      name: '',
      amount: 0,
      dueDay: 1,
      categoryId: '',
      notifications: true,
      notifyDaysBefore: 3,
    };
    this.isModalOpen = true;
  }

  openEditModal(expense: FixedExpense) {
    this.isEditMode = true;
    this.currentExpense = expense;
    this.formData = {
      name: expense.name,
      amount: expense.amount,
      dueDay: expense.dueDay,
      categoryId: expense.categoryId,
      notifications: expense.notifications,
      notifyDaysBefore: expense.notifyDaysBefore,
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveExpense() {
    if (!this.formData.name || !this.formData.categoryId || this.formData.amount <= 0) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos obrigatórios',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    try {
      if (this.isEditMode && this.currentExpense) {
        await this.expenseService.updateExpense(this.currentExpense.id, this.formData);
      } else {
        await this.expenseService.addExpense(this.formData);
      }

      const toast = await this.toastCtrl.create({
        message: `Despesa ${this.isEditMode ? 'atualizada' : 'adicionada'} com sucesso!`,
        duration: 2000,
        color: 'success',
      });
      await toast.present();

      this.closeModal();
      await this.loadData();
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Erro ao salvar despesa',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  async deleteExpense(expense: FixedExpense) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Deseja realmente excluir "${expense.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            await this.expenseService.deleteExpense(expense.id);
            const toast = await this.toastCtrl.create({
              message: 'Despesa excluída!',
              duration: 2000,
              color: 'success',
            });
            await toast.present();
            await this.loadData();
          },
        },
      ],
    });
    await alert.present();
  }

  async toggleActive(expense: FixedExpense) {
    await this.expenseService.toggleActive(expense.id);
    await this.loadData();
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  getDayOfMonthLabel(day: number): string {
    return `Dia ${day} de cada mês`;
  }

  getPaymentStatus(expenseId: string) {
    return this.paymentStatusMap.get(expenseId) || {
      isPaid: false,
      daysUntilDue: 0,
      isOverdue: false,
    };
  }

  getStatusBadgeColor(expenseId: string): string {
    const status = this.getPaymentStatus(expenseId);
    if (status.isPaid) return 'success';
    if (status.isOverdue) return 'danger';
    if (status.daysUntilDue <= 3) return 'warning';
    return 'medium';
  }

  getStatusLabel(expenseId: string): string {
    const status = this.getPaymentStatus(expenseId);
    if (status.isPaid) return 'Paga';
    if (status.isOverdue) return `Atrasada (${Math.abs(status.daysUntilDue)}d)`;
    if (status.daysUntilDue === 0) return 'Vence hoje';
    if (status.daysUntilDue > 0) return `${status.daysUntilDue}d`;
    return '';
  }

  async markAsPaid(expense: FixedExpense, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertCtrl.create({
      header: 'Marcar como paga',
      message: `Confirma o pagamento de "${expense.name}" no valor de ${this.formatCurrency(expense.amount)}?`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Observações (opcional)',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async (data) => {
            try {
              await this.expenseService.markAsPaidAndCreateTransaction(
                expense.id,
                undefined,
                undefined,
                undefined,
                data.notes,
              );

              const toast = await this.toastCtrl.create({
                message: 'Despesa marcada como paga e transação criada!',
                duration: 2000,
                color: 'success',
              });
              await toast.present();

              await this.loadData();
            } catch (error) {
              const toast = await this.toastCtrl.create({
                message: 'Erro ao processar pagamento',
                duration: 2000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
