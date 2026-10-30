import { HttpContextToken, HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, tap, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConnectivityService, GATEWAY_ERRORS } from '../services/connectivity/connectivity.service';
import { NotificationService } from '../services/notification/notification.service';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** A GET hanging longer than this is treated as a connection problem (uploads and other writes are left alone). */
const GET_TIMEOUT_MS = 20_000;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const isApi = req.url.startsWith(environment.apiUrl);

  const showError = (message: string) => {
    if (!req.context.get(SKIP_ERROR_TOAST)) injector.get(NotificationService).showError(message);
  };
  const translate = (key: string) => injector.get(TranslateService).instant(key);

  let response$ = next(req);
  if (isApi && req.method === 'GET') {
    response$ = response$.pipe(timeout(GET_TIMEOUT_MS));
  }

  return response$.pipe(
    tap(event => {
      if (isApi && event.type === HttpEventType.Response) injector.get(ConnectivityService).reportSuccess();
    }),
    catchError((error: unknown) => {
      const connectionProblem = isApi && (
        error instanceof TimeoutError
        || (error instanceof HttpErrorResponse && (error.status === 0 || GATEWAY_ERRORS.has(error.status)))
      );
      if (connectionProblem) {
        // The connection error screen replaces the toast; a one-off failure (API reachable again) still gets one.
        injector.get(ConnectivityService).reportFailure().then(confirmed => {
          if (!confirmed) showError(translate('notification.networkError'));
        });
      } else if (error instanceof HttpErrorResponse && error.status !== 401) {
        const apiMessage = typeof error.error?.message === 'string' ? error.error.message : '';
        showError(error.status === 0
          ? translate('notification.networkError')
          : apiMessage || translate('notification.genericError'));
      }
      return throwError(() => error);
    })
  );
};
