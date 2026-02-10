import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput,
  IonSpinner,
  IonAvatar,
  AlertController,
  ToastController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOut,
  trash,
  person,
  createOutline,
  mailOutline,
  personOutline,
  checkmarkOutline,
  closeOutline,
  eye,
  eyeOff,
  lockClosedOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User, UserUpdate } from '../../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonInput,
    IonSpinner,
    IonAvatar,
  ],
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  showPassword = false;
  showNewPassword = false;

  editForm: UserUpdate = {
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({
      logOut,
      trash,
      person,
      createOutline,
      mailOutline,
      personOutline,
      checkmarkOutline,
      closeOutline,
      eye,
      eyeOff,
      lockClosedOutline,
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  async loadUserData() {
    // Primeiro pega os dados básicos do token para ter algo a mostrar
    const tokenUser = this.authService.getCurrentUser();
    if (tokenUser) {
      this.user = tokenUser;
      this.editForm.name = tokenUser.name;
      this.editForm.email = tokenUser.email;
    }

    // Depois busca os dados atualizados do servidor
    await this.fetchUserFromServer();
  }

  async fetchUserFromServer() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isLoading = true;
    try {
      const userFromServer = await this.userService.getUserProfile(userId);
      this.user = userFromServer;
      this.editForm.name = userFromServer.name;
      this.editForm.email = userFromServer.email;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Se falhar, mantém os dados do token
    } finally {
      this.isLoading = false;
    }
  }

  getInitials(): string {
    if (!this.user?.name) return '?';
    const names = this.user.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(): string {
    if (!this.user?.name) return '#6366f1';
    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#f43f5e', // Rose
      '#f97316', // Orange
      '#eab308', // Yellow
      '#22c55e', // Green
      '#14b8a6', // Teal
      '#0ea5e9', // Sky
      '#3b82f6', // Blue
    ];
    const index = this.user.name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  startEditing() {
    this.editForm.name = this.user?.name || '';
    this.editForm.email = this.user?.email || '';
    this.editForm.currentPassword = '';
    this.editForm.newPassword = '';
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
    this.editForm.currentPassword = '';
    this.editForm.newPassword = '';
  }

  togglePasswordVisibility(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showPassword = !this.showPassword;
  }

  toggleNewPasswordVisibility(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showNewPassword = !this.showNewPassword;
  }

  async saveChanges() {
    if (!this.user) return;

    if (!this.editForm.name?.trim()) {
      await this.showToast('O nome é obrigatório', 'warning');
      return;
    }

    if (this.editForm.name.trim().length < 6) {
      await this.showToast('O nome deve ter no mínimo 6 caracteres', 'warning');
      return;
    }

    if (!this.editForm.email?.trim()) {
      await this.showToast('O e-mail é obrigatório', 'warning');
      return;
    }

    if (!this.isValidEmail(this.editForm.email)) {
      await this.showToast('E-mail inválido', 'warning');
      return;
    }

    if (this.editForm.newPassword && !this.editForm.currentPassword) {
      await this.showToast('Informe a senha atual para alterar a senha', 'warning');
      return;
    }

    if (this.editForm.newPassword && this.editForm.newPassword.length < 6) {
      await this.showToast('A nova senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }

    const hasChanges =
      this.editForm.name !== this.user.name ||
      this.editForm.email !== this.user.email ||
      (this.editForm.newPassword && this.editForm.newPassword.length > 0);

    if (!hasChanges) {
      await this.showToast('Nenhuma alteração detectada', 'warning');
      return;
    }

    this.isSaving = true;

    try {
      const updateData: UserUpdate = {
        name: this.editForm.name?.trim(),
        email: this.editForm.email?.trim(),
      };

      if (this.editForm.newPassword) {
        updateData.currentPassword = this.editForm.currentPassword;
        updateData.newPassword = this.editForm.newPassword;
      }

      const response = await this.userService.updateUser(updateData);

      // Se retornar um novo token (por exemplo, após mudança de email), salvar
      if (response.token) {
        this.authService.saveToken(response.token);
      }

      // Atualizar dados locais
      this.user = response.user;
      this.isEditing = false;

      await this.showToast('Dados atualizados com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);

      const errorMessage = error?.error?.message || 'Erro ao atualizar dados. Tente novamente.';
      await this.showToast(errorMessage, 'danger');
    } finally {
      this.isSaving = false;
      this.editForm.currentPassword = '';
      this.editForm.newPassword = '';
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Sair do aplicativo',
      message: 'Deseja realmente sair da sua conta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sair',
          role: 'confirm',
          handler: () => {
            this.logout();
          },
        },
      ],
    });

    await alert.present();
  }

  async logout() {
    // Invalida o refresh token no servidor antes de limpar localmente
    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      await this.userService.logoutFromServer(refreshToken);
    }

    this.authService.logout();

    const toast = await this.toastCtrl.create({
      message: 'Você saiu da sua conta',
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();

    await this.router.navigate(['/login']);
  }

  async confirmClearData() {
    const alert = await this.alertCtrl.create({
      header: 'Limpar todos os dados',
      message:
        'Esta ação irá apagar TODOS os dados do aplicativo, incluindo transações, despesas fixas e configurações. Esta ação não pode ser desfeita. Deseja continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Limpar tudo',
          role: 'destructive',
          handler: () => {
            this.clearAllData();
          },
        },
      ],
    });

    await alert.present();
  }

  async clearAllData() {
    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      await this.userService.logoutFromServer(refreshToken);
    }

    this.authService.clearAllData();

    const toast = await this.toastCtrl.create({
      message: 'Todos os dados foram apagados',
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();

    await this.router.navigate(['/login']);
  }
}
