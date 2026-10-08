import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification/notification.service';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 && !req.context.get(SKIP_ERROR_TOAST)) {
        const translate = injector.get(TranslateService);
        const message = error.status === 0
          ? translate.instant('notification.networkError')
          : error.error?.message ?? translate.instant('notification.genericError');
        injector.get(NotificationService).showError(message);
      }
      return throwError(() => error);
    })
  );
};
