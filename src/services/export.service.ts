import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialSummary } from '../models/financial-summary.model';
import { Transaction } from '../models/transaction.model';
import { ReleaseTypes } from '../models/fixed-expense.model';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
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
      t.category?.category || '-',
      t.release_type === ReleaseTypes.INCOME ? 'Receita' : 'Despesa',
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

    // Salvar - Nome simplificado sem caracteres especiais
    const simplifiedName = `relatorio_${moment().format('YYYY-MM-DD')}.pdf`;
    await this.savePDF(doc, simplifiedName);
  }

  private async savePDF(doc: jsPDF, fileName: string): Promise<void> {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Dispositivo móvel nativo (Android/iOS)
      try {
        // Gerar PDF como blob
        const pdfBlob = doc.output('blob');

        // Converter blob para base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });

        // Salvar no diretório de cache (sempre disponível)
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        console.log('📄 PDF salvo em:', savedFile.uri);

        // Converter URI para caminho real para o FileOpener
        const filePath = Capacitor.convertFileSrc(savedFile.uri);

        console.log('📂 Caminho convertido:', filePath);

        // Abrir com FileOpener (mais confiável que Share)
        try {
          await FileOpener.open({
            filePath: savedFile.uri,
            contentType: 'application/pdf',
            openWithDefault: true,
          });
          console.log('✅ PDF aberto com sucesso');
        } catch (openError) {
          console.log('⚠️ Erro ao abrir PDF, tentando compartilhar...', openError);
          // Fallback: tentar compartilhar se não conseguir abrir
          await Share.share({
            title: 'Relatório Financeiro',
            text: 'Seu relatório financeiro está pronto',
            url: savedFile.uri,
            dialogTitle: 'Compartilhar relatório',
          });
        }
      } catch (error) {
        console.error('❌ Erro ao salvar PDF no dispositivo:', error);
        // Fallback: tentar salvar no navegador
        doc.save(fileName);
      }
    } else {
      // Navegador web
      doc.save(fileName);
    }
  }
}
