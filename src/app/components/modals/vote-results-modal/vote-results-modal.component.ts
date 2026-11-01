import { ChangeDetectionStrategy, Component, computed, HostListener, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileImagePickerComponent } from '../../profile-image-picker/profile-image-picker.component';
import { buildVoteResults, isDuoQuestion } from '../../vote-results/vote-results';

/** Plain list of the votes, opened from the bubbles: one line per voted member (or pair, for a duo) with its voters. */
@Component({
  selector: 'app-vote-results-modal',
  imports: [TranslatePipe, ProfileImagePickerComponent],
  templateUrl: './vote-results-modal.component.html',
  styleUrl: './vote-results-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteResultsModalComponent {
  public readonly question = input.required<Question>();
  public readonly closed = output<void>();

  protected readonly isDuo = computed(() => isDuoQuestion(this.question()));
  protected readonly rows = computed(() => buildVoteResults(this.question().votes ?? [], this.isDuo()));

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }
}
