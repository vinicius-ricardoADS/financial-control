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
import { ReportService } from '../../../services/report.service';
import { TransactionService } from '../../../services/transaction.service';
import { FixedExpenseService } from '../../../services/fixed-expense.service';
import { FinancialSummary } from '../../../models/financial-summary.model';
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
import { Subscription } from 'rxjs';

Chart.register(...registerables);

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
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef;

  summary: FinancialSummary | null = null;
  recentTransactions: Transaction[] = [];
  upcomingExpenses: Array<{
    expense: Release;
    isPaid: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
  }> = [];
  currentMonth: string = '';
  currentYear: number = new Date().getFullYear();
  currentMonthNumber: number = new Date().getMonth() + 1;

  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  private transactionSubscription?: Subscription;

  constructor(
    private reportService: ReportService,
    private transactionService: TransactionService,
    private fixedExpenseService: FixedExpenseService,
    private router: Router,
  ) {
    addIcons({ trendingUp, trendingDown, wallet, arrowUp, arrowDown, cashOutline, cardOutline, notifications, checkmarkCircle, alertCircle });
  }

  async ngOnInit() {
    this.currentMonth = moment().format('MMMM YYYY');
    await this.loadData();

    // Observar mudanças nas transações
    this.transactionSubscription = this.transactionService.transactions$.subscribe(async () => {
      await this.loadData();
    });
  }

  async ionViewWillEnter() {
    // Recarregar dados sempre que voltar para a página
    await this.loadData();
  }

  ngOnDestroy() {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }
    // Destruir gráficos
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
  }

  async loadData() {
    try {
      // Carregar resumo do mês atual
      this.summary = await this.reportService.getMonthlyReport(
        this.currentMonthNumber,
        this.currentYear,
      );

      // Carregar transações recentes
      this.recentTransactions = await this.transactionService.getTransactionsByMonth(
        this.currentMonthNumber,
        this.currentYear,
      );
      this.recentTransactions = this.recentTransactions.slice(0, 5);

      // Carregar próximas despesas (próximos 7 dias)
      const paymentStatus = await this.fixedExpenseService.getMonthlyPaymentStatus();
      this.upcomingExpenses = paymentStatus
        .filter(status => !status.isPaid && status.daysUntilDue <= 7)
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

  renderBarChart() {
    if (!this.summary || !this.barChartRef) return;

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
            data: [this.summary.totalIncome, this.summary.totalExpense],
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
    if (!this.summary || !this.pieChartRef) return;

    const canvas = this.pieChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Destruir gráfico anterior se existir
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const data = this.summary.expensesByCategory.slice(0, 8);

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
    if (!this.summary) return 'medium';
    return this.summary.balance >= 0 ? 'success' : 'danger';
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatDate(date: string | Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  getTransactionIcon(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'arrow-up' : 'arrow-down';
  }

  getTransactionColor(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'success' : 'danger';
  }

  getTransactionClass(type: ReleaseTypes): string {
    return type === ReleaseTypes.INCOME ? 'income' : 'expense';
  }

  goToTransactions(type: ReleaseTypes) {
    this.router.navigate(['/transactions'], {
      state: { openModalType: type },
    });
  }

  // Expor ReleaseTypes para o template
  ReleaseTypes = ReleaseTypes;

  getDaysLabel(days: number): string {
    if (days < 0) return `Atrasada (${Math.abs(days)}d)`;
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days}d`;
  }

  getExpenseColor(item: any): string {
    if (item.isOverdue) return 'danger';
    if (item.daysUntilDue === 0) return 'warning';
    if (item.daysUntilDue <= 3) return 'warning';
    return 'medium';
  }

  goToFixedExpenses() {
    this.router.navigate(['/fixed-expenses']);
  }
}
