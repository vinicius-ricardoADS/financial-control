import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { FinancialSummary } from '../models/financial-summary.model';
import { Transaction } from '../models/transaction.model';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor() {}

  async exportToPDF(
    summary: FinancialSummary,
    transactions: Transaction[],
  ): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    const monthName = moment()
      .month(summary.period.month - 1)
      .format('MMMM/YYYY');
    doc.text(monthName.toUpperCase(), pageWidth / 2, 30, { align: 'center' });

    // Resumo
    let yPosition = 45;
    doc.setFontSize(14);
    doc.text('Resumo do Período', 14, yPosition);

    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(34, 139, 34); // Verde
    doc.text(`Receitas: R$ ${summary.totalIncome.toFixed(2)}`, 14, yPosition);

    yPosition += 7;
    doc.setTextColor(220, 20, 60); // Vermelho
    doc.text(`Despesas: R$ ${summary.totalExpense.toFixed(2)}`, 14, yPosition);

    yPosition += 7;
    doc.setTextColor(0, 0, 0); // Preto
    const balanceColor: [number, number, number] = summary.balance >= 0 ? [34, 139, 34] : [220, 20, 60];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(`Saldo: R$ ${summary.balance.toFixed(2)}`, 14, yPosition);

    yPosition += 7;
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Total de transações: ${summary.transactionCount}`,
      14,
      yPosition,
    );

    // Despesas por categoria
    yPosition += 15;
    doc.setFontSize(14);
    doc.text('Despesas por Categoria', 14, yPosition);

    yPosition += 5;

    const categoryData = summary.expensesByCategory.map((cat) => [
      cat.categoryName,
      `R$ ${cat.total.toFixed(2)}`,
      `${cat.percentage.toFixed(1)}%`,
      cat.transactionCount.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Categoria', 'Total', '%', 'Qtd']],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9 },
    });

    // Transações recentes
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Verifica se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Últimas Transações', 14, yPosition);

    yPosition += 5;

    const transactionData = transactions.slice(0, 20).map((t) => [
      moment(t.date).format('DD/MM/YYYY'),
      t.description,
      t.category?.name || '-',
      t.type === 'income' ? 'Receita' : 'Despesa',
      `R$ ${t.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 },
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Gerado em ${moment().format('DD/MM/YYYY HH:mm')}`,
        14,
        doc.internal.pageSize.getHeight() - 10,
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 30,
        doc.internal.pageSize.getHeight() - 10,
      );
    }

    // Salvar
    await this.savePDF(doc, `relatorio_${monthName}.pdf`);
  }

  async exportChartToImage(chartElement: HTMLElement): Promise<void> {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imageData = canvas.toDataURL('image/png');
      const fileName = `grafico_${moment().format('YYYY-MM-DD_HHmmss')}.png`;

      // Salvar imagem
      await this.saveImage(imageData, fileName);
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      throw error;
    }
  }

  async exportTransactionsToCSV(transactions: Transaction[]): Promise<void> {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Notas'];
    const rows = transactions.map((t) => [
      moment(t.date).format('DD/MM/YYYY'),
      t.description,
      t.category?.name || '',
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2),
      t.notes || '',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    const fileName = `transacoes_${moment().format('YYYY-MM-DD')}.csv`;
    await this.saveCSV(csvContent, fileName);
  }

  private async savePDF(doc: jsPDF, fileName: string): Promise<void> {
    try {
      const pdfOutput = doc.output('datauristring');
      const base64Data = pdfOutput.split(',')[1];

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });

      // Compartilhar
      await Share.share({
        title: 'Relatório Financeiro',
        text: 'Seu relatório financeiro está pronto',
        url: result.uri,
        dialogTitle: 'Compartilhar relatório',
      });
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      // Fallback para download direto no navegador
      doc.save(fileName);
    }
  }

  private async saveImage(base64Data: string, fileName: string): Promise<void> {
    try {
      const data = base64Data.split(',')[1];

      const result = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
      });

      await Share.share({
        title: 'Gráfico Financeiro',
        url: result.uri,
        dialogTitle: 'Compartilhar gráfico',
      });
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      // Fallback para download
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      link.click();
    }
  }

  private async saveCSV(content: string, fileName: string): Promise<void> {
    try {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const base64Data = await this.blobToBase64(blob);

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data.split(',')[1],
        directory: Directory.Documents,
      });

      await Share.share({
        title: 'Exportar Transações',
        url: result.uri,
        dialogTitle: 'Compartilhar CSV',
      });
    } catch (error) {
      console.error('Erro ao salvar CSV:', error);
      // Fallback
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
      link.download = fileName;
      link.click();
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
