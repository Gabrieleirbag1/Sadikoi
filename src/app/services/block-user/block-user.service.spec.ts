import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { BlockUserService } from './block-user.service';

describe('BlockUserService', () => {
  let service: BlockUserService;
  let backend: HttpTestingController;
  const url = `${environment.apiUrl}auth/security/blocks/`;
  const bob = { id: 2, username: 'bob' } as User;

  beforeEach(() => {
    service = TestBed.inject(BlockUserService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('loads who I blocked and who blocked me', async () => {
    const loading = service.load();
    backend.expectOne(url).flush({ success: true, message: '', content: { blocked: [2], blocked_by: [3, 4] } });
    await loading;
    expect([...service.blocked()]).toEqual([2]);
    expect([...service.blockedBy()]).toEqual([3, 4]);
  });

  it('block, then unblock', async () => {
    const blocking = service.block(bob);
    const put = backend.expectOne(`${url}2`);
    expect(put.request.method).toBe('PUT');
    put.flush({ success: true, message: '' });
    expect(await blocking).toBe(true);
    expect(service.blocked().has(2)).toBe(true);

    const unblocking = service.unblock(bob);
    const del = backend.expectOne(`${url}2`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ success: true, message: '' });
    expect(await unblocking).toBe(true);
    expect(service.blocked().has(2)).toBe(false);
  });

  it('a failed block changes nothing', async () => {
    const blocking = service.block(bob);
    backend.expectOne(`${url}2`).flush({ success: false, message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    expect(await blocking).toBe(false);
    expect(service.blocked().size).toBe(0);
  });

  it('open and close the confirmation', () => {
    service.open(bob);
    expect(service.target()).toBe(bob);
    service.close();
    expect(service.target()).toBeNull();
  });
});
