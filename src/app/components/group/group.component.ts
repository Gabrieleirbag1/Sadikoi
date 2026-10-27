import { Component, DestroyRef, inject, model, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GroupsService } from '../../services/groups/groups.service';
import { QuestionComponent } from "../question/question.component";
import { LoggerService } from '../../services/logger/logger.service';
import { GroupOptionsComponent } from "../modals/group-options-modal/group-options-modal.component";
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { HomeFooterComponent } from "../layout/home-footer/home-footer.component";
import { ModalService } from '../../services/modal/modal.service';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { NotificationService } from '../../services/notification/notification.service';
import { copyToClipboard } from '../../utils/copy-to-clipboard';
import { environment } from '../../../environments/environment';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-group',
  imports: [QuestionComponent, GroupOptionsComponent, TranslatePipe, HomeFooterComponent],
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
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  protected group = signal<Group | null>(null);
  protected homeState = signal<HomeState>('group');
  public readonly question = model<Question | null>(null);

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

  /** In the app, the invite button opens the phone's share menu; on the website it copies the link. */
  protected readonly isNative = Capacitor.isNativePlatform();

  protected async fetchInvitation(): Promise<void> {
    const group = this.group();
    if (!group) {
      this.logger.error('Group not loaded yet');
      return;
    }

    if (this.isNative) {
      await this.shareInvitation(group);
      return;
    }

    // Not awaited before copying: the copy must start during the click (required by Safari).
    const invitationUrl = this.groupsService.getGroupInvitation(group.id).then(invitation => {
      if (!invitation) throw new Error('No invitation to copy');
      return `${environment.siteUrl}/group/invitations/${invitation}`;
    });

    try {
      await copyToClipboard(invitationUrl);
      this.logger.info('Invitation copied to clipboard');
      this.notificationService.showSuccess(this.translate.instant('notification.invitationCopied'));
    } catch (error) {
      this.logger.error('Error copying group invitation:', error);
      // HTTP errors already get a toast from the error interceptor.
      if (!(error instanceof HttpErrorResponse)) {
        this.notificationService.showError(this.translate.instant('notification.invitationCopyFailed'));
      }
    }
  }

  private async shareInvitation(group: Group): Promise<void> {
    const invitation = await this.groupsService.getGroupInvitation(group.id);
    if (!invitation) {
      return; // HTTP errors already get a toast from the error interceptor.
    }
    try {
      await Share.share({
        title: this.translate.instant('group.shareInvitationTitle'),
        text: this.translate.instant('group.shareInvitationText', { name: group.name }),
        url: `${environment.siteUrl}/group/invitations/${invitation}`,
        dialogTitle: this.translate.instant('group.shareGroupInvitation'),
      });
    } catch (error: any) {
      // Closing the share menu without picking an app also rejects.
      if (!/cancel/i.test(error?.message ?? '')) {
        this.logger.error('Error sharing group invitation:', error);
        this.notificationService.showError(this.translate.instant('notification.genericError'));
      }
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

}
