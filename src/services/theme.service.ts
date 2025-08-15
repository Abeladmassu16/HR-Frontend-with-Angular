import { Injectable } from '@angular/core';

type ThemeName = 'theme-green' | 'theme-white';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private current: ThemeName = 'theme-green';

  init(defaultTheme: ThemeName = 'theme-green') {
    this.set(defaultTheme);
  }

  set(theme: ThemeName) {
    this.current = theme;
    const root = document.documentElement;
    root.classList.remove('theme-green', 'theme-white');
    root.classList.add(theme);
  }

  toggle() {
    this.set(this.current === 'theme-green' ? 'theme-white' : 'theme-green');
  }

  label(): string {
    return this.current === 'theme-green' ? 'Green' : 'White';
  }
}
