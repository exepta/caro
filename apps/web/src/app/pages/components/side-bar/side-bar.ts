import {Component, EventEmitter, inject, Output} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {faGear, faHeadphones, faMicrophone} from '@fortawesome/free-solid-svg-icons';
import {UserSettingsService} from '../../../services/user-settings.service';

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

  @Output()
  settingsClick = new EventEmitter<void>();

  onSettingsClick() {
    this.settingsClick.emit();
  }

  protected readonly faGear = faGear;
  protected readonly faMicrophone = faMicrophone;
  protected readonly faHeadphones = faHeadphones;
}
