export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  budget?: number; // limite mensal para essa categoria
  order?: number; // ordem de exibição
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Despesas
  {
    id: 'food',
    name: 'Alimentação',
    icon: 'restaurant',
    color: '#FF6B6B',
    type: 'expense',
    order: 1,
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: 'directions_car',
    color: '#4ECDC4',
    type: 'expense',
    order: 2,
  },
  {
    id: 'home',
    name: 'Moradia',
    icon: 'home',
    color: '#45B7D1',
    type: 'expense',
    order: 3,
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: 'local_hospital',
    color: '#96CEB4',
    type: 'expense',
    order: 4,
  },
  {
    id: 'education',
    name: 'Educação',
    icon: 'school',
    color: '#FFEAA7',
    type: 'expense',
    order: 5,
  },
  {
    id: 'entertainment',
    name: 'Lazer',
    icon: 'sports_esports',
    color: '#DDA15E',
    type: 'expense',
    order: 6,
  },
  {
    id: 'shopping',
    name: 'Compras',
    icon: 'shopping_cart',
    color: '#BC6C25',
    type: 'expense',
    order: 7,
  },
  {
    id: 'bills',
    name: 'Contas',
    icon: 'receipt_long',
    color: '#606C38',
    type: 'expense',
    order: 8,
  },
  {
    id: 'other-expense',
    name: 'Outros',
    icon: 'more_horiz',
    color: '#999999',
    type: 'expense',
    order: 9,
  },
  // Receitas
  {
    id: 'salary',
    name: 'Salário',
    icon: 'payments',
    color: '#2ECC71',
    type: 'income',
    order: 1,
  },
  {
    id: 'investment',
    name: 'Investimentos',
    icon: 'trending_up',
    color: '#27AE60',
    type: 'income',
    order: 2,
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: 'work',
    color: '#16A085',
    type: 'income',
    order: 3,
  },
  {
    id: 'other-income',
    name: 'Outros',
    icon: 'attach_money',
    color: '#1ABC9C',
    type: 'income',
    order: 4,
  },
];
