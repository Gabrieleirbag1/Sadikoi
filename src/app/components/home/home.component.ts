import { Component } from '@angular/core';
import { GroupsComponent } from "../groups/groups.component";

@Component({
  selector: 'app-home',
  imports: [GroupsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent {}
