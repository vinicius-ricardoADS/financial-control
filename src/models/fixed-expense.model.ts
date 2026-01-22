import { Category } from './category.model';

export interface PaymentRecord {
  id: string;
  date: Date | string;
  amount: number;
  paid: boolean;
  paidDate?: Date | string;
  notes?: string;
}

export interface Release {
  id: string;
  description: string;
  detail_description?: string;
  is_active: boolean;
  release_type: ReleaseTypes;
  payment_method?: string;
  amount: number;
  dueDay: number; // dia do vencimento (1-31)
  categoryId: string;
  category?: Category;
  isActive: boolean;
  notifications: boolean;
  notifyDaysBefore: number; // quantos dias antes notificar
  paymentHistory: PaymentRecord[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export enum ReleaseTypes {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export interface ReleasesCreate {
  description: string;
  detail_description?: string;
  amount: number;
  dueDay: number;
  categoryId: string;
  release_type: ReleaseTypes;
  payment_method?: string;
  notifications?: boolean;
  isActive?: boolean;
  notifyDaysBefore?: number;
}
