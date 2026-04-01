import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './check-email.html',
  styleUrl: './check-email.scss'
})
export class CheckEmailComponent {
  email: string = '';

  constructor(private route: ActivatedRoute) {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }
}