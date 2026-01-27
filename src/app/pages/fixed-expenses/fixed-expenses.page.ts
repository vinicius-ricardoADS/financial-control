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
import { Release, ReleasesCreate, ReleaseTypes, ActiveStatus } from '../../../models/fixed-expense.model';
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
  expenses: Release[] = [];
  categories: Category[] = [];
  isModalOpen = false;
  isEditMode = false;
  currentExpense: Release | null = null;

  // Status de pagamento
  paymentStatusMap: Map<string, {
    isPaid: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
  }> = new Map();

  formData: ReleasesCreate = {
    description: '',
    notes: '',
    is_active: true,
    value: 0,
    payment_day: 1,
    category_id: '',
    category_name: '',
    release_type_id: ReleaseTypes.EXPENSE,
    release_type: '',
    payment_method: '',
    notifications: true,
    notifyDaysBefore: 3,
  };

  // Expor ActiveStatus para o template
  ActiveStatus = ActiveStatus;

  constructor(
    private expenseService: FixedExpenseService,
    private categoryService: CategoryService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({ add, trash, pencil, close, checkmark, notifications, checkmarkCircle, alertCircle, timeOutline });
  }

  async ngOnInit() {
    await this.loadCategories();
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  private async loadCategories() {
    this.categories = await this.categoryService.getAllCategories();
  }

  async loadData() {
    this.expenses = await this.expenseService.getAllExpenses();
    console.log('Despesas fixas carregadas:', this.expenses);

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
      description: '',
      notes: '',
      is_active: true,
      payment_method: '',
      value: 0,
      category_id: '',
      payment_day: 1,
      release_type_id: ReleaseTypes.EXPENSE,
      notifications: true,
      notifyDaysBefore: 3,
    };
    this.isModalOpen = true;
  }

  openEditModal(expense: Release) {
    this.isEditMode = true;
    this.currentExpense = expense;
    this.formData = {
      description: expense.description,
      notes: expense.notes,
      is_active: expense.is_active === ActiveStatus.ACTIVE,
      payment_method: expense.payment_method,
      value: expense.value,
      payment_day: expense.payment_day,
      category_name: expense?.category_name,
      category_id: this.getCategoryIdByName(expense.category_name),
      release_type_id: this.getReleaseTypeIdByType(expense.release_type),
      release_type: expense.release_type,
      notifications: expense.notifications,
      notifyDaysBefore: expense.notifyDaysBefore,
    };
    this.isModalOpen = true;
  }

  getReleaseTypeIdByType(releaseType?: string): ReleaseTypes {
    if (!releaseType) return ReleaseTypes.EXPENSE;
    return releaseType === 'entrada' ? ReleaseTypes.INCOME : ReleaseTypes.EXPENSE;
  }

  getCategoryIdByName(categoryName?: string): string {
    if (!categoryName) return '';
    const category = this.categories.find(cat => cat.category === categoryName);
    return category ? category.id : '';
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveExpense() {
    if (!this.formData.description || !this.formData.category_id || this.formData.value <= 0) {
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

      await this.expenseService.refreshExpenses()

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

  async deleteExpense(expense: Release) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Deseja realmente excluir "${expense.description}"?`,
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

  async toggleActive(expense: Release) {
    await this.expenseService.toggleActive(expense.id);
    this.expenses = await this.expenseService.refreshExpenses();
    await this.loadPaymentStatus();
  }

  /**
   * Verifica se uma despesa está ativa
   */
  isExpenseActive(expense: Release): boolean {
    return expense.is_active === ActiveStatus.ACTIVE;
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

  getColor(expense: any): string | null {
    return expense?.category_name === 'Salário' ? '#85bb65' : null;
  }

  async markAsPaid(expense: Release, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertCtrl.create({
      header: 'Marcar como paga',
      message: `Confirma o pagamento de "${expense.description}" no valor de R$ ${expense.value}?`,
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
