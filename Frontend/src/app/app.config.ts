import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { CookieService } from 'ngx-cookie-service';

// --- i18n Imports ---
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    CookieService,
    provideTranslateService({ defaultLanguage: 'fr' }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: `.json?cb=${new Date().getTime()}`
    })
  ]
};
