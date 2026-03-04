import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth'; // ← importer ton service

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {

  constructor(private authService: Auth) {} // ← injecter

  logout() {
    this.authService.logout(); // ← utiliser le service directement !
  }
}
