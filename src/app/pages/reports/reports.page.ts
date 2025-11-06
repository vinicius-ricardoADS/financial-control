import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  ToastController,
} from '@ionic/angular/standalone';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ReportService } from '../../../services/report.service';
import { TransactionService } from '../../../services/transaction.service';
import { ExportService } from '../../../services/export.service';
import { FinancialSummary, MonthlyComparison } from '../../../models/financial-summary.model';
import moment from 'moment';
import { addIcons } from 'ionicons';
import { download, image, document } from 'ionicons/icons';

Chart.register(...registerables);

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
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonItem,
  ],
})
export class ReportsPage implements OnInit, OnDestroy {
  @ViewChild('lineChart') lineChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChartReport') pieChartReportRef!: ElementRef;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  selectedYear = this.currentYear;

  yearlyData: FinancialSummary[] = [];
  monthlyComparison: MonthlyComparison | null = null;

  lineChart: Chart | null = null;
  barChart: Chart | null = null;
  pieChart: Chart | null = null;

  private transactionSubscription?: Subscription;

  constructor(
    private reportService: ReportService,
    private transactionService: TransactionService,
    private exportService: ExportService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ download, image, document });
  }

  async ngOnInit() {
    await this.loadData();

    // Observar mudanças nas transações
    this.transactionSubscription = this.transactionService.transactions$.subscribe(async () => {
      console.log('Reports: Transações mudaram, recarregando...');
      await this.loadData();
    });
  }

  async ionViewWillEnter() {
    console.log('Reports: Entrando na view, recarregando dados...');
    await this.loadData();
  }

  ngOnDestroy() {
    if (this.transactionSubscription) {
      this.transactionSubscription.unsubscribe();
    }
    // Destruir gráficos
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
  }

  async loadData() {
    try {
      console.log('Reports: Carregando dados...');

      this.yearlyData = await this.reportService.getYearlyReport(this.selectedYear);
      this.monthlyComparison = await this.reportService.getMonthlyComparison(
        this.currentMonth,
        this.currentYear,
      );

      console.log('Reports: Monthly comparison carregado', this.monthlyComparison);

      setTimeout(() => {
        this.renderLineChart();
        this.renderBarChart();
        this.renderPieChart();
      }, 200);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  }

  renderLineChart() {
    if (!this.lineChartRef) return;

    const canvas = this.lineChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.lineChart) this.lineChart.destroy();

    const months = this.yearlyData.map((d) => moment().month(d.period.month - 1).format('MMM'));
    const income = this.yearlyData.map((d) => d.totalIncome);
    const expenses = this.yearlyData.map((d) => d.totalExpense);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Receitas',
            data: income,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Despesas',
            data: expenses,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    };

    this.lineChart = new Chart(ctx, config);
  }

  renderBarChart() {
    if (!this.barChartRef || !this.monthlyComparison) return;

    const canvas = this.barChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.barChart) this.barChart.destroy();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Mês Anterior', 'Mês Atual'],
        datasets: [
          {
            label: 'Receitas',
            data: [
              this.monthlyComparison.previousMonth.totalIncome,
              this.monthlyComparison.currentMonth.totalIncome,
            ],
            backgroundColor: '#2ecc71',
          },
          {
            label: 'Despesas',
            data: [
              this.monthlyComparison.previousMonth.totalExpense,
              this.monthlyComparison.currentMonth.totalExpense,
            ],
            backgroundColor: '#e74c3c',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    };

    this.barChart = new Chart(ctx, config);
  }

  renderPieChart() {
    if (!this.pieChartReportRef || !this.monthlyComparison) return;

    const canvas = this.pieChartReportRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.pieChart) this.pieChart.destroy();

    const data = this.monthlyComparison.currentMonth.expensesByCategory.slice(0, 8);

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: data.map((c) => c.categoryName),
        datasets: [
          {
            data: data.map((c) => c.total),
            backgroundColor: data.map((c) => c.color),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
        },
      },
    };

    this.pieChart = new Chart(ctx, config);
  }

  async exportPDF() {
    try {
      if (!this.monthlyComparison) return;

      const transactions = await this.transactionService.getTransactionsByMonth(
        this.currentMonth,
        this.currentYear,
      );

      await this.exportService.exportToPDF(
        this.monthlyComparison.currentMonth,
        transactions,
      );

      const toast = await this.toastCtrl.create({
        message: 'PDF exportado com sucesso!',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao exportar PDF',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
