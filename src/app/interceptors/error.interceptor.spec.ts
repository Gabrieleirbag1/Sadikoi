import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConnectivityService } from '../services/connectivity/connectivity.service';
import { NotificationService } from '../services/notification/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let connectivity: { reportFailure: ReturnType<typeof vi.fn>; reportSuccess: ReturnType<typeof vi.fn> };
  let toasts: NotificationService;
  const url = `${environment.apiUrl}groups/user/`;

  beforeEach(() => {
    connectivity = { reportFailure: vi.fn(() => Promise.resolve(true)), reportSuccess: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ConnectivityService, useValue: connectivity },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(NotificationService);
  });

  it('a network failure goes to the connection check instead of a toast', async () => {
    const request = firstValueFrom(http.get(url));
    backend.expectOne(url).error(new ProgressEvent('error'));
    await expect(request).rejects.toBeTruthy();
    await Promise.resolve();
    expect(connectivity.reportFailure).toHaveBeenCalledOnce();
    expect(toasts.toasts()).toEqual([]);
  });

  it('a one-off network failure (API reachable again) still shows a toast', async () => {
    connectivity.reportFailure.mockResolvedValue(false);
    const request = firstValueFrom(http.get(url));
    backend.expectOne(url).error(new ProgressEvent('error'));
    await expect(request).rejects.toBeTruthy();
    await new Promise(resolve => setTimeout(resolve));
    expect(toasts.toasts().length).toBe(1);
  });

  it('a gateway error is a connection problem', async () => {
    const request = firstValueFrom(http.get(url));
    backend.expectOne(url).flush(null, { status: 503, statusText: 'Service Unavailable' });
    await expect(request).rejects.toBeTruthy();
    expect(connectivity.reportFailure).toHaveBeenCalledOnce();
  });

  it('an API error keeps its toast and is not a connection problem', async () => {
    const request = firstValueFrom(http.get(url));
    backend.expectOne(url).flush({ message: 'Nope' }, { status: 400, statusText: 'Bad Request' });
    await expect(request).rejects.toBeTruthy();
    expect(connectivity.reportFailure).not.toHaveBeenCalled();
    expect(toasts.toasts().map(t => t.message)).toEqual(['Nope']);
  });

  it('a successful answer clears the connection error', async () => {
    const request = firstValueFrom(http.get(url));
    backend.expectOne(url).flush({ content: [] });
    await request;
    expect(connectivity.reportSuccess).toHaveBeenCalledOnce();
  });

  it('requests outside the API are left out of the connection check', async () => {
    const request = firstValueFrom(http.get('/i18n/en.json'));
    backend.expectOne('/i18n/en.json').error(new ProgressEvent('error'));
    await expect(request).rejects.toBeTruthy();
    expect(connectivity.reportFailure).not.toHaveBeenCalled();
  });
});
