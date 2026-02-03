import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ComparativeResponse,
  YearEvolutionResponse,
  ReportTransaction,
} from '../models/financial-summary.model';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import moment from 'moment';
import 'moment/locale/pt-br';

moment.locale('pt-br');

interface CategoryTotal {
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

interface PDFExportData {
  comparative: ComparativeResponse;
  yearEvolution: YearEvolutionResponse;
  expensesByCategory: CategoryTotal[];
  savingsRate: number;
}

// Cores do tema
const COLORS = {
  primary: [59, 130, 246] as [number, number, number],       // Azul
  success: [16, 185, 129] as [number, number, number],       // Verde
  danger: [239, 68, 68] as [number, number, number],         // Vermelho
  warning: [245, 158, 11] as [number, number, number],       // Amarelo
  dark: [30, 41, 59] as [number, number, number],            // Cinza escuro
  gray: [100, 116, 139] as [number, number, number],         // Cinza
  lightGray: [226, 232, 240] as [number, number, number],    // Cinza claro
  white: [255, 255, 255] as [number, number, number],
};

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private doc!: jsPDF;
  private pageWidth!: number;
  private pageHeight!: number;
  private margin = 15;
  private yPosition = 0;

  constructor() {}

  /**
   * Remove acentos e caracteres especiais para evitar problemas de encoding no PDF
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\x00-\x7F]/g, '');   // Remove outros caracteres especiais
  }

  /**
   * Capitaliza a primeira letra
   */
  private capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  async exportToPDF(data: PDFExportData): Promise<void> {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.yPosition = 0;

    // Construir o PDF
    this.renderHeader(data);
    this.renderExecutiveSummary(data);
    this.renderMonthlyComparison(data);
    this.renderCategoryBreakdown(data);
    this.renderYearEvolution(data);
    this.renderTransactionsList(data);
    this.renderFinancialTips(data);
    this.renderFooter();

    // Salvar
    const fileName = `relatorio_financeiro_${moment().format('YYYY-MM-DD')}.pdf`;
    await this.savePDF(this.doc, fileName);
  }

  private renderHeader(data: PDFExportData) {
    const current = data.comparative.current_month;
    const monthName = moment().month(current.month - 1).format('MMMM');

    // Fundo do cabeçalho (maior para acomodar textos maiores)
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 52, 'F');

    // Título principal
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(26);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Relatorio Financeiro', this.margin, 22);

