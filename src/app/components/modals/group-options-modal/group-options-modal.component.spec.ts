import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOptionsComponent } from './group-options-modal.component';
import { ModalService } from '../../../services/modal/modal.service';
import { GroupsService } from '../../../services/groups/groups.service';

const ADMIN = { id: 1, username: 'admin', role: 'admin' } as User;
const GROUP = {
  id: 5, name: 'Team', description: 'desc', users: [ADMIN], date_created: '2026-01-01',
  daily_reset_timestamp: '15:00', themes: ['connerie'],
} as unknown as Group;

describe('GroupOptionsComponent', () => {
  let fixture: ComponentFixture<GroupOptionsComponent>;
  let modals: ModalService;
  let api: { updateGroup: ReturnType<typeof vi.fn> };

  const query = <T extends Element>(selector: string) => fixture.nativeElement.querySelector(selector) as T;
  const updateButton = () => query<HTMLButtonElement>('button[type=submit]');
  const nameInput = () => query<HTMLInputElement>('#name');

  const open = async () => {
    modals.open('group-options-modal', { title: 'Options' });
    await fixture.whenStable();
  };
  const type = async (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    localStorage.setItem('user', JSON.stringify(ADMIN));
    api = { updateGroup: vi.fn().mockResolvedValue({ ...GROUP, name: 'New' }) };
    await TestBed.configureTestingModule({
      imports: [GroupOptionsComponent],
      providers: [{ provide: GroupsService, useValue: api }],
    }).compileComponents();
    modals = TestBed.inject(ModalService);
    fixture = TestBed.createComponent(GroupOptionsComponent);
    fixture.componentRef.setInput('group', GROUP);
    await fixture.whenStable();
  });

  afterEach(() => localStorage.removeItem('user'));

  it('greys the update button out until something changes', async () => {
    await open();
    expect(updateButton().disabled).toBe(true);
    await type(nameInput(), 'New');
    expect(updateButton().disabled).toBe(false);
    await type(nameInput(), 'Team');
    expect(updateButton().disabled).toBe(true);
  });

  it('forgets what was not saved when closed, with the X or Escape', async () => {
    await open();
    await type(nameInput(), 'Not saved');
    query<HTMLElement>('.modal-close').click();
    await open();
    expect(nameInput().value).toBe('Team');

    await type(nameInput(), 'Not saved either');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await fixture.whenStable();
    expect(modals.isOpen('group-options-modal')).toBe(false);
    await open();
    expect(nameInput().value).toBe('Team');
    expect(api.updateGroup).not.toHaveBeenCalled();
  });
});
