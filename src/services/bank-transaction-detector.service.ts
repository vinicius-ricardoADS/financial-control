import { Injectable, Injector } from '@angular/core';
import { ExternalNotification } from './external-notification.service';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { TransactionCreate } from '../models/transaction.model';

/**
 * Informações de uma transação bancária detectada
 */
export interface DetectedTransaction {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  source: string; // Ex: "Nubank", "Inter", "Banco do Brasil"
  transactionType: string; // Ex: "Pix Enviado", "Pix Recebido", "Compra"
  date: Date;
  rawNotification: ExternalNotification;
}

@Injectable({
  providedIn: 'root',
})
export class BankTransactionDetectorService {
  // Padrões de detecção para Nubank
  private nubankPatterns = {
    pixEnviado: /pix\s+enviado.*?r\$\s*([\d.,]+)/gi,
    pixRecebido: /pix\s+recebido.*?r\$\s*([\d.,]+)/gi,
    compraAprovada: /compra\s+aprovada.*?r\$\s*([\d.,]+)/gi,
    compraDebito: /compra\s+no\s+d.bito.*?r\$\s*([\d.,]+)/gi,
    transferenciaEnviada: /transfer.ncia\s+enviada.*?r\$\s*([\d.,]+)/gi,
    transferenciaRecebida: /transfer.ncia\s+recebida.*?r\$\s*([\d.,]+)/gi,
  };

  // Apps bancários suportados
  private supportedBankApps = [
    'com.nu.production', // Nubank
    'nubank',
    'inter',
    'bradesco',
    'itau',
    'santander',
    'caixa',
    'bb', // Banco do Brasil
  ];

  // Injeção lazy para evitar dependência circular
  private _transactionService?: TransactionService;
  private _notificationService?: any;

  constructor(
    private categoryService: CategoryService,
    private injector: Injector
  ) {
    console.log('🏦 BankTransactionDetectorService inicializado');
  }

  /**
   * Lazy load TransactionService para evitar dependência circular
   */
  private get transactionService(): TransactionService {
    if (!this._transactionService) {
      this._transactionService = this.injector.get(TransactionService);
    }
    return this._transactionService;
  }

  /**
   * Lazy load NotificationService para evitar dependência circular
   */
  private getNotificationService(): any {
    if (!this._notificationService) {
      // Importação lazy para evitar dependência circular
      const NotificationService = require('./notification.service').NotificationService;
      this._notificationService = this.injector.get(NotificationService);
    }
    return this._notificationService;
  }

  /**
   * Processa uma notificação externa e detecta se é uma transação bancária
   */
  async processNotification(notification: ExternalNotification): Promise<void> {
    console.log('🔍 Processando notificação:', {
      app: notification.appName,
      title: notification.title,
      text: notification.text,
    });

    // Verificar se é de um app bancário
    if (!this.isBankApp(notification.packageName)) {
      console.log('❌ Não é app bancário:', notification.packageName);
      return;
    }

    console.log('✅ App bancário detectado:', notification.appName);

    // Detectar transação
    const detectedTransaction = this.detectTransaction(notification);

    if (detectedTransaction) {
      console.log('💰 Transação detectada:', detectedTransaction);
      await this.addDetectedTransaction(detectedTransaction);
    } else {
      console.log('⚠️ Notificação bancária, mas não é uma transação reconhecida');
    }
  }

  /**
   * Verifica se o package name é de um app bancário
   */
  private isBankApp(packageName: string): boolean {
    return this.supportedBankApps.some((bank) =>
      packageName.toLowerCase().includes(bank.toLowerCase())
    );
  }

