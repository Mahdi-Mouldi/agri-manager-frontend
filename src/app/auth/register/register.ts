import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../auth'; // نفس service اللي استعملتو في login

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: Auth, private router: Router) {}

  onSubmit() {
    this.authService.register(this.username, this.password).subscribe({
      next: (reponse: any) => {
        console.log('Register OK', reponse);
        // بعد التسجيل نمشيو للـ login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Register echoué', error);
      }
    });
  }
}
