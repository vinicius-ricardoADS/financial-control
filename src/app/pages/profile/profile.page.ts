import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut, trash, person } from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
  ],
})
export class ProfilePage {
  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({ logOut, trash, person });
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
    await this.authService.logout();

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
    await this.authService.clearAllData();

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
