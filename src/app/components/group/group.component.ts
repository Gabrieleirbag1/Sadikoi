import { Component, DestroyRef, ElementRef, HostListener, inject, model, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GroupsService } from '../../services/groups/groups.service';
import { QuestionComponent } from "../question/question.component";
import { LoggerService } from '../../services/logger/logger.service';
import { GroupOptionsComponent } from "../modals/group-options-modal/group-options-modal.component";
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HomeFooterComponent } from "../layout/home-footer/home-footer.component";
import { ModalService } from '../../services/modal/modal.service';
import { CalendarComponent } from "../tooltips/calendar/calendar.component";
import { WebsocketService } from '../../services/websocket/websocket.service';

@Component({
  selector: 'app-group',
  imports: [QuestionComponent, GroupOptionsComponent, TranslatePipe, HomeFooterComponent, CalendarComponent],
  templateUrl: './group.component.html',
  styleUrl: './group.component.css',
})
export class GroupComponent implements OnInit, OnDestroy {
  private readonly logger = inject(LoggerService)
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  private readonly websocketService = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);
  protected group = signal<Group | null>(null);
  protected homeState = signal<HomeState>('group');
  protected showCalendarFlag = signal<boolean>(false);
  public readonly question = model<Question | null>(null);
  @ViewChild('calendarAnchor') calendarAnchor?: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    // const navState = window.history.state;
    // if (navState && navState.group) {
    //   this.group.set(navState.group);
    //   return;
    // }

    const groupIdUrl = window.location.pathname.split('/').pop();
    const groupId = groupIdUrl ? parseInt(groupIdUrl, 10) : null;
    if (groupId) {
      await this.fetchGroup(groupId);
    } else {
      this.logger.error('Invalid group ID in URL');
    }

    if (this.group()) {
      this.websocketService.joinGroup(String(this.group()!.id));
    }

    this.websocketService.listen<Group>('group_updated').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(group => this.group.set(group));
    this.websocketService.listen<Group>('member_joined').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(group => this.group.set(group));
    this.websocketService.listen<Group>('member_left').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(group => this.group.set(group));
    this.websocketService.listen<Group>('role_updated').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(group => this.group.set(group));
    this.websocketService.listen<{ group_id: number }>('group_deleted').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(payload => {
      if (payload.group_id === this.group()?.id) {
        this.router.navigate(['/groups']);
      }
    });
  }

  ngOnDestroy(): void {
    const g = this.group();
    if (g) this.websocketService.leaveGroup(String(g.id));
  }

  protected async fetchGroup(groupId: number): Promise<void> {
    try {
      const group = await this.groupsService.getGroup(groupId);
      if (group) this.group.set(group);
      this.logger.debug('Fetched group:', this.group());
    } catch (error) {
      this.logger.error('Error fetching group:', error);
      this.router.navigate(['/groups']);
    }
  }

  protected async fetchInvitation(): Promise<void> {
    if (!this.group()) {
      this.logger.error('Group not loaded yet');
      return;
    }
    try {
      const invitation = await this.groupsService.getGroupInvitation(this.group()!.id);
      this.logger.debug('Fetched group invitation:', invitation);
      if (invitation) {
        const invitationUrl = `${window.location.origin}/group/invitations/${invitation}`;
        await navigator.clipboard.writeText(invitationUrl);
        this.logger.info('Invitation copied to clipboard');
      } else {
        this.logger.warn('No invitation to copy');
      }
    } catch (error) {
      this.logger.error('Error fetching group invitation:', error);
    }
  }

  protected openGroupOptionsModal(): void {
    this.modalService.open('group-options-modal', {
      title: 'Group Options',
      description: '',
      save: () => console.log('confirmed'),
      discard: () => console.log('cancelled'),
    });
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (!this.showCalendarFlag()) return;
    if (this.calendarAnchor && !this.calendarAnchor.nativeElement.contains(event.target as Node)) {
      this.showCalendarFlag.set(false);
    }
  }

  protected showCalendar(): void {
    this.showCalendarFlag.set(!this.showCalendarFlag());
  }

}
