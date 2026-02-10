import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Transaction } from '../models/transaction.model';

export interface DashboardData {
  total_expenses: number;
  total_incomes: number;
  balance: number;
  transactions: Transaction[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.api}/dashboard`;

  constructor(private http: HttpClient) {}

  async getDashboardData(): Promise<DashboardData> {
    return firstValueFrom(this.http.get<DashboardData>(this.apiUrl));
  }
}
