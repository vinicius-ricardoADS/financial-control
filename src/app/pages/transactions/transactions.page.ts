import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonFabList,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonModal,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButtons,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { TransactionService } from '../../../services/transaction.service';
import { CategoryService } from '../../../services/category.service';
import { Transaction, TransactionCreate } from '../../../models/transaction.model';
import { Category } from '../../../models/category.model';
import moment from 'moment';
import { addIcons } from 'ionicons';
import {
  search,
  arrowUp,
  arrowDown,
  trash,
  pencil,
  close,
  checkmark,
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
    IonFab,
    IonFabButton,
    IonFabList,
    IonSegment,
    IonSegmentButton,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButtons,
  ],
})
export class TransactionsPage implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Category[] = [];

  filterType: 'all' | ReleaseTypes = 'all';
  searchTerm: string = '';

  // Expor ReleaseTypes para o template
  ReleaseTypes = ReleaseTypes;

  // Modal de adicionar/editar
  isModalOpen = false;
  isEditMode = false;
  currentTransaction: Transaction | null = null;

  formData: TransactionCreate = {
    release_type: ReleaseTypes.EXPENSE,
    amount: 0,
    categoryId: '',
    description: '',
    date: this.getTodayDateString(),
    notes: '',
  };

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
  ) {
    addIcons({ search, arrowUp, arrowDown, trash, pencil, close, checkmark, cashOutline, cardOutline });

    // Verificar se foi passado um tipo para abrir o modal
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
    if (state && state['openModalType']) {
      setTimeout(() => {
        this.openAddModalWithType(state['openModalType']);
      }, 300);
    }
  }

  async ngOnInit() {
    await this.loadCategories();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  private async loadCategories() {
    this.categories = await this.categoryService.getAllCategories();
  }

  async loadData() {
    this.transactions = await this.transactionService.getAllTransactions();
    this.categories = await this.categoryService.getAllCategories();
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
          t.category?.category.toLowerCase().includes(term) ||
          t.notes?.toLowerCase().includes(term),
      );
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    this.filteredTransactions = filtered;
  }

  onFilterChange(event: any) {
    this.filterType = event.detail.value;
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  openAddModal() {
    this.openAddModalWithType(ReleaseTypes.EXPENSE);
  }

  openAddModalWithType(type: ReleaseTypes) {
    this.isEditMode = false;
    this.currentTransaction = null;
    this.formData = {
      release_type: type,
      amount: 0,
      categoryId: '',
      description: '',
      date: this.getTodayDateString(),
      notes: '',
    };
    this.isModalOpen = true;
  }

  openEditModal(transaction: Transaction) {
    this.isEditMode = true;
    this.currentTransaction = transaction;
    this.formData = {
      release_type: transaction.release_type,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      description: transaction.description,
      date: this.convertToDateInputFormat(transaction.date),
      notes: transaction.notes,
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveTransaction() {
    // Validação
    if (!this.formData.description || !this.formData.categoryId || this.formData.amount <= 0) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos obrigatórios',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    try {
      if (this.isEditMode && this.currentTransaction) {
        await this.transactionService.updateTransaction(
          this.currentTransaction.id,
          this.formData,
        );
        const toast = await this.toastCtrl.create({
          message: 'Transação atualizada com sucesso!',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
      } else {
        await this.transactionService.addTransaction(this.formData);
        const toast = await this.toastCtrl.create({
          message: 'Transação adicionada com sucesso!',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
      }

      this.closeModal();

      // Pequeno delay para garantir que o storage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));

      await this.loadData();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao salvar transação',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  async deleteTransaction(transaction: Transaction) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar exclusão',
      message: `Deseja realmente excluir a transação "${transaction.description}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            await this.transactionService.deleteTransaction(transaction.id);
            const toast = await this.toastCtrl.create({
              message: 'Transação excluída com sucesso!',
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

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatDate(date: string | Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  getTransactionIcon(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'arrow-up' : 'arrow-down';
  }

  getTransactionColor(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'success' : 'danger';
  }

  getTransactionClass(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'income' : 'expense';
  }

  // Retorna a data de hoje no formato YYYY-MM-DD para o input HTML
  getTodayDateString(): string {
    return moment().format('YYYY-MM-DD');
  }

  // Converte uma data para o formato YYYY-MM-DD para o input HTML
  convertToDateInputFormat(date: string | Date): string {
    return moment(date).format('YYYY-MM-DD');
  }
}
