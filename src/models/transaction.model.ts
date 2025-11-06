import { Category } from './category.model';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  category?: Category; // será preenchido ao carregar
  description: string;
  date: Date | string; // ISO string para storage
  isRecurring: boolean;
  recurringDay?: number; // dia do mês para recorrência
  attachments?: string[]; // URLs de fotos/comprovantes
  tags?: string[];
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TransactionCreate {
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  description: string;
  date?: Date | string;
  isRecurring?: boolean;
  recurringDay?: number;
  notes?: string;
  tags?: string[];
}

export interface TransactionFilter {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
}
