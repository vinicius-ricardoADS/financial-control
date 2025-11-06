import { Category } from './category.model';

export interface PaymentRecord {
  id: string;
  date: Date | string;
  amount: number;
  paid: boolean;
  paidDate?: Date | string;
  notes?: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // dia do vencimento (1-31)
  categoryId: string;
  category?: Category;
  isActive: boolean;
  notifications: boolean;
  notifyDaysBefore: number; // quantos dias antes notificar
  description?: string;
  paymentHistory: PaymentRecord[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FixedExpenseCreate {
  name: string;
  amount: number;
  dueDay: number;
  categoryId: string;
  description?: string;
  notifications?: boolean;
  notifyDaysBefore?: number;
}
