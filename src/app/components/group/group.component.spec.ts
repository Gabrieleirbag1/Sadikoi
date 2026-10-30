import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { GroupComponent } from './group.component';

const ALL_ON: NotificationSettings = { messages: true, questions: true, vote_reminder: true, answers: true };

describe('GroupComponent', () => {
  let component: GroupComponent;
  let fixture: ComponentFixture<GroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupComponent],
      providers: [
        {
          provide: NotificationSettingsService,
          useValue: { getGroupSettings: vi.fn().mockResolvedValue({ group: ALL_ON, global: ALL_ON }), saveGroupSettings: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("the bell, next to the settings button, opens the group's notification settings", async () => {
    (component as unknown as { group: { set(g: Group): void } }).group.set({ id: 5, users: [] } as unknown as Group);
    await fixture.whenStable();
    const buttons = [...fixture.nativeElement.querySelectorAll('.group-header-actions .icon-button')] as HTMLElement[];
    const icons = buttons.map(button => button.querySelector('img')?.getAttribute('src'));
    expect(icons.slice(-2)).toEqual(['images/icons/settings.svg', 'images/icons/bell.svg']);
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).toBeNull();

    buttons.at(-1)!.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).not.toBeNull();

    (fixture.nativeElement.querySelector('app-group-notifications-modal .modal-close') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).toBeNull();
  });
});
