import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/layout/header/header.component";
import { FooterComponent } from "./components/layout/footer/footer.component";
import { SettingsComponent } from "./components/settings/settings.component";
import { ReportUserModalComponent } from "./components/modals/report-user-modal/report-user-modal.component";
import { ErrorModalComponent } from "./components/error-modal/error-modal.component";
import { LoadingComponent } from "./components/loading/loading.component";
import { LoadingService } from "./services/loading/loading.service";
import { DeepLinkService } from "./services/deep-link/deep-link.service";
import { PushService } from "./services/push/push.service";
import { ConnectivityService } from "./services/connectivity/connectivity.service";
import { ConnectionErrorComponent } from "./components/connection-error/connection-error.component";
import { OpenInAppBannerComponent } from "./components/open-in-app-banner/open-in-app-banner.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ErrorModalComponent, SettingsComponent, ReportUserModalComponent, LoadingComponent, ConnectionErrorComponent, OpenInAppBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sadikoi');
  protected readonly connectivity = inject(ConnectivityService);

  constructor() {
    inject(LoadingService).init();
    inject(DeepLinkService).init();
    inject(PushService).init();
  }
}
