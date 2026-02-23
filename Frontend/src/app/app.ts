import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './service/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
  private readonly theme = inject(ThemeService);
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['fr', 'en']);

    // Check localStorage preference, else default to 'fr'
    const browserLang = localStorage.getItem('language') || 'fr';
    this.translate.setDefaultLang('fr');
    this.translate.use(browserLang.match(/en|fr/) ? browserLang : 'fr');
  }
}
