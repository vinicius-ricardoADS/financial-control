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
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonDatetime,
  IonDatetimeButton,
  IonPopover,
} from '@ionic/angular/standalone';
import { TransactionService } from '../../../services/transaction.service';
import { CategoryService } from '../../../services/category.service';
import { Transaction, TransactionCreate } from '../../../models/transaction.model';
import { Category } from '../../../models/category.model';
import { RecurrenceTypes, RecurrenceTypesId } from '../../../models/transactions.model';
import moment from 'moment';
import { addIcons } from 'ionicons';
import {
  search,
  arrowUp,
  arrowDown,
  cashOutline,
  cardOutline,
  add,
  close,
} from 'ionicons/icons';
import { ReleaseTypes, ReleaseTypesId, PaymentStatusId } from 'src/models/fixed-expense.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
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
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonButtons,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonDatetime,
    IonDatetimeButton,
    IonPopover,
  ],
})
export class TransactionsPage implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Category[] = [];

  filterType: 'all' | ReleaseTypes | string = 'all';
  searchTerm: string = '';

  // Expor enums para o template
  ReleaseTypes = ReleaseTypes;
  ReleaseTypesId = ReleaseTypesId;
  RecurrenceTypes = RecurrenceTypes;
  RecurrenceTypesId = RecurrenceTypesId;
  PaymentStatusId = PaymentStatusId;

  currentMonth: number = new Date().getMonth() + 1;
  currentYear: number = new Date().getFullYear();

  // Modal state
  isModalOpen: boolean = false;
  isSubmitting: boolean = false;

  // Form data
  formData: Partial<TransactionCreate> = this.getEmptyFormData();

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
  ) {
    addIcons({ search, arrowUp, arrowDown, cashOutline, cardOutline, add, close });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    const [transactions, categories] = await Promise.all([
      this.transactionService.getTransactionsByMonth(this.currentMonth, this.currentYear),
      this.categoryService.getAllCategories(),
    ]);
    this.transactions = transactions;
    this.categories = categories;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.transactions];

    // Filtro por tipo
    if (this.filterType !== 'all') {
      filtered = filtered.filter((t) => t.release_type === this.filterType);
    }

    // Filtro por busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.category_name?.toLowerCase().includes(term) ||
          t.notes?.toLowerCase().includes(term),
      );
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    this.filteredTransactions = filtered;
  }

  async handleRefresh(event: any) {
    await this.transactionService.refreshTransactionsByMonth(this.currentMonth, this.currentYear);
    await this.loadData();
    event.target.complete();
  }

  onFilterChange(event: any) {
    this.filterType = event.detail.value;
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  formatCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  }

  formatDate(date: string | Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  getTransactionIcon(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'arrow-up' : 'arrow-down';
  }

  getTransactionColor(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'success' : 'danger';
  }

  getTransactionClass(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'income' : 'expense';
  }

  getRecurrenceLabel(type: RecurrenceTypes | string): string {
    switch (type) {
      case RecurrenceTypes.FIXED: return 'Fixa';
      case RecurrenceTypes.VARIABLE: return 'Variável';
      case RecurrenceTypes.RECURRENCE: return 'Recorrente';
      case RecurrenceTypes.LOOSE: return 'Avulsa';
      default: return type as string;
    }
  }

  getPaymentStatusLabel(status: string): string {
    return status === 'pago' ? 'Pago' : 'Pendente';
  }

  getPaymentStatusColor(status: string): string {
    return status === 'pago' ? 'success' : 'warning';
  }

  // Modal methods
  private getEmptyFormData(): Partial<TransactionCreate> {
    return {
      release_type_id: ReleaseTypesId.EXPENSE,
      category_id: undefined,
      recurrence_type_id: RecurrenceTypesId.LOOSE,
      payment_status_id: PaymentStatusId.PENDING,
      description: '',
      value: undefined,
      date: moment().format('YYYY-MM-DD'),
      payment_method: '',
      notes: '',
    };
  }

  openModal() {
    this.formData = this.getEmptyFormData();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.formData = this.getEmptyFormData();
  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.formData.date = moment(value).format('YYYY-MM-DD');
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.release_type_id &&
      this.formData.category_id &&
      this.formData.payment_status_id &&
      this.formData.description &&
      this.formData.description.length >= 6 &&
      this.formData.value &&
      this.formData.value > 0 &&
      this.formData.date &&
      this.formData.payment_method &&
      this.formData.payment_method.length >= 3
    );
  }

  async submitTransaction() {
    if (!this.isFormValid() || this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const data: TransactionCreate = {
        release_type_id: this.formData.release_type_id!,
        category_id: Number(this.formData.category_id),
        recurrence_type_id: this.formData.recurrence_type_id,
        payment_status_id: this.formData.payment_status_id!,
        description: this.formData.description!,
        value: Number(this.formData.value),
        date: this.formData.date!,
        payment_method: this.formData.payment_method!,
        notes: this.formData.notes || undefined,
      };

      await this.transactionService.createTransaction(data);
      this.closeModal();
      await this.loadData();
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
    } finally {
      this.isSubmitting = false;
    }
  }
}
