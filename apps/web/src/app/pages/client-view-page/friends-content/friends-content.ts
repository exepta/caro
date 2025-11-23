import { Component } from '@angular/core';
import {faPlus, faUser} from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-friends-content',
  imports: [
    FaIconComponent
  ],
  templateUrl: './friends-content.html',
  styleUrl: './friends-content.scss',
})
export class FriendsContent {

  protected readonly faUser = faUser;
  protected readonly faPlus = faPlus;
}
