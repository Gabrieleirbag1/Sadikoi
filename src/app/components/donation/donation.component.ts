import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings/settings.service';

/** Donation modal (PayPal / Buy Me a Coffee), opened from the settings. Escape is handled by SettingsComponent. */
@Component({
  selector: 'app-donation',
  imports: [TranslatePipe],
  templateUrl: './donation.component.html',
  styleUrl: './donation.component.css',
})
export class DonationComponent {
  protected readonly settings = inject(SettingsService);

  protected close(): void {
    this.settings.closeDonation();
  }
}
