import { Component, Input, OnInit } from '@angular/core';
import {
  IonHeader,
  IonMenu,
  IonMenuToggle,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonImg,
  IonMenuButton,
  NavController,
  MenuController,
} from '@ionic/angular/standalone';
import { MatIconRegistry, MatIcon } from '@angular/material/icon';
import { NgFor, LocationStrategy, NgClass, NgIf } from '@angular/common';
import { MatRipple } from '@angular/material/core';
import { ButtonComponent } from '../button/button.component';
import assets from 'src/utils/images.json';
import { NetworkStatusProvider } from 'src/providers/network-status';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  providers: [MatIconRegistry],
  imports: [
    MatIcon,
    MatRipple,
    IonImg,
    IonTitle,
    IonMenuToggle,
    IonMenu,
    IonMenuButton,
    IonContent,
    IonButtons,
    IonToolbar,
    IonHeader,
    NgClass,
    ButtonComponent,
  ],
})
export class HeaderComponent implements OnInit {
  dexcoLogo = assets.images['logo-white'].location;
  isOnline: boolean = false;

  @Input()
  main_title: string = '';

  constructor(
    private readonly navCtrl: NavController,
    private readonly menuCtrl: MenuController,
    private readonly locationStrategy: LocationStrategy,
    private readonly networkStatusProvider: NetworkStatusProvider,
  ) {}

  ngOnInit() {
    this.networkStatusProvider.isOnline().subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  toggleMenu() {
    this.menuCtrl.toggle();
  }

  logout() {
    this.navCtrl.navigateRoot('auth/login', {
      state: { from: this.locationStrategy.path() },
    });
  }
}
