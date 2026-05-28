import { Component } from '@angular/core';
import { GroupsComponent } from "../groups/groups.component";
import { AccountComponent } from "../account/account.component";
import { JoinGroupComponent } from '../join-group/join-group.component';

@Component({
  selector: 'app-home',
  imports: [GroupsComponent, JoinGroupComponent, AccountComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent {}
