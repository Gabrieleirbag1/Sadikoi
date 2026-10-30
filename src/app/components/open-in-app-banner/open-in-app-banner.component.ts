import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { appIntentUrl, rememberWeb, shouldOfferApp } from '../../utils/open-in-app';

/**
 * Android browser only: some browsers block opening the app without a tap (see openInAppBeforeStart),
 * so the site offers a button. Closing it keeps the site for the rest of the tab.
 */
@Component({
  selector: 'app-open-in-app-banner',
  imports: [TranslatePipe],
  template: `
    @if (visible()) {
      <div class="open-in-app border" role="region" [attr.aria-label]="'openInApp.text' | translate">
        <img src="icon-192.png" width="36" height="36" alt="" />
        <span class="open-in-app-text">{{ 'openInApp.text' | translate }}</span>
        <button type="button" class="btn-secondary open-in-app-open" (click)="open()">{{ 'openInApp.open' | translate }}</button>
        <button type="button" class="open-in-app-close" [attr.aria-label]="'modal.close' | translate" (click)="close()">&times;</button>
      </div>
    }
  `,
  styleUrl: './open-in-app-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenInAppBannerComponent {
  protected readonly visible = signal(shouldOfferApp());

  protected open(): void {
    // Built at tap time: the page may have changed since the site started.
    window.location.href = appIntentUrl();
  }

  protected close(): void {
    rememberWeb();
    this.visible.set(false);
  }
}
