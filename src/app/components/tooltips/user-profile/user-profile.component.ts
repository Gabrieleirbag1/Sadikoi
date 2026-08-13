import { Component, model } from '@angular/core';
import { ProfileImagePickerComponent } from "../../profile-image-picker/profile-image-picker.component";

@Component({
  selector: 'app-user-profile',
  imports: [ProfileImagePickerComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent {
  public readonly user = model<User | null>(null);
}
