import {Component, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {SideBar, SideBarSection} from '../components/side-bar/side-bar';
import {FriendsContent} from './friends-content/friends-content';
import {GroupsContent} from './groups-content/groups-content';
import {ServersContent} from './servers-content/servers-content';

@Component({
  selector: 'app-client-view-page',
  imports: [
    SideBar,
    FriendsContent,
    GroupsContent,
    ServersContent
  ],
  templateUrl: './client-view-page.html',
  styleUrl: './client-view-page.scss',
})
export class ClientViewPage {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  currentSection = signal<SideBarSection>('friends');

  openSettings() {
    void this.router.navigateByUrl('/settings');
  }

  logout() {
    this.authService.logout();
  }

  onSectionChange(section: SideBarSection) {
    this.currentSection.set(section);
  }

  protected readonly sectionValues = {
    friends: 'friends' as SideBarSection,
    groups: 'groups' as SideBarSection,
    servers: 'servers' as SideBarSection,
  };
}
