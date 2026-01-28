import { Category } from './category.model';

export interface PaymentRecord {
  id: string;
  date: Date | string;
  amount: number;
  paid: boolean;
  paidDate?: Date | string;
  notes?: string;
}

export enum ActiveStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum PaymentStatus {
  PENDING = 1,
  PAID = 2,
}

export enum ReleaseTypes {
  INCOME = '1',
  EXPENSE = '2',
}

export interface Release {
  id: string;
  userId?: string;
  description: string;
  notes?: string;
  is_active: ActiveStatus;
  release_type_id: ReleaseTypes;
  release_type?: string;
  current_month_payment_date?: string;
  current_month_payment_status?: string;
  current_month_release_date?: string;
  current_month_release_id?: string;
  payment_method?: string;
  value: number;
  payment_day: number;
  category_id: string;
  category_name?: string;
  category?: Category;
  status?: PaymentStatus;
  notifications: boolean;
  notifyDaysBefore: number;
  paymentHistory: PaymentRecord[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReleasesCreate {
  description: string;
  notes?: string;
  value: number;
  payment_day: number;
  category_id: string;
  category_name?: string;
  release_type_id: ReleaseTypes;
  release_type?: string;
  payment_method?: string;
  notifications?: boolean;
  is_active?: boolean;
  notifyDaysBefore?: number;
  status?: PaymentStatus;
}
