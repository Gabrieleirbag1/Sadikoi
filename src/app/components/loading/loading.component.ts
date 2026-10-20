import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingService } from '../../services/loading/loading.service';

/** Full-screen loader shown during slow navigations. Styles live in src/loading.css (shared with the boot loader). */
@Component({
  selector: 'app-loading',
  imports: [TranslatePipe],
  templateUrl: './loading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  protected readonly loading = inject(LoadingService);
}
