import { Component } from '@angular/core';
import {AuthenticationPage} from './pages/authentication-page/authentication-page';

@Component({
  selector: 'app-root',
  imports: [
    AuthenticationPage
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
