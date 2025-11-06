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
import { FinancialSummary } from '../../../models/financial-summary.model';
import { Transaction } from '../../../models/transaction.model';
import moment from 'moment';
import { addIcons } from 'ionicons';
import {
  trendingUp,
  trendingDown,
  wallet,
  arrowUp,
  arrowDown,
  cashOutline,
  cardOutline,
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
  currentMonth: string = '';
  currentYear: number = new Date().getFullYear();
  currentMonthNumber: number = new Date().getMonth() + 1;

  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  private transactionSubscription?: Subscription;

  constructor(
    private reportService: ReportService,
    private transactionService: TransactionService,
    private router: Router,
  ) {
    addIcons({ trendingUp, trendingDown, wallet, arrowUp, arrowDown, cashOutline, cardOutline });
  }

  async ngOnInit() {
    this.currentMonth = moment().format('MMMM YYYY');
    await this.loadData();

    // Observar mudanças nas transações
    this.transactionSubscription = this.transactionService.transactions$.subscribe(async () => {
      console.log('Dashboard: Transações mudaram, recarregando...');
      await this.loadData();
    });
  }

  async ionViewWillEnter() {
    // Recarregar dados sempre que voltar para a página
    console.log('Dashboard: Entrando na view, recarregando dados...');
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
      console.log('Dashboard: Carregando dados...');

      // Carregar resumo do mês atual
      this.summary = await this.reportService.getMonthlyReport(
        this.currentMonthNumber,
        this.currentYear,
      );

      console.log('Dashboard: Summary carregado', this.summary);

      // Carregar transações recentes
      this.recentTransactions = await this.transactionService.getTransactionsByMonth(
        this.currentMonthNumber,
        this.currentYear,
      );
      this.recentTransactions = this.recentTransactions.slice(0, 5);

      console.log('Dashboard: Transações recentes', this.recentTransactions.length);

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
            ticks: {
              callback: (value) => `R$ ${value}`,
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
            borderWidth: 2,
            borderColor: '#ffffff',
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
              padding: 10,
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
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

  getTransactionIcon(type: string): string {
    return type === 'income' ? 'arrow-up' : 'arrow-down';
  }

  getTransactionColor(type: string): string {
    return type === 'income' ? 'success' : 'danger';
  }

  goToTransactions(type: 'income' | 'expense') {
    this.router.navigate(['/transactions'], {
      state: { openModalType: type },
    });
  }
}
