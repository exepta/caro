import {Component, effect, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TokenService} from './services/token.service';
import {UserService} from './services/user.service';
import {UserSettingsService} from './services/user-settings.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private readonly tokenService = inject(TokenService);
  private readonly userService = inject(UserService);
  private readonly userSettingsService = inject(UserSettingsService);

  constructor() {
    if (this.tokenService.getAccessToken()) {
      this.userService.loadCurrentUser();
    }

    effect(() => {
      const user = this.userService.user();
      if (user) {
        this.userSettingsService.initFromUser(user);
      }
    });
  }

}
