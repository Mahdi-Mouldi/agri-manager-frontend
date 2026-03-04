import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  tokenValue: string = '';  // stocke la valeur complète

  constructor(private authService: Auth) {}

  ngOnInit() {
    this.tokenValue = this.authService.getToken() || 'Aucun token';
  }

  logout() {
    this.authService.logout();
  }
}
