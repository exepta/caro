import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {SideBar} from '../components/side-bar/side-bar';

@Component({
  selector: 'app-client-view-page',
  imports: [
    SideBar
  ],
  templateUrl: './client-view-page.html',
  styleUrl: './client-view-page.scss',
})
export class ClientViewPage {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  openSettings() {
    void this.router.navigateByUrl('/settings');
  }

  logout() {
    this.authService.logout();
  }
}
