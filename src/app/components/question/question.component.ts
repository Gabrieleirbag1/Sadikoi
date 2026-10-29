import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, inject, model, OnInit, SimpleChanges, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuestionService } from '../../services/question/question.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { ChatComponent } from "../chat/chat.component";
import { TranslatePipe } from '@ngx-translate/core';
import { UserProfileService } from '../../services/user-profile/user-profile.service';
import { WebsocketService } from '../../services/websocket/websocket.service';
import { CalendarComponent } from '../tooltips/calendar/calendar.component';
import { VoteBubbleData, VoteBubblesComponent } from '../vote-bubbles/vote-bubbles.component';
import { ItemImageDisplayComponent } from '../item-image-display/item-image-display.component';
import { ItemAnnouncementModalComponent } from '../modals/item-announcement-modal/item-announcement-modal.component';

/** localStorage key holding the id of the last question whose item announcement was seen in a group. */
const announcementSeenKey = (groupId: number) => `item-announcement-seen-${groupId}`;

@Component({
  selector: 'app-question',
  imports: [CommonModule, ChatComponent, TranslatePipe, CalendarComponent, VoteBubblesComponent, ItemImageDisplayComponent, ItemAnnouncementModalComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css', '../tooltips/user-profile/user-profile-tooltip.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionComponent implements OnInit{
  private readonly logger = inject(LoggerService)
  private readonly questionService = inject(QuestionService);
  private readonly websocketService = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly userProfileService = inject(UserProfileService);
  protected readonly tooltipScope = 'question';
  protected connectedUser: User | null = null;
  protected usersId: number[] = [];
  protected voteBubbles: VoteBubbleData[] = [];
  protected showCalendarFlag = signal(false);
  protected readonly answerText = signal('');
  protected readonly selectedVoteId = signal<number | null>(null);
  /** Today's item announcement, shown once per day and group. */
  protected readonly announcementToShow = signal<ItemAnnouncement | null>(null);
  public readonly question = model<Question | null>(null);
  /** The group's current question, as opposed to `question` which may be a past one picked in the calendar. */
  private readonly currentQuestion = signal<Question | null>(null);
  protected readonly isPastQuestion = computed(() => {
    const current = this.currentQuestion();
    const displayed = this.question();
    return !!current && !!displayed && current.id !== displayed.id;
  });
  public readonly group = model<Group | null>(null);
  /** Post-vote view of answer-input questions: one ball per author, with their answer in a speech bubble. */
  protected readonly answerBubbles = computed<VoteBubbleData[]>(() => {
    const byUser = new Map<number, VoteBubbleData>();
    for (const vote of this.question()?.votes ?? []) {
      if (vote.writtenAnswer) byUser.set(vote.voterUser.id, { votedUser: vote.voterUser, voters: [], answer: vote.writtenAnswer });
    }
    return [...byUser.values()];
  });
  /** Candidates shown on the voting screen: every group member, without voters yet. */
  protected readonly votingBubbles = computed<VoteBubbleData[]>(() => {
    const allowSelf = this.question()?.enableSelfVote;
    return (this.group()?.users ?? [])
      .filter(user => allowSelf || user.id !== this.connectedUser?.id)
      .map(user => ({ votedUser: user, voters: [] }));
  });
  @ViewChild('calendarAnchor') calendarAnchor?: ElementRef<HTMLElement>;

  async ngOnInit(): Promise<void> {
    this.connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
    await this.fetchQuestion();

    this.websocketService.listen<{ question_id: number; votes: Vote[] }>('new_vote').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(payload => {
      if (payload.question_id !== this.question()?.id) {
        return;
      }
      // if the connected user hasn't voted yet, keep them on the voting screen instead of
      // switching them to the vote-bubbles view when other users' votes come in
      const hasVoted = payload.votes.some(vote => vote.voterUser.id === this.connectedUser?.id);
      if (!hasVoted) {
        return;
      }
      this.question.update(q => q ? { ...q, votes: payload.votes } : q);
      this.currentQuestion.update(q => q ? { ...q, votes: payload.votes } : q);
      this.populateVoteBubbles();
    });

    this.websocketService.listen<{ group_id: number }>('new_question').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(payload => {
      if (payload.group_id === this.group()?.id) {
        this.fetchQuestion();
      }
    });

    this.websocketService.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refreshAfterReconnect());
  }

  /** Catches up on what happened while disconnected (new question, votes), without clearing a half-written answer. */
  private async refreshAfterReconnect(): Promise<void> {
    const group = this.group();
    if (!group) return;
    try {
      const latest = await this.questionService.getQuestion(group.id);
      if (latest?.id !== this.currentQuestion()?.id) {
        this.showQuestion(group.id, latest);
        return;
      }
      const viewingPast = this.isPastQuestion();
      this.currentQuestion.set(latest);
      if (!viewingPast) {
        this.question.set(latest);
        this.populateVoteBubbles();
      }
    } catch (error) {
      this.logger.error('Error refreshing question after reconnection:', error);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const question = this.question();
    if (changes['question'] && question) {
      this.populateVoteBubbles();
    }
  }

  private populateVoteBubbles() {
    this.voteBubbles = [];
    for (const vote of this.question()?.votes || []) {
      for (const targetUser of vote.targets) {
        const existingBubble = this.voteBubbles?.find((bubble: VoteBubbleData) => bubble.votedUser.id === targetUser.id);
        if (existingBubble) {
          if (!existingBubble.voters.some(voter => voter.id === vote.voterUser.id)) { // this check prevents duplicate voters in the same bubble
            existingBubble.voters.push(vote.voterUser);
          }
        } else {
          this.voteBubbles?.push({ votedUser: targetUser, voters: [vote.voterUser] });
        }
      }
    }
  }

  protected async fetchQuestion(): Promise<void> {
    try {
      const group = this.group();
      if (!group) throw new Error('Group is not set')
      const question = await this.questionService.getQuestion(group.id);
      this.showQuestion(group.id, question);
    } catch (error) {
      this.logger.error('Error fetching question:', error);
    }
  }

  private showQuestion(groupId: number, question: Question | null): void {
    this.currentQuestion.set(question);
    this.question.set(question);
    this.answerText.set(''); // the answer textarea is recreated empty for a new question
    this.populateVoteBubbles();
    this.showAnnouncementIfUnseen(groupId, question);
    this.logger.debug('Fetched question:', this.question());
  }

  private showAnnouncementIfUnseen(groupId: number, question: Question | null): void {
    if (!question?.announcement) return;
    let seenQuestionId: string | null = null;
    try {
      seenQuestionId = localStorage.getItem(announcementSeenKey(groupId));
    } catch {
      // storage unavailable: show the announcement anyway
    }
    if (seenQuestionId !== String(question.id)) {
      this.announcementToShow.set(question.announcement);
    }
  }

  protected closeAnnouncement(): void {
    this.announcementToShow.set(null);
    const groupId = this.group()?.id;
    const questionId = this.currentQuestion()?.id;
    if (groupId == null || questionId == null) return;
    try {
      localStorage.setItem(announcementSeenKey(groupId), String(questionId));
    } catch {
      // storage unavailable: the announcement will show again next time
    }
  }

  protected async submitVote(votedUsersId: number[], writtenAnswer?: string): Promise<void> {
    try {
      if (!this.question()) throw new Error('No question available to vote on');
      const group = this.group();
      if (!group) throw new Error('No group available for voting');
      const response = await this.questionService.submitVote(group.id, votedUsersId, writtenAnswer);
      if (response) {
        this.question.update(q => q ? { ...q, votes: response } : q);
        this.populateVoteBubbles();
        this.logger.debug('Vote submitted successfully', response);
      }
      if (response) this.question.update(q => q ? { ...q, votes: response } : q);
    } catch (error) {
      this.logger.error('Error submitting vote:', error);
    }
  }

  /** Go back to the group's current question (calendar "Today" / "Clear"). */
  protected showCurrentQuestion(): void {
    this.question.set(this.currentQuestion());
    this.populateVoteBubbles();
  }

  protected toggleVote(userId: number): void {
    if (this.usersId.includes(userId)) {
      this.usersId = this.usersId.filter(id => id !== userId);
    } else {
      this.usersId.push(userId);
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.showCalendarFlag() && !this.calendarAnchor?.nativeElement.contains(event.target as Node)) {
      this.showCalendarFlag.set(false);
    }
  }

  protected showCalendar(): void {
    this.showCalendarFlag.update(isOpen => !isOpen);
  }

}
