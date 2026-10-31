import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideTranslateService} from '@ngx-translate/core';
import { provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { ParamRouteReuseStrategy } from './utils/param-route-reuse.strategy';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, authInterceptor, errorInterceptor])
    ),
    provideRouter(routes),
    // /group/5 -> /group/12 rebuilds the group page instead of keeping group 5 on screen.
    { provide: RouteReuseStrategy, useClass: ParamRouteReuseStrategy },
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en',
      lang: 'en'
    })
  ]
};