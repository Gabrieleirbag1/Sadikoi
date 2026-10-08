import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProfileImagePickerComponent } from "../../profile-image-picker/profile-image-picker.component";

import { ItemImageDisplayComponent } from '../../item-image-display/item-image-display.component';

@Component({
  selector: 'app-user-profile',
  imports: [ProfileImagePickerComponent, ItemImageDisplayComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  public readonly user = input<User | null>(null);
}
