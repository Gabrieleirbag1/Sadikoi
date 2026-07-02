import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from "./components/modals/modal/modal.component";
import { HeaderComponent } from "./components/layout/header/header.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ModalComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sadikoi');
}
