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
  IonDatetime,
  IonDatetimeButton,
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonNote,
  ToastController,
  AlertController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { FixedExpenseService } from '../../../services/fixed-expense.service';
import { CategoryService } from '../../../services/category.service';
import { TransactionService } from '../../../services/transaction.service';
import { Release, ReleasesCreate, ReleaseTypes, ReleaseTypesId, ActiveStatus } from '../../../models/fixed-expense.model';
import { Transaction } from '../../../models/transaction.model';
import { Category } from '../../../models/category.model';
import { addIcons } from 'ionicons';
import { add, trash, pencil, close, checkmark, notifications, checkmarkCircle, alertCircle, timeOutline, calendarOutline, infiniteOutline, stopwatchOutline, informationCircleOutline } from 'ionicons/icons';
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
    IonDatetime,
    IonDatetimeButton,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    IonNote,
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

  // Transações do mês para cruzamento
  currentMonthTransactions: Transaction[] = [];

  formData: any = {
    description: '',
    notes: '',
    is_active: true,
    value: 0,
    payment_day: 1,
    category_id: '',
    category_name: '',
    release_type_id: ReleaseTypesId.EXPENSE,
    release_type: '',
    payment_method: '',
    notifications: true,
    notifyDaysBefore: 3,
    start_date: null,
    end_date: null,
  };

  // Controle para mostrar/esconder campo de data de término
  hasEndDate = false;

  // Expor ActiveStatus para o template
  ActiveStatus = ActiveStatus;

  constructor(
    private expenseService: FixedExpenseService,
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
  ) {
    addIcons({ add, trash, pencil, close, checkmark, notifications, checkmarkCircle, alertCircle, timeOutline, calendarOutline, infiniteOutline, stopwatchOutline, informationCircleOutline });
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
    // Carregar transações do mês atual para cruzamento
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    this.currentMonthTransactions = await this.transactionService.getTransactionsByMonth(currentMonth, currentYear);

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
    this.hasEndDate = false;
    this.formData = {
      description: '',
      notes: '',
      is_active: true,
      payment_method: '',
      value: 0,
      category_id: '',
      payment_day: 1,
      release_type_id: ReleaseTypesId.EXPENSE,
      notifications: true,
      notifyDaysBefore: 3,
      start_date: moment().format('YYYY-MM-DD'),
      end_date: null,
    };
    this.isModalOpen = true;
  }

  openEditModal(expense: Release) {
    this.isEditMode = true;
    this.currentExpense = expense;
    this.hasEndDate = !!expense.end_date;
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
      start_date: expense.start_date || moment().format('YYYY-MM-DD'),
      end_date: expense.end_date || null,
    };
    this.isModalOpen = true;
  }

  getReleaseTypeIdByType(releaseType?: string): ReleaseTypesId {
    if (!releaseType) return ReleaseTypesId.EXPENSE;
    return releaseType === 'entrada' ? ReleaseTypesId.INCOME : ReleaseTypesId.EXPENSE;
  }

  getCategoryIdByName(categoryName?: string): string {
    if (!categoryName) return '';
    const category = this.categories.find(cat => cat.category === categoryName);
    return category ? category.id : '';
  }

  closeModal() {
    this.isModalOpen = false;
    this.hasEndDate = false;
  }

  onHasEndDateChange(event: any) {
    this.hasEndDate = event.detail.value === 'yes';
    if (!this.hasEndDate) {
      this.formData.end_date = null;
    }
  }

  onStartDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.formData.start_date = moment(value).format('YYYY-MM-DD');
    }
  }

  onEndDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.formData.end_date = moment(value).format('YYYY-MM-DD');
    }
  }

  getMinEndDate(): string {
    return this.formData.start_date || moment().format('YYYY-MM-DD');
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

    // Validar data de término se o usuário marcou que tem fim
    if (this.hasEndDate && !this.formData.end_date) {
      const toast = await this.toastCtrl.create({
        message: 'Informe a data de término do lançamento',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    // Garantir que os IDs sejam numéricos e incluir datas
    const dataToSend = {
      ...this.formData,
      category_id: Number(this.formData.category_id),
      release_type_id: Number(this.formData.release_type_id),
      value: Number(this.formData.value),
      start_date: this.formData.start_date || null,
      end_date: this.hasEndDate ? this.formData.end_date : null,
    };

    try {
      if (this.isEditMode && this.currentExpense) {
        await this.expenseService.updateExpense(this.currentExpense.id, dataToSend);
      } else {
        await this.expenseService.addExpense(dataToSend);
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

  /**
   * Verifica se o lançamento fixo já existe como transação no mês atual
   */
  hasMatchingTransaction(expense: Release): boolean {
    // Se já tem um release_id associado, já foi convertido
    if (expense.current_month_release_id) {
      return true;
    }

    // Cruzar com transações do mês pela descrição e categoria
    return this.currentMonthTransactions.some(transaction => {
      const descriptionMatch = transaction.description.toLowerCase() === expense.description.toLowerCase();
      const categoryMatch = transaction.category_name?.toLowerCase() === expense.category_name?.toLowerCase();
      const valueMatch = Math.abs(parseFloat(transaction.value as string) - expense.value) < 0.01;

      // Considera match se descrição E categoria coincidirem, OU descrição E valor coincidirem
      return descriptionMatch && (categoryMatch || valueMatch);
    });
  }

  isCurrentMonthPaid(expense: Release): boolean {
    // Verificar pelo status da API
    if (expense.current_month_payment_status === 'pago') {
      return true;
    }

    // Verificar se já existe uma transação correspondente no mês
    return this.hasMatchingTransaction(expense);
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

  getStatusBadgeColor(expense: Release): string {
    // Primeiro verificar se já foi pago (via API ou transação correspondente)
    if (this.isCurrentMonthPaid(expense)) {
      return 'success';
    }

    // Se não está pago, verificar dias até vencimento
    const status = this.getPaymentStatus(expense.id);
    if (status.isOverdue) return 'danger';
    if (status.daysUntilDue <= 3) return 'warning';
    return 'medium';
  }

  getStatusLabel(expense: Release): string {
    // Primeiro verificar se já foi pago (via API ou transação correspondente)
    if (this.isCurrentMonthPaid(expense)) {
      return 'Pagamento concluído';
    }

    // Se não está pago, mostrar dias até vencimento
    const status = this.getPaymentStatus(expense.id);
    if (status.isOverdue) return `Atrasada (${Math.abs(status.daysUntilDue)}d)`;
    if (status.daysUntilDue === 0) return 'Vence hoje';
    if (status.daysUntilDue > 0) return `${status.daysUntilDue}d`;
    return 'Pendente';
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

  async showExpenseOptions(expense: Release) {
    const isPaid = this.isCurrentMonthPaid(expense);
    const isActive = this.isExpenseActive(expense);

    const buttons: any[] = [];

    // Opção de marcar como pago (apenas se não estiver pago)
    if (!isPaid && isActive) {
      buttons.push({
        text: 'Pagar',
        icon: 'checkmark-circle',
        handler: () => {
          this.markAsPaid(expense);
        },
      });
    }

    // Opção de editar
    buttons.push({
      text: 'Editar',
      icon: 'pencil',
      handler: () => {
        this.openEditModal(expense);
      },
    });

    // Opção de ativar/desativar
    buttons.push({
      text: isActive ? 'Desativar recorrência' : 'Ativar recorrência',
      icon: isActive ? 'close' : 'checkmark',
      handler: () => {
        this.toggleActive(expense);
      },
    });

    // Opção de excluir
    buttons.push({
      text: 'Excluir',
      icon: 'trash',
      role: 'destructive',
      handler: () => {
        this.deleteExpense(expense);
      },
    });

    // Botão de cancelar
    buttons.push({
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel',
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: expense.description,
      subHeader: `R$ ${expense.value.toFixed(2).replace('.', ',')} • Dia ${expense.payment_day}`,
      buttons,
    });

    await actionSheet.present();
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
}
