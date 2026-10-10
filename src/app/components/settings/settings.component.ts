import { Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings/settings.service';
import { FeedbackComponent } from '../feedback/feedback.component';
import { APP_VERSION, APP_YEAR, CONTACT_EMAIL, KLIPY_URL, MISSCLICK_URL } from './settings.constants';

@Component({
  selector: 'app-settings',
  imports: [RouterLink, TranslatePipe, FeedbackComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  protected readonly settings = inject(SettingsService);

  protected readonly version = APP_VERSION;
  protected readonly year = APP_YEAR;
  protected readonly contactHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly missclickUrl = MISSCLICK_URL;
  protected readonly klipyUrl = KLIPY_URL;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.settings.close();
    this.settings.closeFeedback();
  }

  protected toggleNotifications(): void {
    // TODO: per-group notification preferences.
  }
}
