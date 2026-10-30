import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationSettingsService } from '../../services/notification-settings/notification-settings.service';
import { QuestionComponent } from './question.component';

const ALL_ON: NotificationSettings = { messages: true, questions: true, vote_reminder: true, answers: true };

describe('QuestionComponent', () => {
  let component: QuestionComponent;
  let fixture: ComponentFixture<QuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionComponent],
      providers: [
        {
          provide: NotificationSettingsService,
          useValue: { getGroupSettings: vi.fn().mockResolvedValue({ group: ALL_ON, global: ALL_ON }), saveGroupSettings: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("the bell, right of the calendar, opens the group's notification settings", async () => {
    component.group.set({ id: 5, users: [] } as unknown as Group);
    await fixture.whenStable();
    const actions = fixture.nativeElement.querySelector('.question-actions') as HTMLElement;
    const bell = actions.lastElementChild as HTMLElement;
    expect(actions.firstElementChild?.classList).toContain('calendar-anchor');
    expect(bell.classList).toContain('notifications-button');
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).toBeNull();

    bell.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).not.toBeNull();

    (fixture.nativeElement.querySelector('.modal-close') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-group-notifications-modal')).toBeNull();
  });
});
