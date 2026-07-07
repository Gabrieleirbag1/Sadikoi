import { Component, signal } from '@angular/core';
import { GroupsComponent } from "../groups/groups.component";
import { AccountComponent } from "../account/account.component";
import { CommonModule } from '@angular/common';
import { HomeFooterComponent } from "../layout/home-footer/home-footer.component";

@Component({
  selector: 'app-home',
  imports: [GroupsComponent, AccountComponent, HomeFooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent {
  protected homeState = signal<HomeState>('groups');
}