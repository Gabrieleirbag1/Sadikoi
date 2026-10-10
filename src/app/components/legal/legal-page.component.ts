import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface LegalSection {
  heading: string;
  body: string;
}

@Component({
  selector: 'app-legal-page',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.css',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  protected readonly doc = this.route.snapshot.data['doc'] as string;

  protected readonly sections = toSignal(this.translate.stream(`legal.${this.doc}.sections`), { initialValue: [] as LegalSection[] });
  protected readonly list = computed(() => (Array.isArray(this.sections()) ? (this.sections() as LegalSection[]) : []));
}
