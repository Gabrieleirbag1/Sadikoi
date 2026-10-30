import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ConnectivityService } from './connectivity.service';

/** fetch stub: `api` / `internet` = a status to answer, or 'down' to fail like a dead network. */
function stubNetwork(api: number | 'down', internet: number | 'down') {
  const fetchMock = vi.fn((url: string) => {
    const answer = url === environment.apiUrl ? api : internet;
    return answer === 'down' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(new Response(null, { status: answer }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    service = TestBed.inject(ConnectivityService);
  });

  afterEach(() => {
    service.reportSuccess(); // stops the recheck timer
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stays ok when the API answers, even with an error status', async () => {
    stubNetwork(404, 204);
    expect(await service.reportFailure()).toBe(false);
    expect(service.status()).toBe('ok');
  });

  it('reports the server when the API is down but the internet works', async () => {
    stubNetwork('down', 204);
    expect(await service.reportFailure()).toBe(true);
    expect(service.status()).toBe('server');
  });

  it('counts a proxy error (502/503/504) as the server being down', async () => {
    stubNetwork(503, 204);
    await service.reportFailure();
    expect(service.status()).toBe('server');
  });

  it('reports a poor connection when nothing answers', async () => {
    stubNetwork('down', 'down');
    await service.reportFailure();
    expect(service.status()).toBe('poor');
  });

  it('reports offline without any request when the device has no network', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = stubNetwork(200, 204);
    await service.reportFailure();
    expect(service.status()).toBe('offline');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('concurrent failures share one check', async () => {
    const fetchMock = stubNetwork('down', 204);
    await Promise.all([service.reportFailure(), service.reportFailure(), service.reportFailure()]);
    expect(fetchMock).toHaveBeenCalledTimes(2); // API + internet probes, once
  });

  it('comes back to ok on the next successful request', async () => {
    stubNetwork('down', 'down');
    await service.reportFailure();
    service.reportSuccess();
    expect(service.status()).toBe('ok');
  });
});
