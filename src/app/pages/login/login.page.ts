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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  ToastController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, lockClosed, personAdd, wallet, eye, eyeOff } from 'ionicons/icons';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { LoginCredentials } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  credentials: LoginCredentials = {
    email: '',
    password: '',
  };

  isLoading = false;
  showPassword = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({ mail, lockClosed, personAdd, wallet, eye, eyeOff });
  }

  async login() {
    // Validar campos obrigatórios
    if (!this.credentials.email || !this.credentials.password) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha email e senha',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      const toast = await this.toastCtrl.create({
        message: 'Digite um email válido',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.isLoading = true;

    try {
      const token = await this.userService.login(this.credentials);

      // Salvar token
      await this.authService.saveToken(token);

      const toast = await this.toastCtrl.create({
        message: 'Login realizado com sucesso!',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Redirecionar para a home
      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);

      let errorMessage = 'Erro ao fazer login. Tente novamente.';

      // Tratar mensagens de erro específicas da API
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.status === 404) {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.status === 0) {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
      }

      const toast = await this.toastCtrl.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  togglePassword(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }
}
