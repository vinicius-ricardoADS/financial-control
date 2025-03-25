import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader } from '@ionic/angular/standalone';
import { IonMenuToggle, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    CommonModule,
    FormsModule,
    IonMenuToggle,
    MatIcon,
    IonToolbar,
    IonTitle,
  ],
})
export class HomePage {}
