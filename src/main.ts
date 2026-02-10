import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
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
    ),
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).then((ref) => {
  window.injector = ref.injector;
});
