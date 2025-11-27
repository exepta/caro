import {Component, effect, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TokenService} from './services/auth/token.service';
import {UserService} from './services/user/user.service';
import {UserSettingsService} from './services/user/user-settings.service';
import {CallModalComponent} from './pages/components/call-modal/call-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CallModalComponent
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
