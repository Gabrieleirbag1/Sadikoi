import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConnectivityService } from '../../services/connectivity/connectivity.service';

/** Shown instead of the page while the API can't be reached (see ConnectivityService). */
@Component({
  selector: 'app-connection-error',
  imports: [TranslatePipe],
  templateUrl: './connection-error.component.html',
  styleUrl: './connection-error.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionErrorComponent {
  protected readonly connectivity = inject(ConnectivityService);

  /** 'offline' | 'poor' | 'server' (never 'ok': the screen isn't shown then). */
  protected readonly kind = computed(() => {
    const status = this.connectivity.status();
    return status === 'ok' ? 'server' : status;
  });

  protected retry(): void {
    this.connectivity.retry();
  }
}
