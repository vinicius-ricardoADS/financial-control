import { Injectable } from '@angular/core';
import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

/**
 * Interface para notificações externas capturadas
 */
export interface ExternalNotification {
  id: number;
  packageName: string;
  appName: string;
  title?: string;
  text?: string;
  subText?: string;
  bigText?: string;
  postTime: number;
  key: string;
  category?: string;
  channelId?: string;
}

/**
 * Interface do plugin Capacitor customizado
 */
export interface NotificationListenerPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ success: boolean; message: string }>;
  getStatus(): Promise<{ enabled: boolean; serviceName: string }>;
  addListener(
    eventName: 'notificationReceived',
    listenerFunc: (notification: ExternalNotification) => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  removeAllListeners(): Promise<void>;
}

const NotificationListener = registerPlugin<NotificationListenerPlugin>(
  'NotificationListener'
);

@Injectable({
  providedIn: 'root',
})
export class ExternalNotificationService {
  private listenerHandle: PluginListenerHandle | null = null;
  private isListening = false;
  private notificationCallback?: (notification: ExternalNotification) => void;

  constructor() {
    console.log('📱 ExternalNotificationService inicializado');
  }

  /**
   * Verifica se o app tem permissão para escutar notificações
   */
  async checkPermission(): Promise<boolean> {
    try {
      const result = await NotificationListener.checkPermission();
      return result.granted;
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Abre configurações para o usuário conceder permissão
   */
  async requestPermission(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await NotificationListener.requestPermission();
      return result;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      return {
        success: false,
        message: `Erro: ${error}`,
      };
    }
  }

  /**
   * Retorna o status do serviço
   */
  async getStatus(): Promise<{ enabled: boolean; serviceName: string }> {
    try {
      return await NotificationListener.getStatus();
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { enabled: false, serviceName: '' };
    }
  }

  /**
   * Define callback para processar notificações
   */
  setNotificationCallback(callback: (notification: ExternalNotification) => void): void {
    this.notificationCallback = callback;
  }

  /**
   * Inicia escuta de notificações externas
   */
  async startListening(): Promise<boolean> {
    if (this.isListening) {
      console.warn('⚠️ Já está escutando notificações');
      return true;
    }

    try {
      // Verificar permissão primeiro
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.warn('⚠️ Sem permissão para escutar notificações');
        return false;
      }

      // Registrar listener
      this.listenerHandle = await NotificationListener.addListener(
        'notificationReceived',
        (notification: ExternalNotification) => {
          console.log('📲 Notificação externa recebida:', {
            app: notification.appName,
            title: notification.title,
            text: notification.text,
            package: notification.packageName,
          });

          // Chamar callback se definido
          if (this.notificationCallback) {
            this.notificationCallback(notification);
          }
        }
      );

      this.isListening = true;
      console.log('✅ Escuta de notificações iniciada - Logs serão exibidos no console');
      return true;
    } catch (error) {
      console.error('❌ Erro ao iniciar escuta:', error);
      return false;
    }
  }

  /**
   * Para escuta de notificações externas
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.listenerHandle) {
        await this.listenerHandle.remove();
        this.listenerHandle = null;
      }
      await NotificationListener.removeAllListeners();
      this.isListening = false;
      console.log('🛑 Escuta de notificações parada');
    } catch (error) {
      console.error('❌ Erro ao parar escuta:', error);
    }
  }

  /**
   * Retorna se está escutando notificações
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}
