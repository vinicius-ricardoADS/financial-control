import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  ToastController,
} from '@ionic/angular/standalone';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ReportService } from '../../../services/report.service';
import { TransactionService } from '../../../services/transaction.service';
import { ExportService } from '../../../services/export.service';
import {
  MonthlyComparisonResponse,
  YearEvolutionResponse,
  ComparativeResponse,
  ReportTransaction,
} from '../../../models/financial-summary.model';
import moment from 'moment';
import 'moment/locale/pt-br';
import { addIcons } from 'ionicons';
import {
  download,
  document,
  trendingUp,
  trendingDown,
  wallet,
  arrowUp,
  arrowDown,
  alertCircle,
  checkmarkCircle,
  documentText,
} from 'ionicons/icons';

Chart.register(...registerables);
moment.locale('pt-br');

interface CategoryTotal {
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
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
    IonButton,
    IonIcon,
    IonLabel,
    IonItem,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
  ],
})
export class ReportsPage implements OnInit, OnDestroy {
  @ViewChild('evolutionChart') evolutionChartRef!: ElementRef;

  // Dados dos endpoints
  monthlyComparison: MonthlyComparisonResponse | null = null;
  yearEvolution: YearEvolutionResponse | null = null;
  comparative: ComparativeResponse | null = null;

  // Estado
  isLoading = true;
  evolutionChart: Chart | null = null;

  // Métricas calculadas
  savingsRate = 0;
  expenseDifference = 0;
  incomeDifference = 0;
  topExpenseCategory: CategoryTotal | null = null;
  expensesByCategory: CategoryTotal[] = [];

  // Expor Math para o template
  Math = Math;

  constructor(
    private reportService: ReportService,
    private transactionService: TransactionService,
    private exportService: ExportService,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      download,
      document,
      documentText,
      trendingUp,
      trendingDown,
      wallet,
      arrowUp,
      arrowDown,
      alertCircle,
      checkmarkCircle,
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  ngOnDestroy() {
    if (this.evolutionChart) this.evolutionChart.destroy();
  }

  async loadData() {
    this.isLoading = true;

    try {
      const [monthly, evolution, comparative] = await Promise.all([
        this.reportService.getMonthlyComparisonFromAPI(),
        this.reportService.getYearEvolution(),
        this.reportService.getComparative(),
      ]);

      this.monthlyComparison = monthly;
      this.yearEvolution = evolution;
      this.comparative = comparative;

      this.calculateMetrics();

      setTimeout(() => {
        this.renderEvolutionChart();
      }, 200);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      this.isLoading = false;
    }
  }

  calculateMetrics() {
    if (!this.comparative) return;

    const current = this.comparative.current_month;
    const previous = this.comparative.previous_month;

    // Taxa de poupança do mês atual
    if (current.total_incomes > 0) {
      this.savingsRate = ((current.total_incomes - current.total_expenses) / current.total_incomes) * 100;
    }

    // Diferença de gastos em relação ao mês anterior
    this.expenseDifference = current.total_expenses - previous.total_expenses;
    this.incomeDifference = current.total_incomes - previous.total_incomes;

    // Calcular gastos por categoria
    this.calculateExpensesByCategory(current.expenses);
  }

  calculateExpensesByCategory(expenses: ReportTransaction[]) {
    const categoryMap = new Map<string, { icon: string; total: number }>();

    expenses.forEach(expense => {
      const key = expense.category_name;
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.total += expense.value;
      } else {
        categoryMap.set(key, { icon: expense.category_icon, total: expense.value });
      }
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);

    this.expensesByCategory = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        icon: data.icon,
        total: data.total,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    this.topExpenseCategory = this.expensesByCategory[0] || null;
  }

  renderEvolutionChart() {
    if (!this.evolutionChartRef || !this.yearEvolution) return;

    const canvas = this.evolutionChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.evolutionChart) this.evolutionChart.destroy();

    const months = this.yearEvolution.months;
    const labels = months.map(m => this.getMonthShortName(m.month));
    const incomes = months.map(m => m.total_incomes);
    const expenses = months.map(m => m.total_expenses);
    const balances = months.map(m => m.total_incomes - m.total_expenses);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomes,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
          },
          {
            label: 'Despesas',
            data: expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#ef4444',
          },
          {
            label: 'Saldo',
            data: balances,
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#3b82f6',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              padding: 16,
              usePointStyle: true,
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
              label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#334155' },
            ticks: {
              color: '#94a3b8',
              callback: (value) => this.formatCurrencyShort(value as number),
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' },
          },
        },
      },
    };

    this.evolutionChart = new Chart(ctx, config);
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  // Helpers de formatação
  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatCurrencyShort(value: number): string {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  }

  formatDifference(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${this.formatCurrency(value)}`;
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getMonthShortName(month: number): string {
    return moment().month(month - 1).format('MMM');
  }

  getMonthFullName(month: number): string {
    return moment().month(month - 1).format('MMMM');
  }

  getCurrentMonthName(): string {
    if (!this.comparative) return '';
    const m = this.comparative.current_month;
    return `${this.getMonthFullName(m.month)}/${m.year}`;
  }

  getPreviousMonthName(): string {
    if (!this.comparative) return '';
    const m = this.comparative.previous_month;
    return `${this.getMonthFullName(m.month)}/${m.year}`;
  }

  getBalance(month: { total_incomes: number; total_expenses: number }): number {
    return month.total_incomes - month.total_expenses;
  }

  getSavingsRateClass(): string {
    if (this.savingsRate >= 20) return 'excellent';
    if (this.savingsRate >= 10) return 'good';
    if (this.savingsRate >= 0) return 'warning';
    return 'danger';
  }

  getSavingsRateLabel(): string {
    if (this.savingsRate >= 20) return 'Excelente!';
    if (this.savingsRate >= 10) return 'Bom';
    if (this.savingsRate >= 0) return 'Atenção';
    return 'Negativo';
  }

  isExporting = false;

  async exportPDF() {
    if (!this.comparative || !this.yearEvolution) {
      const toast = await this.toastCtrl.create({
        message: 'Aguarde o carregamento dos dados',
        duration: 2000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    this.isExporting = true;

    // Toast de início
    const loadingToast = await this.toastCtrl.create({
      message: 'Gerando relatório PDF...',
      duration: 10000,
      color: 'primary',
      icon: 'document-text',
    });
    await loadingToast.present();

    try {
      await this.exportService.exportToPDF({
        comparative: this.comparative,
        yearEvolution: this.yearEvolution,
        expensesByCategory: this.expensesByCategory,
        savingsRate: this.savingsRate,
      });

      await loadingToast.dismiss();

      const successToast = await this.toastCtrl.create({
        message: 'Relatório PDF gerado com sucesso!',
        duration: 3000,
        color: 'success',
        icon: 'checkmark-circle',
      });
      await successToast.present();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);

      await loadingToast.dismiss();

      const errorToast = await this.toastCtrl.create({
        message: 'Erro ao gerar o relatório. Tente novamente.',
        duration: 3000,
        color: 'danger',
        icon: 'alert-circle',
      });
      await errorToast.present();
    } finally {
      this.isExporting = false;
    }
  }
}
