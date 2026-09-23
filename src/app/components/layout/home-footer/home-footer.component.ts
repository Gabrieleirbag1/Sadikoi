import { Component, inject, input, model, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-footer',
  imports: [TranslatePipe],
  templateUrl: './home-footer.component.html',
  styleUrl: './home-footer.component.css',
})
export class HomeFooterComponent implements OnInit {
  protected readonly router = inject(Router);
  public readonly homeState = model<HomeState>('groups');
  public readonly redirect = model<boolean>(false);
  public readonly groupId = input<number | null>(null);

  public ngOnInit(): void {
    if (this.homeState() === 'group') return;

    const saved = sessionStorage.getItem('homeState') as HomeState | null;
    if (saved) this.homeState.set(saved);
  }

  protected changeHomeState(newState: HomeState): void {
    if (newState === 'account' && this.homeState() === 'group') {
      const groupId = this.groupId();
      if (groupId !== null) sessionStorage.setItem('pendingGroupId', String(groupId));
    }

    if (newState === 'groups') {
      const pendingGroupId = sessionStorage.getItem('pendingGroupId');
      sessionStorage.removeItem('pendingGroupId');

      if (pendingGroupId) {
        this.homeState.set(newState);
        this.router.navigate(['/group', pendingGroupId]);
        return;
      }
    }

    sessionStorage.setItem('homeState', newState);
    this.homeState.set(newState);
    if (this.redirect()) this.redirectToHome();
  }

  private redirectToHome(): void {
    this.router.navigate(['/']);
  }
}