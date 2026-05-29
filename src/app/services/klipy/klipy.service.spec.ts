import { TestBed } from '@angular/core/testing';

import { KlipyService } from './klipy.service';

describe('KlipyService', () => {
  let service: KlipyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KlipyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
