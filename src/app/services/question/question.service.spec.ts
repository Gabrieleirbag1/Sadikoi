import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { QuestionService } from './question.service';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_TOAST } from '../../interceptors/error.interceptor';

describe('QuestionService', () => {
  let service: QuestionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('rates a question without an error toast', async () => {
    const done = service.rateQuestion(3, 42, false);
    const request = http.expectOne(`${environment.apiUrl}questions/3/42/feedback/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ liked: false });
    expect(request.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    request.flush({ success: true });
    await expect(done).resolves.toBeUndefined();
  });
});
