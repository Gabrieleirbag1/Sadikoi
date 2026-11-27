import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileComponent } from './user-profile.component';
import { ImagePreviewService } from '../../../services/image-preview/image-preview.service';
import { BlockUserService } from '../../../services/block-user/block-user.service';
import { HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the profile picture full size when clicked', () => {
    fixture.componentRef.setInput('user', { id: 7, username: 'alice', profile_picture: 'alice.png' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').click();
    const preview = TestBed.inject(ImagePreviewService).preview();
    expect(preview?.url).toContain('/auth/profile-picture/alice.png');
    expect(preview?.alt).toBe('alice');
  });

  it('does not preview the default picture', () => {
    fixture.componentRef.setInput('user', { id: 7, username: 'alice', profile_picture: null });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').click();
    expect(TestBed.inject(ImagePreviewService).preview()).toBeNull();
  });

  describe('block', () => {
    const bob = { id: 2, username: 'bob' } as User;
    const actions = () => [...fixture.nativeElement.querySelectorAll('.user-profile-actions > *')] as HTMLElement[];
    const labels = () => actions().map(element => element.textContent?.trim());

    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'me' }));
      fixture = TestBed.createComponent(UserProfileComponent);
      fixture.componentRef.setInput('user', bob);
      fixture.detectChanges();
    });

    afterEach(() => localStorage.removeItem('user'));

    it('Block sits next to Report and opens the confirmation', () => {
      expect(labels()).toEqual(['userProfile.block', 'userProfile.report']);
      actions()[0].click();
      expect(TestBed.inject(BlockUserService).target()).toBe(bob);
    });

    it('a blocked user gets Unblock, which applies right away', async () => {
      const service = TestBed.inject(BlockUserService);
      const backend = TestBed.inject(HttpTestingController);
      const blocking = service.block(bob);
      backend.expectOne(`${environment.apiUrl}auth/security/blocks/2`).flush({ success: true, message: '' });
      await blocking;
      fixture.detectChanges();
      expect(labels()).toEqual(['userProfile.unblock', 'userProfile.report']);

      actions()[0].click();
      backend.expectOne(`${environment.apiUrl}auth/security/blocks/2`).flush({ success: true, message: '' });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(service.target()).toBeNull();
      expect(labels()).toEqual(['userProfile.block', 'userProfile.report']);
    });

    it('someone who blocked me shows a text instead of the button', async () => {
      const backend = TestBed.inject(HttpTestingController);
      const loading = TestBed.inject(BlockUserService).load();
      backend.expectOne(`${environment.apiUrl}auth/security/blocks/`).flush({ success: true, message: '', content: { blocked: [], blocked_by: [2] } });
      await loading;
      fixture.detectChanges();
      expect(labels()).toEqual(['userProfile.blockedYou', 'userProfile.report']);
      expect(actions()[0].tagName).toBe('SPAN');
    });

    it('no block or report button on my own profile', () => {
      fixture.componentRef.setInput('user', { id: 1, username: 'me' });
      fixture.detectChanges();
      expect(actions()).toEqual([]);
    });
  });
});
