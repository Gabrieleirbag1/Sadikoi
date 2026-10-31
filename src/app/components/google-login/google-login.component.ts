import { AfterViewInit, Component, inject, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';
import { secrets } from '../../../environments/secrets';
import { LoggerService } from '../../services/logger/logger.service';
import { LoadingService } from '../../services/loading/loading.service';
import { NotificationService } from '../../services/notification/notification.service';
import { waitForIframe } from '../../services/loading/wait-for-iframe';

declare const google: any;

/** The native plugin is set up once per app launch, on first use. */
let nativeInit: Promise<typeof import('@capgo/capacitor-social-login').SocialLogin> | null = null;

function getNativeSocialLogin() {
  nativeInit ??= import('@capgo/capacitor-social-login').then(async ({ SocialLogin }) => {
    // The web client ID is correct here: the Android client ID is only registered in the Google console.
    await SocialLogin.initialize({ google: { webClientId: secrets.googleClientId } });
    return SocialLogin;
  });
  return nativeInit;
}

@Component({
  selector: 'app-google-login',
  imports: [TranslatePipe],
  templateUrl: './google-login.component.html',
  styleUrl: './google-login.component.css',
})
export class GoogleLoginComponent implements AfterViewInit {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly authService = inject(AuthService);
  private readonly loading = inject(LoadingService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  /** Google blocks its web login inside the app's WebView, so the app uses the native account picker. */
  protected readonly isNative = Capacitor.isNativePlatform();

  // After the view: the button's container is inside an @if block, which doesn't exist yet in ngOnInit.
  ngAfterViewInit(): void {
    if (!this.isNative) {
      this.initializeGoogleSignIn();
    }
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: secrets.googleClientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    const button = document.getElementById('google-signin-button');
    if (button) {
      // The loader stays up until the button's iframe is displayed.
      this.loading.track(waitForIframe(button));
    }
    google.accounts.id.renderButton(
      button,
      { theme: 'outline', size: 'large' }  // customization attributes
    );

    google.accounts.id.prompt(); // also display the One Tap dialog
  }

  handleCredentialResponse(response: any) {
    // response.credential is the JWT token
    this.ngZone.run(() => this.loginWithToken(response.credential));
  }

  protected async nativeLogin(): Promise<void> {
    try {
      const socialLogin = await getNativeSocialLogin();
      // No `scopes`: email and profile are the plugin's defaults, and on Android any `scopes` option is
      // refused unless MainActivity is modified for the plugin ("You CANNOT use scopes...").
      const { result } = await socialLogin.login({ provider: 'google', options: {} });
      const idToken = 'idToken' in result ? result.idToken : null;
      if (!idToken) {
        throw new Error('Google did not return an ID token');
      }
      await this.loginWithToken(idToken);
    } catch (error: any) {
      if (error?.code === 'USER_CANCELLED') {
        return; // The user closed the account picker.
      }
      this.logger.error('Native Google login failed:', error);
      this.notifications.showError(this.translate.instant('notification.genericError'));
    }
  }

  private async loginWithToken(token: string): Promise<void> {
    const success = await this.authService.googleLogin(token);
    if (success) {
      this.authService.redirectAfterLogin();
    }
  }
}
