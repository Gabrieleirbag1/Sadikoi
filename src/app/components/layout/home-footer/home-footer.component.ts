import { Component, inject, model, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-footer',
  imports: [],
  templateUrl: './home-footer.component.html',
  styleUrl: './home-footer.component.css',
})
export class HomeFooterComponent implements OnInit {
  protected readonly router = inject(Router);
  public readonly homeState = model<HomeState>('groups');
  public readonly redirect = model<boolean>(false);

  public ngOnInit(): void {
    const saved = sessionStorage.getItem('homeState') as HomeState | null;
    if (saved) this.homeState.set(saved);
  }

  protected changeHomeState(newState: HomeState): void {
    sessionStorage.setItem('homeState', newState);
    this.homeState.set(newState);
    if (this.redirect()) this.redirectToHome();
  }

  private redirectToHome(): void {
    this.router.navigate(['/']);
  }
}