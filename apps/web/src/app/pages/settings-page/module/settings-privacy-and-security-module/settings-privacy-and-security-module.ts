import { Component } from '@angular/core';
import {SwitchButton} from '../../../../controls/switch-button/switch-button';

@Component({
  selector: 'app-settings-privacy-and-security-module',
  imports: [
    SwitchButton
  ],
  templateUrl: './settings-privacy-and-security-module.html',
  styleUrls: [
    './settings-privacy-and-security-module.scss',
    '../../../../shared/styles/global-settings.scss',
  ],
})
export class SettingsPrivacyAndSecurityModule {

  firstNameVisible = false;
  lastNameVisible = false;
}
