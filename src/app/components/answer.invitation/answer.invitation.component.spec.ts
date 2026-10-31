import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { AnswerInvitationComponent } from './answer.invitation.component';
import { GroupsService } from '../../services/groups/groups.service';
import { takePostLoginRedirect } from '../../utils/post-login-redirect';

describe('AnswerInvitationComponent', () => {
  let answer: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    answer = vi.fn();
    navigate = vi.fn();
    await TestBed.configureTestingModule({
      imports: [AnswerInvitationComponent],
      providers: [
        { provide: GroupsService, useValue: { answerGroupInvitation: answer } },
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'abc' }) } } },
      ],
    }).compileComponents();
  });

  const open = async () => {
    const fixture = TestBed.createComponent(AnswerInvitationComponent);
    await fixture.componentInstance.ngOnInit();
  };

  it('joins the group and opens it', async () => {
    answer.mockResolvedValue({ id: 7 });
    await open();
    expect(answer).toHaveBeenCalledWith('abc');
    expect(navigate).toHaveBeenCalledWith(['/group', 7], { state: { group: { id: 7 } } });
    expect(takePostLoginRedirect()).toBeNull();
  });

  it('expired session: keeps the invitation for after the login', async () => {
    answer.mockRejectedValue(new HttpErrorResponse({ status: 401 }));
    await open();
    expect(navigate).not.toHaveBeenCalled(); // the interceptor opens the login page
    expect(takePostLoginRedirect()).toBe('/group/invitations/abc');
  });

  it('invalid invitation: home page, nothing kept', async () => {
    answer.mockRejectedValue(new HttpErrorResponse({ status: 404 }));
    await open();
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(takePostLoginRedirect()).toBeNull();
  });
});
