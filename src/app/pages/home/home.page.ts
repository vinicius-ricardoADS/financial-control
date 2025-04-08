import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  imports: [HeaderComponent],
})
export class HomePage {
  constructor() {}
}
