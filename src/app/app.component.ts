import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // (optional)
})
export class AppComponent implements OnInit {
  themeLabel = 'Green';
  constructor(private theme: ThemeService) {}

  ngOnInit() {
    this.theme.init('theme-green');
    this.themeLabel = this.theme.label();
  }
  toggleTheme() {
    this.theme.toggle();
    this.themeLabel = this.theme.label();
  }
}
