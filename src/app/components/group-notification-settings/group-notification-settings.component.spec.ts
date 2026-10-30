import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { GroupNotificationSettingsComponent } from './group-notification-settings.component';

const ALL_ON: NotificationSettings = { messages: true, questions: true, vote_reminder: true, answers: true };

describe('GroupNotificationSettingsComponent', () => {
  let fixture: ComponentFixture<GroupNotificationSettingsComponent>;
  let api: { getGroupSettings: ReturnType<typeof vi.fn>; saveGroupSettings: ReturnType<typeof vi.fn> };

  const checkboxes = () => [...fixture.nativeElement.querySelectorAll('input[type=checkbox]')] as HTMLInputElement[];
  const saveButton = () => fixture.nativeElement.querySelector('.group-notifications-save') as HTMLButtonElement;

  beforeEach(async () => {
    api = {
      getGroupSettings: vi.fn().mockResolvedValue({ group: ALL_ON, global: ALL_ON }),
      saveGroupSettings: vi.fn((_id: number, group: NotificationSettings) => Promise.resolve({ group, global: ALL_ON })),
    };
    await TestBed.configureTestingModule({
      imports: [GroupNotificationSettingsComponent],
      providers: [{ provide: NotificationSettingsService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(GroupNotificationSettingsComponent);
    fixture.componentRef.setInput('groupId', 7);
    await fixture.whenStable();
  });

  it('toggling sends nothing; save sends every switch in one request', async () => {
    expect(saveButton().disabled).toBe(true);
    for (const box of checkboxes().slice(0, 3)) {
      box.click();
    }
    await fixture.whenStable();
    expect(api.saveGroupSettings).not.toHaveBeenCalled();
    expect(saveButton().disabled).toBe(false);

    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    saveButton().click();
    await fixture.whenStable();
    expect(saved).toHaveBeenCalledOnce(); // the modal closes
    expect(api.saveGroupSettings).toHaveBeenCalledExactlyOnceWith(7, { messages: false, questions: false, vote_reminder: false, answers: true });
    expect(saveButton().disabled).toBe(true); // saved: nothing left to save
  });

  it('does not report a failed save as saved', async () => {
    api.saveGroupSettings.mockResolvedValue(null);
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    checkboxes()[0].click();
    await fixture.whenStable();
    saveButton().click();
    await fixture.whenStable();
    expect(saved).not.toHaveBeenCalled();
    expect(saveButton().disabled).toBe(false); // the draft is kept, ready to retry
  });
});
