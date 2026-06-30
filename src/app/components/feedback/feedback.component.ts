import { Component } from '@angular/core';
import { BugReportComponent } from "./bug-report/bug-report.component";
import { SuggestionComponent } from "./suggestion/suggestion.component";

@Component({
  selector: 'app-feedback',
  imports: [BugReportComponent, SuggestionComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
})
export class FeedbackComponent {}