  /**
   * Detecta informações da transação na notificação
   */
  private detectTransaction(
    notification: ExternalNotification
  ): DetectedTransaction | null {
    const fullText = `${notification.title || ''} ${notification.text || ''} ${notification.bigText || ''}`.toLowerCase();

    console.log('🔎 Analisando texto:', fullText);

    // Nubank - Pix Recebido
    if (this.matchPattern(fullText, this.nubankPatterns.pixRecebido)) {
      const amount = this.extractAmount(fullText);
      const sender = this.extractSenderFromPix(notification.text || '');

      if (amount) {
        return {
          type: 'income',
          amount,
          description: sender ? `Pix recebido de ${sender}` : 'Pix recebido',
          source: notification.appName,
          transactionType: 'Pix Recebido',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    // Nubank - Pix Enviado
    if (this.matchPattern(fullText, this.nubankPatterns.pixEnviado)) {
      const amount = this.extractAmount(fullText);
      const recipient = this.extractRecipientFromPix(notification.text || '');

      if (amount) {
        return {
          type: 'expense',
          amount,
          description: recipient ? `Pix para ${recipient}` : 'Pix enviado',
          source: notification.appName,
          transactionType: 'Pix Enviado',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    // Nubank - Transferência Recebida
    if (this.matchPattern(fullText, this.nubankPatterns.transferenciaRecebida)) {
      const amount = this.extractAmount(fullText);

      if (amount) {
        return {
          type: 'income',
          amount,
          description: 'Transferência recebida',
          source: notification.appName,
          transactionType: 'Transferência Recebida',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    // Nubank - Transferência Enviada
    if (this.matchPattern(fullText, this.nubankPatterns.transferenciaEnviada)) {
      const amount = this.extractAmount(fullText);

      if (amount) {
        return {
          type: 'expense',
          amount,
          description: 'Transferência enviada',
          source: notification.appName,
          transactionType: 'Transferência Enviada',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    // Nubank - Compra Aprovada (Crédito)
    if (this.matchPattern(fullText, this.nubankPatterns.compraAprovada)) {
      const amount = this.extractAmount(fullText);
      const merchant = this.extractMerchantName(notification.text || '');

      if (amount) {
        return {
          type: 'expense',
          amount,
          description: merchant ? `Compra em ${merchant}` : 'Compra aprovada',
          source: notification.appName,
          transactionType: 'Compra Crédito',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    // Nubank - Compra Débito
    if (this.matchPattern(fullText, this.nubankPatterns.compraDebito)) {
      const amount = this.extractAmount(fullText);
      const merchant = this.extractMerchantName(notification.text || '');

      if (amount) {
        return {
          type: 'expense',
          amount,
          description: merchant ? `Compra em ${merchant}` : 'Compra no débito',
          source: notification.appName,
          transactionType: 'Compra Débito',
          date: new Date(notification.postTime),
          rawNotification: notification,
        };
      }
    }

    return null;
  }

  /**
   * Verifica se o texto corresponde ao padrão
   */
  private matchPattern(text: string, pattern: RegExp): boolean {
    return pattern.test(text);
  }

  /**
   * Extrai valor monetário do texto
   */
  private extractAmount(text: string): number | null {
    // Padrões: R$ 123,45 ou R$123.45
    const patterns = [
      /r\$\s*([\d.]+,\d{2})/gi,  // R$ 1.234,56
      /r\$\s*([\d,]+\.\d{2})/gi,  // R$ 1,234.56
      /r\$\s*(\d+,\d{2})/gi,      // R$ 123,45
      /r\$\s*(\d+\.\d{2})/gi,     // R$ 123.45
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        // Converter para número
        let amountStr = match[1];

        // Remover pontos de milhar e substituir vírgula por ponto
        if (amountStr.includes(',')) {
          amountStr = amountStr.replace(/\./g, '').replace(',', '.');
        }

        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          console.log('💵 Valor extraído:', amount);
          return amount;
        }
      }
    }

    console.log('⚠️ Não foi possível extrair valor de:', text);
    return null;
  }

  /**
   * Extrai nome do remetente do Pix
   */
  private extractSenderFromPix(text: string): string | null {
    // Padrões: "Pix recebido de João Silva"
    const patterns = [
      /recebido\s+de\s+([a-zá-ú\s]+)/gi,
      /de:\s*([a-zá-ú\s]+)/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extrai nome do destinatário do Pix
   */
  private extractRecipientFromPix(text: string): string | null {
    // Padrões: "Pix para Maria Santos"
    const patterns = [
      /para\s+([a-zá-ú\s]+)/gi,
      /para:\s*([a-zá-ú\s]+)/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extrai nome do estabelecimento
   */
  private extractMerchantName(text: string): string | null {
    // Padrões: "Compra aprovada em IFOOD"
    const patterns = [
      /aprovada\s+em\s+([a-z0-9\s*]+)/gi,
      /no\s+d.bito\s+em\s+([a-z0-9\s*]+)/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Adiciona a transação detectada automaticamente
   */
  private async addDetectedTransaction(
    detected: DetectedTransaction
  ): Promise<void> {
    try {
      console.log('➕ Adicionando transação detectada:', detected);

      // Buscar categoria apropriada
      const category = await this.findAppropriateCategory(detected);

      // Criar transação
      const transactionData: TransactionCreate = {
        type: detected.type,
        amount: detected.amount,
        description: detected.description,
        categoryId: category?.id || '',
        date: detected.date.toISOString(),
        notes: `Detectado automaticamente de ${detected.source} - ${detected.transactionType}`,
      };

      // Adicionar transação (isso já enviará notificação pelo TransactionService)
      const transaction = await this.transactionService.addTransaction(transactionData);

      console.log('✅ Transação adicionada:', transaction);

      // Enviar notificação customizada de detecção
      const notifService = this.getNotificationService();
      await notifService.notifyTransactionDetected(
        detected.description,
        detected.amount,
        detected.source
      );

    } catch (error) {
      console.error('❌ Erro ao adicionar transação detectada:', error);
    }
  }

  /**
   * Encontra categoria apropriada baseado no tipo de transação
   */
  private async findAppropriateCategory(
    detected: DetectedTransaction
  ): Promise<any> {
    const categories = await this.categoryService.getAllCategories();

    // Lógica de categorização inteligente
    if (detected.transactionType.includes('Pix')) {
      // Pix pode ser várias coisas, usar categoria padrão
      return categories.find(
        (c) => c.type === detected.type && c.name.toLowerCase().includes('outros')
      );
    }

    if (detected.transactionType.includes('Compra')) {
      // Tentar categorizar por merchant
      const merchant = detected.description.toLowerCase();

      if (merchant.includes('ifood') || merchant.includes('rappi')) {
        return categories.find((c) => c.name.toLowerCase().includes('alimentação'));
      }

      if (merchant.includes('uber') || merchant.includes('99')) {
        return categories.find((c) => c.name.toLowerCase().includes('transporte'));
      }

      // Default para compras
      return categories.find(
        (c) => c.type === 'expense' && c.name.toLowerCase().includes('compra')
      );
    }

    // Categoria padrão
    return categories.find((c) => c.type === detected.type) || categories[0];
  }
}
