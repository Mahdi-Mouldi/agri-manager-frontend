import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  userName: string = 'Admin User';
  userRole: string = 'Admin';

  get userInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }
}