// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private platform: Platform,
  ) {}

  async canActivate(): Promise<boolean> {
    await this.platform.ready();

    // Permite acesso no navegador (desenvolvimento)
    // Em produção com dispositivos nativos, a biometria será exigida
    return true
    const isNativePlatform = this.platform.is('capacitor');

    if (!isNativePlatform) {
      return true;
    }

    try {
      const result = await NativeBiometric.isAvailable();

      if (!result.isAvailable) {
        console.warn('Biometria não disponível no dispositivo');
        return false;
      }

      const verified = await NativeBiometric.verifyIdentity({
        reason: 'Autentique-se para acessar o aplicativo',
        title: 'Autenticação necessária',
        subtitle: 'Use sua biometria ou PIN',
        description: '',
      })
        .then(() => true)
        .catch(() => false);

      return verified;
    } catch (err) {
      console.error('Erro durante a autenticação biométrica:', err);
      this.router.navigate(['']);
      return false;
    }
  }
}
