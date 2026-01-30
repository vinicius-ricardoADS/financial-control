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
  IonChip,
  IonBadge,
  IonNote,
} from '@ionic/angular/standalone';
import { TransactionService } from '../../../services/transaction.service';
import { CategoryService } from '../../../services/category.service';
import { Transaction, TransactionCreate } from '../../../models/transaction.model';
import { Category } from '../../../models/category.model';
import { RecurrenceTypes, RecurrenceTypesId } from '../../../models/transactions.model';
import moment from 'moment';
import 'moment/locale/pt-br';
import { addIcons } from 'ionicons';
import {
  search,
  arrowUp,
  arrowDown,
  cashOutline,
  cardOutline,
  add,
  close,
  calendarOutline,
  filterOutline,
  chevronBack,
  chevronForward,
  walletOutline,
  trendingUp,
  trendingDown,
} from 'ionicons/icons';
import { ReleaseTypes, ReleaseTypesId, PaymentStatusId } from 'src/models/fixed-expense.model';

moment.locale('pt-br');

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

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
    IonChip,
    IonBadge,
    IonNote,
  ],
})
export class TransactionsPage implements OnInit {
  allTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  groupedTransactions: MonthGroup[] = [];
  categories: Category[] = [];

  // Filtros
  filterType: 'all' | ReleaseTypes | string = 'all';
  searchTerm: string = '';
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number | null = null; // null = todos os meses

  // Anos disponíveis para seleção
  availableYears: number[] = [];

  // Meses para chips
  months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Fev' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Ago' },
    { value: 9, label: 'Set' },
    { value: 10, label: 'Out' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dez' },
  ];

  // Totais gerais
  totalIncome: number = 0;
  totalExpense: number = 0;
  totalBalance: number = 0;

  // Expor enums para o template
  ReleaseTypes = ReleaseTypes;
  ReleaseTypesId = ReleaseTypesId;
  RecurrenceTypes = RecurrenceTypes;
  RecurrenceTypesId = RecurrenceTypesId;
  PaymentStatusId = PaymentStatusId;

  // Modal state
  isModalOpen: boolean = false;
  isSubmitting: boolean = false;

  // Form data
  formData: Partial<TransactionCreate> = this.getEmptyFormData();

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
  ) {
    addIcons({
      search, arrowUp, arrowDown, cashOutline, cardOutline, add, close,
      calendarOutline, filterOutline, chevronBack, chevronForward,
      walletOutline, trendingUp, trendingDown
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    const [transactions, categories] = await Promise.all([
      this.transactionService.getAllTransactions(),
      this.categoryService.getAllCategories(),
    ]);
    this.allTransactions = transactions;
    this.categories = categories;

    // Extrair anos disponíveis das transações
    this.extractAvailableYears();

    this.applyFilters();
  }

  extractAvailableYears() {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);

    this.allTransactions.forEach(t => {
      const year = moment(t.date).year();
      years.add(year);
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a);
  }

  applyFilters() {
    let filtered = [...this.allTransactions];

    // Filtro por ano
    filtered = filtered.filter(t => moment(t.date).year() === this.selectedYear);

    // Filtro por mês (se selecionado)
    if (this.selectedMonth !== null) {
      filtered = filtered.filter(t => moment(t.date).month() + 1 === this.selectedMonth);
    }

    // Filtro por tipo
    if (this.filterType !== 'all') {
      filtered = filtered.filter(t => t.release_type === this.filterType);
    }

    // Filtro por busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(term) ||
        t.category_name?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term)
      );
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.filteredTransactions = filtered;

    // Calcular totais
    this.calculateTotals();

    // Agrupar por mês
    this.groupByMonth();
  }

  calculateTotals() {
    this.totalIncome = this.filteredTransactions
      .filter(t => t.release_type === ReleaseTypes.INCOME)
      .reduce((sum, t) => sum + parseFloat(t.value as string), 0);

    this.totalExpense = this.filteredTransactions
      .filter(t => t.release_type === ReleaseTypes.EXPENSE)
      .reduce((sum, t) => sum + parseFloat(t.value as string), 0);

    this.totalBalance = this.totalIncome - this.totalExpense;
  }

  groupByMonth() {
    const groups = new Map<string, MonthGroup>();

    this.filteredTransactions.forEach(t => {
      const date = moment(t.date);
      const monthKey = date.format('YYYY-MM');
      const monthLabel = date.format('MMMM [de] YYYY');

      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        });
      }

      const group = groups.get(monthKey)!;
      group.transactions.push(t);

      const value = parseFloat(t.value as string);
      if (t.release_type === ReleaseTypes.INCOME) {
        group.totalIncome += value;
      } else {
        group.totalExpense += value;
      }
      group.balance = group.totalIncome - group.totalExpense;
    });

    // Ordenar grupos por data (mais recente primeiro)
    this.groupedTransactions = Array.from(groups.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }

  async handleRefresh(event: any) {
    await this.transactionService.refreshTransactions();
    await this.loadData();
    event.target.complete();
  }

  // Navegação de ano
  previousYear() {
    this.selectedYear--;
    this.applyFilters();
  }

  nextYear() {
    this.selectedYear++;
    this.applyFilters();
  }

  canGoToPreviousYear(): boolean {
    // Permite ir até 5 anos para trás do ano mais antigo com transações
    const minYear = this.availableYears.length > 0
      ? Math.min(...this.availableYears)
      : new Date().getFullYear();
    return this.selectedYear > minYear - 5;
  }

  canGoToNextYear(): boolean {
    // Permite ir até o ano atual + 1
    const maxYear = new Date().getFullYear() + 1;
    return this.selectedYear < maxYear;
  }

  // Seleção de mês
  selectMonth(month: number | null) {
    this.selectedMonth = this.selectedMonth === month ? null : month;
    this.applyFilters();
  }

  isMonthSelected(month: number): boolean {
    return this.selectedMonth === month;
  }

  isCurrentMonth(month: number): boolean {
    const now = new Date();
    return this.selectedYear === now.getFullYear() && month === now.getMonth() + 1;
  }

  hasTransactionsInMonth(month: number): boolean {
    return this.allTransactions.some(t => {
      const date = moment(t.date);
      return date.year() === this.selectedYear && date.month() + 1 === month;
    });
  }

  getMonthFullName(month: number): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[month - 1] || '';
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

  formatShortDate(date: string | Date): string {
    return moment(date).format('DD MMM');
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
