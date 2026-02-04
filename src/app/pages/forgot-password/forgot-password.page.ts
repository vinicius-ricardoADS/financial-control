import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  arrowBack,
  lockClosedOutline,
  eye,
  eyeOff,
} from 'ionicons/icons';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
  ],
})
export class ForgotPasswordPage {
  email = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private userService: UserService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      mailOutline,
      arrowBack,
      lockClosedOutline,
      eye,
      eyeOff,
    });
  }

  async resetPassword() {
    if (!this.email?.trim()) {
      await this.showToast('Digite seu e-mail', 'warning');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      await this.showToast('Digite um e-mail válido', 'warning');
      return;
    }

    if (!this.newPassword) {
      await this.showToast('Digite a nova senha', 'warning');
      return;
    }

    if (this.newPassword.length < 6) {
      await this.showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      await this.showToast('As senhas não coincidem', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      await this.userService.resetPassword(this.email.trim(), this.newPassword);

      await this.showToast('Senha redefinida com sucesso!', 'success');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);

      let errorMessage = 'Erro ao redefinir senha. Tente novamente.';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'E-mail não encontrado.';
      } else if (error.status === 0) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }

      await this.showToast(errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  togglePassword(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
