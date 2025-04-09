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

    try {
      const result = await NativeBiometric.isAvailable();

      if (!result.isAvailable) return false;

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