    // Subtítulo com período (tamanho maior)
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `${this.capitalize(this.normalizeText(monthName))} de ${current.year}`,
      this.margin,
      36
    );

    // Data de geração (tamanho maior)
    this.doc.setFontSize(11);
    this.doc.text(
      `Gerado em ${moment().format('DD/MM/YYYY [as] HH:mm')}`,
      this.pageWidth - this.margin,
      36,
      { align: 'right' }
    );

    this.yPosition = 62;
  }

  private renderExecutiveSummary(data: PDFExportData) {
    const current = data.comparative.current_month;
    const balance = current.total_incomes - current.total_expenses;

    // Título da seção
    this.renderSectionTitle('Resumo Executivo');

    // Cards de resumo
    const cardWidth = (this.pageWidth - this.margin * 2 - 10) / 3;
    const cardHeight = 35;
    const startX = this.margin;

    // Card Receitas
    this.renderSummaryCard(
      startX,
      this.yPosition,
      cardWidth,
      cardHeight,
      'Receitas',
      current.total_incomes,
      COLORS.success
    );

    // Card Despesas
    this.renderSummaryCard(
      startX + cardWidth + 5,
      this.yPosition,
      cardWidth,
      cardHeight,
      'Despesas',
      current.total_expenses,
      COLORS.danger
    );

    // Card Saldo
    this.renderSummaryCard(
      startX + (cardWidth + 5) * 2,
      this.yPosition,
      cardWidth,
      cardHeight,
      'Saldo',
      balance,
      balance >= 0 ? COLORS.success : COLORS.danger
    );

    this.yPosition += cardHeight + 10;

    // Linha de métricas adicionais
    const metricsY = this.yPosition;

    // Taxa de poupança
    this.doc.setFillColor(...COLORS.lightGray);
    this.doc.roundedRect(this.margin, metricsY, (this.pageWidth - this.margin * 2) / 2 - 3, 20, 3, 3, 'F');

    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Taxa de Poupança', this.margin + 5, metricsY + 8);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    const savingsColor = data.savingsRate >= 0 ? COLORS.success : COLORS.danger;
    this.doc.setTextColor(...savingsColor);
    this.doc.text(`${data.savingsRate.toFixed(1)}%`, this.margin + 5, metricsY + 16);

    // Total de transações
    const totalTransactions = current.incomes.length + current.expenses.length;
    const rightCardX = this.margin + (this.pageWidth - this.margin * 2) / 2 + 3;

    this.doc.setFillColor(...COLORS.lightGray);
    this.doc.roundedRect(rightCardX, metricsY, (this.pageWidth - this.margin * 2) / 2 - 3, 20, 3, 3, 'F');

    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Transações no Mês', rightCardX + 5, metricsY + 8);

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text(`${totalTransactions}`, rightCardX + 5, metricsY + 16);

    this.yPosition = metricsY + 30;
  }

  private renderSummaryCard(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: number,
    color: [number, number, number]
  ) {
    // Fundo do card
    this.doc.setFillColor(color[0], color[1], color[2], 0.1);
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    // Barra lateral colorida
    this.doc.setFillColor(...color);
    this.doc.rect(x, y, 4, height, 'F');

    // Label
    this.doc.setTextColor(...COLORS.gray);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(label, x + 10, y + 12);

    // Valor
    this.doc.setTextColor(...color);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(value), x + 10, y + 26);
  }

  private renderMonthlyComparison(data: PDFExportData) {
    this.checkPageBreak(70);
    this.renderSectionTitle('Comparativo Mensal');

    const current = data.comparative.current_month;
    const previous = data.comparative.previous_month;

    const currentMonthName = moment().month(current.month - 1).format('MMM/YYYY');
    const previousMonthName = moment().month(previous.month - 1).format('MMM/YYYY');

    // Tabela de comparação
    autoTable(this.doc, {
      startY: this.yPosition,
      head: [[
        '',
        this.normalizeText(previousMonthName.toUpperCase()),
        this.normalizeText(currentMonthName.toUpperCase()),
        'VARIACAO'
      ]],
      body: [
        [
          'Receitas',
          this.formatCurrency(previous.total_incomes),
          this.formatCurrency(current.total_incomes),
          this.formatVariation(current.total_incomes - previous.total_incomes)
        ],
        [
          'Despesas',
          this.formatCurrency(previous.total_expenses),
          this.formatCurrency(current.total_expenses),
          this.formatVariation(current.total_expenses - previous.total_expenses, true)
        ],
        [
          'Saldo',
          this.formatCurrency(previous.total_incomes - previous.total_expenses),
          this.formatCurrency(current.total_incomes - current.total_expenses),
          this.formatVariation((current.total_incomes - current.total_expenses) - (previous.total_incomes - previous.total_expenses))
        ],
      ],
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private renderCategoryBreakdown(data: PDFExportData) {
    if (data.expensesByCategory.length === 0) return;

    this.checkPageBreak(80);
    this.renderSectionTitle('Despesas por Categoria');

    const categories = data.expensesByCategory.slice(0, 8);
    const maxPercentage = Math.max(...categories.map(c => c.percentage));
    const barMaxWidth = 80;

    categories.forEach((category, index) => {
      const rowY = this.yPosition + (index * 12);

      // Nome da categoria (sem emoji para evitar problemas de encoding)
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.normalizeText(category.name), this.margin, rowY + 4);

      // Barra de progresso
      const barWidth = (category.percentage / maxPercentage) * barMaxWidth;
      const barX = 70;

      // Fundo da barra
      this.doc.setFillColor(...COLORS.lightGray);
      this.doc.roundedRect(barX, rowY, barMaxWidth, 6, 2, 2, 'F');

      // Barra preenchida
      const barColor = this.getCategoryColor(index);
      this.doc.setFillColor(...barColor);
      this.doc.roundedRect(barX, rowY, barWidth, 6, 2, 2, 'F');

      // Valor e percentual
      this.doc.setTextColor(...COLORS.gray);
      this.doc.setFontSize(8);
      this.doc.text(
        `${this.formatCurrency(category.total)} (${category.percentage.toFixed(1)}%)`,
        barX + barMaxWidth + 5,
        rowY + 5
      );
    });

    this.yPosition += categories.length * 12 + 10;
  }

  private renderYearEvolution(data: PDFExportData) {
    if (!data.yearEvolution) return;

    this.checkPageBreak(70);
    this.renderSectionTitle(`Evolucao Anual - ${data.yearEvolution.year}`);

    const months = data.yearEvolution.months;

    // Tabela de evolução
    const tableData = months.map(m => [
      moment().month(m.month - 1).format('MMM').toUpperCase(),
      this.formatCurrency(m.total_incomes),
      this.formatCurrency(m.total_expenses),
      this.formatCurrency(m.total_incomes - m.total_expenses),
    ]);

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['MES', 'RECEITAS', 'DESPESAS', 'SALDO']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.dark,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        1: { textColor: COLORS.success },
        2: { textColor: COLORS.danger },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: this.margin, right: this.margin },
      styles: {
        cellPadding: 3,
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;

    // Totais do ano
    const totalIncomes = months.reduce((sum, m) => sum + m.total_incomes, 0);
    const totalExpenses = months.reduce((sum, m) => sum + m.total_expenses, 0);
    const avgMonthlyIncome = totalIncomes / months.length;
    const avgMonthlyExpense = totalExpenses / months.length;

    this.doc.setFillColor(...COLORS.lightGray);
    this.doc.roundedRect(this.margin, this.yPosition, this.pageWidth - this.margin * 2, 25, 3, 3, 'F');

    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESUMO DO ANO', this.margin + 5, this.yPosition + 7);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(`Media Mensal de Receitas: ${this.formatCurrency(avgMonthlyIncome)}`, this.margin + 5, this.yPosition + 15);
    this.doc.text(`Media Mensal de Despesas: ${this.formatCurrency(avgMonthlyExpense)}`, this.margin + 5, this.yPosition + 22);

    this.doc.text(`Total de Receitas: ${this.formatCurrency(totalIncomes)}`, this.pageWidth / 2, this.yPosition + 15);
    this.doc.text(`Total de Despesas: ${this.formatCurrency(totalExpenses)}`, this.pageWidth / 2, this.yPosition + 22);

    this.yPosition += 35;
  }

  private renderTransactionsList(data: PDFExportData) {
    this.checkPageBreak(60);
    this.renderSectionTitle('Transacoes do Mes Atual');

    const current = data.comparative.current_month;
    const allTransactions = [...current.incomes, ...current.expenses]
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
      .slice(0, 15);

    if (allTransactions.length === 0) {
      this.doc.setTextColor(...COLORS.gray);
      this.doc.setFontSize(10);
      this.doc.text('Nenhuma transacao registrada no periodo.', this.margin, this.yPosition + 5);
      this.yPosition += 15;
      return;
    }

    const tableData = allTransactions.map(t => {
      const isIncome = current.incomes.includes(t);
      const desc = this.normalizeText(t.description);
      const catName = this.normalizeText(t.category_name);
      return [
        moment(t.date).format('DD/MM'),
        desc.length > 25 ? desc.substring(0, 25) + '...' : desc,
        catName,
        isIncome ? 'Receita' : 'Despesa',
        (isIncome ? '+' : '-') + this.formatCurrency(t.value),
      ];
    });

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['DATA', 'DESCRICAO', 'CATEGORIA', 'TIPO', 'VALOR']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.dark,
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: this.margin, right: this.margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const value = data.cell.text[0];
          if (value.startsWith('+')) {
            data.cell.styles.textColor = COLORS.success;
          } else {
            data.cell.styles.textColor = COLORS.danger;
          }
        }
        if (data.section === 'body' && data.column.index === 3) {
          const tipo = data.cell.text[0];
          if (tipo === 'Receita') {
            data.cell.styles.textColor = COLORS.success;
          } else {
            data.cell.styles.textColor = COLORS.danger;
          }
        }
      },
    });

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private renderFinancialTips(data: PDFExportData) {
    this.checkPageBreak(50);
    this.renderSectionTitle('Analise e Recomendacoes');

    const tips = this.generateTips(data);

    this.doc.setFillColor(248, 250, 252);
    this.doc.roundedRect(
      this.margin,
      this.yPosition,
      this.pageWidth - this.margin * 2,
      tips.length * 12 + 10,
      3,
      3,
      'F'
    );

    tips.forEach((tip, index) => {
      const tipY = this.yPosition + 8 + index * 12;

      this.doc.setTextColor(...COLORS.primary);
      this.doc.setFontSize(10);
      this.doc.text('-', this.margin + 5, tipY);

      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFontSize(9);
      this.doc.text(this.normalizeText(tip), this.margin + 12, tipY);
    });

    this.yPosition += tips.length * 12 + 20;
  }

  private generateTips(data: PDFExportData): string[] {
    const tips: string[] = [];
    const current = data.comparative.current_month;
    const previous = data.comparative.previous_month;

    // Analise da taxa de poupanca
    if (data.savingsRate >= 20) {
      tips.push('Parabens! Voce esta economizando mais de 20% da sua renda.');
    } else if (data.savingsRate >= 10) {
      tips.push('Boa taxa de poupanca! Tente aumentar para 20% se possivel.');
    } else if (data.savingsRate >= 0) {
      tips.push('Atencao: sua taxa de poupanca esta baixa. Revise seus gastos.');
    } else {
      tips.push('Alerta: voce esta gastando mais do que ganha. Revise urgentemente seus gastos.');
    }

    // Analise de despesas vs mes anterior
    const expenseDiff = current.total_expenses - previous.total_expenses;
    if (expenseDiff > 0) {
      const percentChange = (expenseDiff / previous.total_expenses) * 100;
      tips.push(`Suas despesas aumentaram ${percentChange.toFixed(1)}% em relacao ao mes anterior.`);
    } else if (expenseDiff < 0) {
      tips.push('Bom trabalho! Voce reduziu suas despesas em relacao ao mes anterior.');
    }

    // Categoria com maior gasto
    if (data.expensesByCategory.length > 0) {
      const top = data.expensesByCategory[0];
      const catName = this.normalizeText(top.name);
      tips.push(`Sua maior despesa e com "${catName}" (${top.percentage.toFixed(1)}% do total).`);
    }

    // Dica geral
    if (tips.length < 4) {
      tips.push('Mantenha um registro diario de suas despesas para melhor controle.');
    }

    return tips;
  }

  private renderSectionTitle(title: string) {
    this.doc.setTextColor(...COLORS.dark);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.normalizeText(title), this.margin, this.yPosition);

    // Linha abaixo do titulo
    this.doc.setDrawColor(...COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition + 2, this.margin + 50, this.yPosition + 2);

    this.yPosition += 12;
  }

  private renderFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Linha separadora
      this.doc.setDrawColor(...COLORS.lightGray);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

      // Texto do rodape
      this.doc.setTextColor(...COLORS.gray);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');

      this.doc.text(
        'Relatorio gerado automaticamente pelo app Financial Control',
        this.margin,
        this.pageHeight - 8
      );

      this.doc.text(
        `Pagina ${i} de ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 8,
        { align: 'right' }
      );
    }
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPosition + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  private formatVariation(value: number, invertColors: boolean = false): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${this.formatCurrency(value)}`;
  }

  private getCategoryColor(index: number): [number, number, number] {
    const colors: [number, number, number][] = [
      [239, 68, 68],    // Vermelho
      [249, 115, 22],   // Laranja
      [245, 158, 11],   // Amarelo
      [132, 204, 22],   // Lima
      [34, 197, 94],    // Verde
      [20, 184, 166],   // Teal
      [59, 130, 246],   // Azul
      [139, 92, 246],   // Roxo
    ];
    return colors[index % colors.length];
  }

  private async savePDF(doc: jsPDF, fileName: string): Promise<void> {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      try {
        const pdfBlob = doc.output('blob');

        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        console.log('PDF salvo em:', savedFile.uri);

        try {
          await FileOpener.open({
            filePath: savedFile.uri,
            contentType: 'application/pdf',
            openWithDefault: true,
          });
        } catch (openError) {
          console.log('Erro ao abrir PDF, tentando compartilhar...', openError);
          await Share.share({
            title: 'Relatório Financeiro',
            text: 'Seu relatório financeiro está pronto',
            url: savedFile.uri,
            dialogTitle: 'Compartilhar relatório',
          });
        }
      } catch (error) {
        console.error('Erro ao salvar PDF no dispositivo:', error);
        doc.save(fileName);
      }
    } else {
      doc.save(fileName);
    }
  }
}
