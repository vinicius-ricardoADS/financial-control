import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private notificationService: NotificationService) {}

  async ngOnInit() {
    // Iniciar detecção automática de transações bancárias
    await this.initBankTransactionDetection();
  }

  /**
   * Inicializa detecção de transações bancárias
   * Verifica permissão e inicia escuta automaticamente
   */
  private async initBankTransactionDetection() {
    try {
      console.log('🏦 Inicializando detector de transações bancárias...');

      // Verificar se tem permissão
      const hasPermission = await this.notificationService.hasExternalNotificationPermission();

      if (!hasPermission) {
        console.warn('⚠️ Sem permissão para escutar notificações.');
        console.log('💡 Para ativar:');
        console.log('1. Abra as Configurações do Android');
        console.log('2. Vá em: Notificações > Acesso a notificações');
        console.log('3. Ative "Financial Control"');
        console.log('4. Reabra o app');
        return;
      }

      // Iniciar escuta
      const started = await this.notificationService.startExternalNotificationListener();

      if (started) {
        console.log('✅ Detecção de transações bancárias ATIVADA!');
        console.log('📱 O app agora detectará automaticamente:');
        console.log('   - Pix enviados e recebidos');
        console.log('   - Compras com cartão');
        console.log('   - Transferências bancárias');
        console.log('🔔 Você será notificado quando transações forem detectadas!');
      } else {
        console.error('❌ Erro ao iniciar detecção de transações');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar detector de transações:', error);
    }
  }
}
