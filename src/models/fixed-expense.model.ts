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
  userId?: string
  description: string;
  notes?: string;
  is_active: boolean;
  release_type: ReleaseTypes;
  payment_method?: string;
  value: number;
  payment_day: number; // dia do vencimento (1-31)
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
  EXPENSE = '2',
  INCOME = '1',
}

export interface ReleasesCreate {
  description: string;
  notes?: string;
  value: number;
  payment_day: number;
  category_id: string;
  release_type_id: ReleaseTypes;
  payment_method?: string;
  notifications?: boolean;
  isActive?: boolean;
  notifyDaysBefore?: number;
}
