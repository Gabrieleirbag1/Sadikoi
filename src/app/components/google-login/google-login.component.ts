import { Component, inject, NgZone, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { secrets } from '../../../environments/secrets';
import { LoggerService } from '../../services/logger/logger.service';

declare const google: any;

@Component({
  selector: 'app-google-login',
  imports: [],
  templateUrl: './google-login.component.html',
  styleUrl: './google-login.component.css',
})
export class GoogleLoginComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: secrets.googleClientId,
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' }  // customization attributes
    );

    google.accounts.id.prompt(); // also display the One Tap dialog
  }

  handleCredentialResponse(response: any) {
    // response.credential is the JWT token
    this.logger.debug('Encoded JWT ID token: ' + response.credential);

    this.ngZone.run(async () => {
      const success = await this.authService.googleLogin(response.credential);
      if (success) {
        this.router.navigate(['/groups']); // Adjust destination as needed
      }
    });
  }

}