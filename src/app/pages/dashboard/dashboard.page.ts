import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonFab,
  IonFabButton,
  IonFabList,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../../services/dashboard.service';
import { FixedExpenseService } from '../../../services/fixed-expense.service';
import { Transaction } from '../../../models/transaction.model';
import { Release, ReleaseTypes } from '../../../models/fixed-expense.model';
import moment from 'moment';
import "moment/locale/pt-br";
import { addIcons } from 'ionicons';
import {
  trendingUp,
  trendingDown,
  wallet,
  arrowUp,
  arrowDown,
  cashOutline,
  cardOutline,
  notifications,
  checkmarkCircle,
  alertCircle,
} from 'ionicons/icons';

Chart.register(...registerables);

export interface CategorySummary {
  categoryName: string;
  categoryIcon: string;
  total: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    IonFabList,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef;
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef;

  dashboardData: DashboardData | null = null;
  recentTransactions: Transaction[] = [];
  expensesByCategory: CategorySummary[] = [];
  upcomingExpenses: Array<{
    expense: Release;
    isPaid: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
  }> = [];
  currentMonth: string = '';

  barChart: Chart | null = null;
  pieChart: Chart | null = null;

  // Cores para as categorias
  private categoryColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  ];

  // Expor ReleaseTypes para o template
  ReleaseTypes = ReleaseTypes;

  constructor(
    private dashboardService: DashboardService,
    private fixedExpenseService: FixedExpenseService,
    private router: Router,
  ) {
    addIcons({ trendingUp, trendingDown, wallet, arrowUp, arrowDown, cashOutline, cardOutline, notifications, checkmarkCircle, alertCircle });
  }

  async ngOnInit() {
    this.currentMonth = moment().format('MMMM YYYY');
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  ngOnDestroy() {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
  }

  async loadData() {
    try {
      // Carregar dados do dashboard da API
      this.dashboardData = await this.dashboardService.getDashboardData();
      this.recentTransactions = this.dashboardData.transactions.slice(0, 5);

      // Calcular despesas por categoria
      this.expensesByCategory = this.calculateExpensesByCategory(this.dashboardData.transactions);

      // Carregar próximas despesas fixas (próximos 7 dias)
      // Filtrar apenas lançamentos que ainda não viraram transação no mês atual
      const paymentStatus = await this.fixedExpenseService.getMonthlyPaymentStatus();
      this.upcomingExpenses = paymentStatus
        .filter(status => {
          // Se já existe uma transação associada no mês atual, não mostrar
          if (status.expense.current_month_release_id) {
            return false;
          }
          // Se já está marcado como pago no mês atual, não mostrar
          if (status.expense.current_month_payment_status === 'pago') {
            return false;
          }
          // Mostrar apenas os que vencem em até 7 dias
          return status.daysUntilDue <= 7;
        })
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      // Renderizar gráficos
      setTimeout(() => {
        this.renderBarChart();
        this.renderPieChart();
      }, 200);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  }

  private calculateExpensesByCategory(transactions: Transaction[]): CategorySummary[] {
    // Filtrar apenas despesas (saída)
    const expenses = transactions.filter(t => t.release_type === ReleaseTypes.EXPENSE);

    // Agrupar por categoria
    const grouped = new Map<string, { total: number; icon: string }>();

    expenses.forEach(t => {
      const categoryName = t.category_name || 'Sem categoria';
      const value = typeof t.value === 'string' ? parseFloat(t.value) : t.value;

      if (grouped.has(categoryName)) {
        const current = grouped.get(categoryName)!;
        current.total += value;
      } else {
        grouped.set(categoryName, {
          total: value,
          icon: t.category_icon || '📦',
        });
      }
    });

    // Calcular total geral
    const totalExpenses = Array.from(grouped.values()).reduce((sum, cat) => sum + cat.total, 0);

    // Converter para array e calcular percentuais
    const result: CategorySummary[] = [];
    let colorIndex = 0;

    grouped.forEach((data, categoryName) => {
      result.push({
        categoryName,
        categoryIcon: data.icon,
        total: data.total,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        color: this.categoryColors[colorIndex % this.categoryColors.length],
      });
      colorIndex++;
    });

    // Ordenar por valor (maior primeiro)
    return result.sort((a, b) => b.total - a.total);
  }

  renderBarChart() {
    if (!this.dashboardData || !this.barChartRef) return;

    const canvas = this.barChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (this.barChart) {
      this.barChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Receitas', 'Despesas'],
        datasets: [
          {
            data: [this.dashboardData.total_incomes, this.dashboardData.total_expenses],
            backgroundColor: ['#10b981', '#ef4444'],
            borderRadius: 8,
            barThickness: 60,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#475569',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                return `R$ ${context.parsed.y.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#334155',
            },
            ticks: {
              color: '#cbd5e1',
              font: {
                size: 12,
              },
              callback: (value) => `R$ ${value}`,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#f1f5f9',
              font: {
                size: 13,
                weight: 'bold',
              },
            },
          },
        },
      },
    };

    this.barChart = new Chart(ctx, config);
  }

  renderPieChart() {
    if (!this.expensesByCategory.length || !this.pieChartRef) return;

    const canvas = this.pieChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const data = this.expensesByCategory.slice(0, 8);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.map((c) => c.categoryName),
        datasets: [
          {
            data: data.map((c) => c.total),
            backgroundColor: data.map((c) => c.color),
            borderWidth: 3,
            borderColor: '#1e293b',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              color: '#f1f5f9',
              font: {
                size: 12,
              },
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#475569',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = data[context.dataIndex].percentage.toFixed(1);
                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    this.pieChart = new Chart(ctx, config);
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  getBalanceColor(): string {
    if (!this.dashboardData) return 'medium';
    return this.dashboardData.balance >= 0 ? 'success' : 'danger';
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatDate(date: string | Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  getTransactionIcon(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'arrow-up' : 'arrow-down';
  }

  getTransactionColor(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'success' : 'danger';
  }

  getTransactionClass(type: ReleaseTypes | string): string {
    return type === ReleaseTypes.INCOME ? 'income' : 'expense';
  }

  formatTransactionValue(value: string | number): number {
    return typeof value === 'string' ? parseFloat(value) : value;
  }

  goToTransactions(type: ReleaseTypes) {
    this.router.navigate(['/transactions'], {
      state: { openModalType: type },
    });
  }

  getDaysLabel(expense: {
    expense: Release;
    isPaid: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
  }): string {
    const days = expense.daysUntilDue;
    if (expense.expense?.current_month_payment_status === 'pago') return 'Pagamento realizado';
    if (days < 0) return `Atrasada (${Math.abs(days)}d)`;
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days}d`;
  }

  getExpenseColor(item: any): string {
    if (item?.expense?.current_month_payment_status === null) {
      if (item.isOverdue) return 'danger';
      if (item.daysUntilDue === 0) return 'warning';
      if (item.daysUntilDue <= 3) return 'warning';
    }
    if (item?.expense?.current_month_payment_status === 'pago') return 'success';
    return 'medium';
  }

  goToFixedExpenses() {
    this.router.navigate(['/fixed-expenses']);
  }
}
