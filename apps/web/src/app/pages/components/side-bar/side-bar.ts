import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {faGear, faHeadphones, faMicrophone, faServer, faUser, faUserGroup} from '@fortawesome/free-solid-svg-icons';
import {UserSettingsService} from '../../../services/user-settings.service';

export type SideBarSection = 'friends' | 'groups' | 'servers';

@Component({
  selector: 'app-side-bar',
  imports: [FaIconComponent],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.scss',
})
export class SideBar {

  private readonly userSettingsService = inject(UserSettingsService);

  avatarUrl = this.userSettingsService.avatarUrl;
  displayName = this.userSettingsService.displayName;

  @Input({ required: true })
  activeSection!: SideBarSection;

  @Output()
  settingsClick = new EventEmitter<void>();

  @Output()
  sectionChange = new EventEmitter<SideBarSection>();

  onSettingsClick() {
    this.settingsClick.emit();
  }

  onSelectSection(section: SideBarSection) {
    this.sectionChange.emit(section);
  }

  protected readonly faGear = faGear;
  protected readonly faMicrophone = faMicrophone;
  protected readonly faHeadphones = faHeadphones;
  protected readonly faUser = faUser;
  protected readonly faUserGroup = faUserGroup;
  protected readonly faServer = faServer;
}
