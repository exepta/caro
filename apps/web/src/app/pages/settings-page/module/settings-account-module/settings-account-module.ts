import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-account-module',
  imports: [],
  templateUrl: './settings-account-module.html',
  styleUrls: [
    './settings-account-module.scss',
    '../../../../shared/styles/global-settings.scss',
  ],
})
export class SettingsAccountModule {

  acc_edits = [
    { label: 'Displayname', value: 'Exepta' },
    { label: 'Username', value: 'exepta' },
    { label: 'Email', value: 'dev@caro.de' },
    { label: 'Mobil', value: '0179 66753622' },
  ]

}
