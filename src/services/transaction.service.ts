import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Transaction,
  TransactionCreate,
  TransactionFilter,
} from '../models/transaction.model';
import { ReleaseTypes } from '../models/fixed-expense.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly apiUrl = `${environment.api}`;
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> =
    this.transactionsSubject.asObservable();

  private transactionsLoaded = false;

  constructor(private http: HttpClient) {}

  async getAllTransactions(): Promise<Transaction[]> {
    if (this.transactionsLoaded && this.transactionsSubject.value.length > 0) {
      return this.transactionsSubject.value;
    }

    const transactions = await firstValueFrom(
      this.http.get<Transaction[]>(`${this.apiUrl}/release`).pipe(
        tap((data) => {
          this.transactionsSubject.next(data);
          this.transactionsLoaded = true;
        })
      )
    );
    return transactions;
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    if (this.transactionsLoaded) {
      const cached = this.transactionsSubject.value.find((t) => t.id === id);
      if (cached) return cached;
    }

    try {
      const transaction = await firstValueFrom(
        this.http.get<Transaction>(`${this.apiUrl}/${id}`)
      );
      return transaction;
    } catch {
      return undefined;
    }
  }

  async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
    const transactions = await firstValueFrom(
      this.http.post<Transaction[]>(`${this.apiUrl}/releaseformonth`, { month, year }).pipe(
        tap((data) => {
          console.log('Fetched transactions for', month, year);
          this.transactionsSubject.next(data);
        })
      )
    );
    return transactions;
  }

  async getFilteredTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    let transactions: Transaction[];

    if (filter.month && filter.year) {
      transactions = await this.getTransactionsByMonth(filter.month, filter.year);
    } else {
      transactions = await this.getAllTransactions();
    }

    if (filter.type) {
      transactions = transactions.filter((t) => t.release_type === filter.type);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          t.notes?.toLowerCase().includes(search) ||
          t.category_name?.toLowerCase().includes(search),
      );
    }

    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async getTotalByType(
    type: ReleaseTypes | string,
    month?: number,
    year?: number,
  ): Promise<number> {
    let transactions: Transaction[];

    if (month && year) {
      transactions = await this.getTransactionsByMonth(month, year);
    } else {
      transactions = await this.getAllTransactions();
    }

    transactions = transactions.filter((t) => t.release_type === type);
    return transactions.reduce((sum, t) => sum + parseFloat(t.value), 0);
  }

  /**
   * Força recarregar as transações do servidor
   */
  async refreshTransactions(): Promise<Transaction[]> {
    this.transactionsLoaded = false;
    return this.getAllTransactions();
  }

  /**
   * Recarrega transações de um mês específico
   */
  async refreshTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
    return this.getTransactionsByMonth(month, year);
  }

  /**
   * Cria uma nova transação/release
   */
  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const transaction = await firstValueFrom(
      this.http.post<Transaction>(`${this.apiUrl}/release`, data)
    );

    // Atualiza o cache local
    const currentTransactions = this.transactionsSubject.value;
    this.transactionsSubject.next([transaction, ...currentTransactions]);

    return transaction;
  }
}
