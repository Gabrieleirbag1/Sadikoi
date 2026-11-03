import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileComponent } from './user-profile.component';
import { ImagePreviewService } from '../../../services/image-preview/image-preview.service';

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
});
