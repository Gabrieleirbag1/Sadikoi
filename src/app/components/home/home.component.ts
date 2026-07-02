import { Component, OnInit } from '@angular/core';
import { GroupsComponent } from "../groups/groups.component";
import { AccountComponent } from "../account/account.component";
import { FeedbackComponent } from "../feedback/feedback.component";
import { CommonModule } from '@angular/common';

type HomeState = 'groups' | 'account';
@Component({
  selector: 'app-home',
  imports: [GroupsComponent, AccountComponent, FeedbackComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent implements OnInit {
  protected homeState = 'groups'

  public ngOnInit(): void {
    const homeState = sessionStorage.getItem('homeState') as HomeState || 'groups';
    this.changeHomeState(homeState);
  }

  protected changeHomeState(newState: HomeState): void {
    sessionStorage.setItem('homeState', newState);
    this.homeState = newState;
  }

}
