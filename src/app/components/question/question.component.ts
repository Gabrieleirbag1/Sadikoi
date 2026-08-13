import { ChangeDetectionStrategy, Component, inject, model, OnInit, SimpleChanges } from '@angular/core';
import { QuestionService } from '../../services/question/question.service';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../services/logger/logger.service';
import { ChatComponent } from "../chat/chat.component";
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from "../profile-image-picker/profile-image-picker.component";
import { UserProfileComponent } from '../tooltips/user-profile/user-profile.component';
import { UserProfileService } from '../../services/user-profile/user-profile.service';

interface VoteBubble {
  votedUser: User;
  voters: User[];
}

@Component({
  selector: 'app-question',
  imports: [CommonModule, ChatComponent, TranslatePipe, ProfileImagePickerComponent, UserProfileComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css', '../tooltips/user-profile/user-profile-tooltip.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionComponent implements OnInit{
  private readonly logger = inject(LoggerService)
  private readonly questionService = inject(QuestionService);
  protected readonly userProfileService = inject(UserProfileService);
  protected readonly tooltipScope = 'question';
  protected connectedUser: User | null = null;
  protected usersId: number[] = [];
  protected voteBubbles: VoteBubble[] = [];
  public readonly question = model<Question | null>(null);
  public readonly group = model<Group | null>(null);

  async ngOnInit(): Promise<void> {
    this.connectedUser = JSON.parse(localStorage.getItem('user') || '{}');
    await this.fetchQuestion();
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
        const existingBubble = this.voteBubbles?.find((bubble: VoteBubble) => bubble.votedUser.id === targetUser.id);
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
      this.question.set(question);
      this.populateVoteBubbles();
      this.logger.debug('Fetched question:', this.question());
    } catch (error) {
      this.logger.error('Error fetching question:', error);
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

  protected toggleVote(userId: number): void {
    if (this.usersId.includes(userId)) {
      this.usersId = this.usersId.filter(id => id !== userId);
    } else {
      this.usersId.push(userId);
    }
  }

}
