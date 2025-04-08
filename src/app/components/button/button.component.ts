import { NgIf } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { MatRipple } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  imports: [IonIcon, MatProgressSpinnerModule, NgIf, MatRipple],
})
export class ButtonComponent {
  @Input()
  variant: 'primary' | 'outline' | 'primary-outline' = 'primary';

  @Input()
  icon?: string;

  @Input()
  disabled: boolean = false;

  @Input()
  type: 'button' | 'menu' | 'reset' | 'submit' = 'button';

  @Input()
  loading = false;

  @HostBinding('style.pointer-events') get pEvents(): string {
    if (this.disabled) {
      return 'none';
    }
    return 'auto';
  }
}
