import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationSettingsService } from '../../../services/notification-settings/notification-settings.service';
import { GroupNotificationsModalComponent } from './group-notifications-modal.component';

const ALL_ON: NotificationSettings = { messages: true, questions: true, vote_reminder: true, answers: true };

describe('GroupNotificationsModalComponent', () => {
  let fixture: ComponentFixture<GroupNotificationsModalComponent>;
  let closed: ReturnType<typeof vi.fn<() => void>>;
  let api: { getGroupSettings: ReturnType<typeof vi.fn>; saveGroupSettings: ReturnType<typeof vi.fn> };

  const query = <T extends Element>(selector: string) => fixture.nativeElement.querySelector(selector) as T;

  beforeEach(async () => {
    api = {
      getGroupSettings: vi.fn().mockResolvedValue({ group: ALL_ON, global: ALL_ON }),
      saveGroupSettings: vi.fn((_id: number, group: NotificationSettings) => Promise.resolve({ group, global: ALL_ON })),
    };
    await TestBed.configureTestingModule({
      imports: [GroupNotificationsModalComponent],
      providers: [{ provide: NotificationSettingsService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(GroupNotificationsModalComponent);
    fixture.componentRef.setInput('groupId', 3);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
  });

  it("shows the group's switches", () => {
    expect(api.getGroupSettings).toHaveBeenCalledWith(3);
    expect(fixture.nativeElement.querySelectorAll('input[type=checkbox]').length).toBe(4);
  });

  it('closes on the X, a click outside and Escape, not on a click inside', () => {
    query<HTMLElement>('.modal-dialog').click();
    expect(closed).not.toHaveBeenCalled();

    query<HTMLElement>('.modal-close').click();
    query<HTMLElement>('.modal').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toHaveBeenCalledTimes(3);
  });

  it('closes once saved', async () => {
    query<HTMLInputElement>('input[type=checkbox]').click();
    await fixture.whenStable();
    query<HTMLButtonElement>('.group-notifications-save').click();
    await fixture.whenStable();
    expect(api.saveGroupSettings).toHaveBeenCalledOnce();
    expect(closed).toHaveBeenCalledOnce();
  });
});
