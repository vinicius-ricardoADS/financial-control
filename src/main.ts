import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import {
  EnvironmentInjector,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { setAssetPath } from '@stencil/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

setAssetPath(`${window.location.origin}/`);

registerLocaleData(localePt, 'pt-BR');

declare global {
  interface Window {
    injector: EnvironmentInjector;
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    importProvidersFrom(
      NgxSkeletonLoaderModule.forRoot(),
      MatNativeDateModule,
      IonicStorageModule.forRoot({
        name: '__financedb',
        driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
      }),
    ),
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideAnimations(),
  ],
}).then((ref) => {
  window.injector = ref.injector;
});
