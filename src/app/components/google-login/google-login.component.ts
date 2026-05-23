import { Component, NgZone, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-google-login',
  imports: [],
  templateUrl: './google-login.component.html',
  styleUrl: './google-login.component.css',
})
export class GoogleLoginComponent implements OnInit {

     constructor(private ngZone: NgZone, private authService: AuthService, private router: Router) { }

     ngOnInit(): void {
       this.initializeGoogleSignIn();
     }

     initializeGoogleSignIn() {
       google.accounts.id.initialize({
         client_id: environment.googleClientId,
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
       console.log('Encoded JWT ID token: ' + response.credential);

       this.ngZone.run(async () => {
         const success = await this.authService.googleLogin(response.credential);
         if (success) {
           this.router.navigate(['/groups']); // Adjust destination as needed
         }
       });
     }

   }