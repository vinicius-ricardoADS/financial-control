import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Transaction,
  TransactionCreate,
  TransactionFilter,
} from '../models/transaction.model';
import { StorageService } from './storage.service';
import { CategoryService } from './category.service';
import moment from 'moment';

const STORAGE_KEY = 'transactions';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> =
    this.transactionsSubject.asObservable();

  constructor(
    private storage: StorageService,
    private categoryService: CategoryService,
  ) {
    this.loadTransactions();
  }

  private async loadTransactions(): Promise<void> {
    const transactions = (await this.storage.get<Transaction[]>(STORAGE_KEY)) || [];

    // Preencher categorias
    const withCategories = await Promise.all(
      transactions.map(async (t) => ({
        ...t,
        category: await this.categoryService.getCategoryById(t.categoryId),
      })),
    );

    this.transactionsSubject.next(withCategories);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionsSubject.value;
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.transactionsSubject.value.find((t) => t.id === id);
  }

  async addTransaction(data: TransactionCreate): Promise<Transaction> {
    console.log('TransactionService.addTransaction: Iniciando...', data);

    const transactions = [...this.transactionsSubject.value];
    console.log('TransactionService.addTransaction: Transações atuais:', transactions.length);

    const category = await this.categoryService.getCategoryById(data.categoryId);
    console.log('TransactionService.addTransaction: Categoria encontrada:', category);

    const newTransaction: Transaction = {
      id: this.generateId(),
      type: data.type,
      amount: data.amount,
      categoryId: data.categoryId,
      category,
      description: data.description,
      date: data.date || new Date().toISOString(),
      isRecurring: data.isRecurring || false,
      recurringDay: data.recurringDay,
      notes: data.notes,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('TransactionService.addTransaction: Nova transação criada:', newTransaction);

    transactions.push(newTransaction);
    console.log('TransactionService.addTransaction: Total após adicionar:', transactions.length);

    await this.saveTransactions(transactions);
    console.log('TransactionService.addTransaction: Transação salva com sucesso!');

    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<TransactionCreate>,
  ): Promise<void> {
    let transactions = [...this.transactionsSubject.value];
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) return;

    const category = updates.categoryId
      ? await this.categoryService.getCategoryById(updates.categoryId)
      : transactions[index].category;

    transactions[index] = {
      ...transactions[index],
      ...updates,
      category,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTransactions(transactions);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactions = this.transactionsSubject.value.filter((t) => t.id !== id);
    await this.saveTransactions(transactions);
  }

  async getFilteredTransactions(
    filter: TransactionFilter,
  ): Promise<Transaction[]> {
    let transactions = [...this.transactionsSubject.value];

    if (filter.type) {
      transactions = transactions.filter((t) => t.type === filter.type);
    }

    if (filter.categoryId) {
      transactions = transactions.filter((t) => t.categoryId === filter.categoryId);
    }

    if (filter.startDate) {
      const startDate = moment(filter.startDate).startOf('day');
      transactions = transactions.filter((t) =>
        moment(t.date).isSameOrAfter(startDate),
      );
    }

    if (filter.endDate) {
      const endDate = moment(filter.endDate).endOf('day');
      transactions = transactions.filter((t) =>
        moment(t.date).isSameOrBefore(endDate),
      );
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          t.notes?.toLowerCase().includes(search) ||
          t.category?.name.toLowerCase().includes(search),
      );
    }

    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
    const startDate = moment({ year, month: month - 1, day: 1 }).startOf('month');
    const endDate = moment({ year, month: month - 1, day: 1 }).endOf('month');
    console.log(`startDate: ${startDate.toDate()}, endDate: ${endDate.toDate()}`);

    return this.getFilteredTransactions({
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    });
  }

  async getTotalByType(
    type: 'income' | 'expense',
    month?: number,
    year?: number,
  ): Promise<number> {
    let transactions = this.transactionsSubject.value.filter((t) => t.type === type);

    if (month && year) {
      const monthTransactions = await this.getTransactionsByMonth(month, year);
      transactions = monthTransactions.filter((t) => t.type === type);
    }

    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    console.log('TransactionService.saveTransactions: Iniciando salvamento de', transactions.length, 'transações');

    // Remove categoria antes de salvar (circular reference)
    const toSave = transactions.map(({ category, ...rest }) => rest);
    console.log('TransactionService.saveTransactions: Dados preparados para storage:', toSave);

    await this.storage.set(STORAGE_KEY, toSave);
    console.log('TransactionService.saveTransactions: Dados salvos no storage com sucesso!');

    // Verificar se foi salvo corretamente
    const savedData = await this.storage.get(STORAGE_KEY);
    console.log('TransactionService.saveTransactions: Verificação - dados no storage:', savedData);

    console.log('TransactionService.saveTransactions: Disparando next() para subscribers...');
    this.transactionsSubject.next(transactions);

    console.log('TransactionService.saveTransactions: next() disparado! Subscribers devem ser notificados.');
  }

  private generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
