import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading/loading.service';

/** Keeps the loader up while requests are in flight, so data-driven blocks don't pop in visibly. */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const done = inject(LoadingService).begin();
  return next(req).pipe(finalize(done));
};
