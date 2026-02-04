import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
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
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, mail, lockClosed, arrowBack, eye, eyeOff } from 'ionicons/icons';
import { UserService } from '../../../services/user.service';
import { UserCreate } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
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
    IonButtons,
  ],
})
export class RegisterPage {
  formData: UserCreate = {
    name: '',
    email: '',
    password: '',
  };

  confirmPassword = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private userService: UserService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({ person, mail, lockClosed, arrowBack, eye, eyeOff });
  }

  async register() {
    // Validar campos obrigatórios
    if (!this.formData.name || !this.formData.email || !this.formData.password) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha todos os campos obrigatórios',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      const toast = await this.toastCtrl.create({
        message: 'Digite um email válido',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Validar senha
    if (this.formData.password.length < 6) {
      const toast = await this.toastCtrl.create({
        message: 'A senha deve ter no mínimo 6 caracteres',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Validar confirmação de senha
    if (this.formData.password !== this.confirmPassword) {
      const toast = await this.toastCtrl.create({
        message: 'As senhas não coincidem',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.isLoading = true;

    try {
      const user = await this.userService.register(this.formData);

      const toast = await this.toastCtrl.create({
        message: `Bem-vindo, ${user.name}! Cadastro realizado com sucesso.`,
        duration: 3000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Resetar formulário
      this.formData = { name: '', email: '', password: '' };
      this.confirmPassword = '';

      // Redirecionar para página de login
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Erro ao registrar usuário:', error);

      let errorMessage = 'Erro ao cadastrar usuário. Tente novamente.';

      // Tratar mensagens de erro específicas da API
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400) {
        errorMessage = 'Dados inválidos. Verifique as informações.';
      } else if (error.status === 409) {
        errorMessage = 'Este email já está cadastrado.';
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

  goBack() {
    this.router.navigate(['/login']);
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
}
