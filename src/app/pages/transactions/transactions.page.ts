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
} from '@ionic/angular/standalone';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../models/transaction.model';
import { RecurrenceTypes } from '../../../models/transactions.model';
import moment from 'moment';
import { addIcons } from 'ionicons';
import {
  search,
  arrowUp,
  arrowDown,
  cashOutline,
  cardOutline,
} from 'ionicons/icons';
import { ReleaseTypes } from 'src/models/fixed-expense.model';

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
  ],
})
export class TransactionsPage implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  filterType: 'all' | ReleaseTypes | string = 'all';
  searchTerm: string = '';

  // Expor ReleaseTypes e RecurrenceTypes para o template
  ReleaseTypes = ReleaseTypes;
  RecurrenceTypes = RecurrenceTypes;

  currentMonth: number = new Date().getMonth() + 1;
  currentYear: number = new Date().getFullYear();

  constructor(
    private transactionService: TransactionService,
  ) {
    addIcons({ search, arrowUp, arrowDown, cashOutline, cardOutline });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.transactions = await this.transactionService.getTransactionsByMonth(
      this.currentMonth,
      this.currentYear
    );
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
}
