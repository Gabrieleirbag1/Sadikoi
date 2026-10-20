import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/layout/header/header.component";
import { FooterComponent } from "./components/layout/footer/footer.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { ReportUserModalComponent } from "./components/modals/report-user-modal/report-user-modal.component";
import { ErrorModalComponent } from "./components/error-modal/error-modal.component";
import { LoadingComponent } from "./components/loading/loading.component";
import { LoadingService } from "./services/loading/loading.service";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ErrorModalComponent, SettingsComponent, ReportUserModalComponent, LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sadikoi');

  constructor() {
    inject(LoadingService).init();
  }
}
