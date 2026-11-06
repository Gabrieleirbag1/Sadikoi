import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { SettingsService } from '../../services/settings/settings.service';
import { AuthService } from '../../services/auth/auth.service';
import { HomeTransitionService } from '../../services/home-transition/home-transition.service';
import { FeedbackComponent } from '../feedback/feedback.component';
import { DonationComponent } from '../donation/donation.component';
import { NotificationSettingsComponent } from '../notification-settings/notification-settings.component';
import { APP_VERSION, APP_YEAR, CONTACT_EMAIL, KLIPY_URL, MISSCLICK_URL } from './settings.constants';
import { deviceLanguage, SUPPORTED_LANGUAGES, toSupportedLanguage } from '../../utils/language';

/** Length of the panel's slide-out (same as `.closing` in the CSS). */
const CLOSE_ANIMATION_MS = 200;

@Component({
  selector: 'app-settings',
  imports: [RouterLink, TranslatePipe, FeedbackComponent, DonationComponent, NotificationSettingsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  protected readonly settings = inject(SettingsService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly transitions = inject(HomeTransitionService);

  protected readonly version = APP_VERSION;
  protected readonly year = APP_YEAR;
  protected readonly contactHref = `mailto:${CONTACT_EMAIL}`;
  protected readonly missclickUrl = MISSCLICK_URL;
  protected readonly klipyUrl = KLIPY_URL;

  protected readonly languages = SUPPORTED_LANGUAGES;
  protected readonly language = toSignal(this.translate.onLangChange.pipe(map(event => toSupportedLanguage(event.lang))), {
    initialValue: toSupportedLanguage(this.translate.getCurrentLang()) ?? deviceLanguage(),
  });

  /** The panel is sliding out: it stays on screen until the animation ends. */
  protected readonly closing = signal(false);
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.closeTimer));
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.settings.isOpen()) this.close();
    this.settings.closeFeedback();
    this.settings.closeDonation();
  }

  /** Slides the panel out, then runs `then` (so the next page doesn't show up under a panel still moving). */
  protected close(then?: () => void): void {
    if (this.closing()) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.settings.close();
      then?.();
      return;
    }
    this.closing.set(true);
    this.closeTimer = setTimeout(() => {
      this.closing.set(false);
      this.settings.close();
      then?.();
    }, CLOSE_ANIMATION_MS);
  }

  protected openProfile(): void {
    this.close(() => {
      document.querySelector('.main-content')?.scrollTo({ top: 0 });
      // Home and group pages switch to the profile tab themselves; any other page goes back home on it.
      if (this.settings.openProfile()) return;
      sessionStorage.setItem('homeState', 'account');
      this.transitions.mark('account');
      this.router.navigate(['/']);
    });
  }

  /** The logout page, where the user confirms and chooses whether to forget this device. */
  protected openLogout(): void {
    this.close(() => this.router.navigate(['/auth']));
  }

  protected async changeLanguage(value: string): Promise<void> {
    const language = toSupportedLanguage(value);
    const previous = this.language();
    if (!language || language === previous) return;
    this.translate.use(language);
    // Logged in: saved on the account (the questions come in that language). If that fails, the app goes
    // back to the account's language, so the questions and the rest of the app never differ.
    if (this.authService.isAuthenticated() && !(await this.authService.updateLanguage(language)) && previous) {
      this.translate.use(previous);
    }
  }
}
