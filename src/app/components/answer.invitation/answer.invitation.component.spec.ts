import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerInvitationComponent } from './answer.invitation.component';

describe('AnswerInvitationComponent', () => {
  let component: AnswerInvitationComponent;
  let fixture: ComponentFixture<AnswerInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerInvitationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnswerInvitationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
