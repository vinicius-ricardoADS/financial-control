import { ReleaseTypes, PaymentStatus } from './fixed-expense.model';
import { RecurrenceTypes } from './transactions.model';

export interface Transaction {
  id: number;
  user_id: number;
  user_name: string;
  release_type: ReleaseTypes | string;
  value: string;
  category_name: string;
  category_icon: string;
  recurrence_type: RecurrenceTypes | string;
  payment_status: PaymentStatus | string;
  payment_method: string;
  description: string;
  date: string;
  payment_date?: string;
  notes?: string;
  created_at: string;
}

export interface TransactionCreate {
  release_type: ReleaseTypes | string;
  recurrence_type: RecurrenceTypes | string;
  category_id: number;
  value: number | string;
  description: string;
  date?: string;
  payment_method?: string;
  notes?: string;
}

export interface TransactionFilter {
  month?: number;
  year?: number;
  type?: ReleaseTypes;
  search?: string;
}
