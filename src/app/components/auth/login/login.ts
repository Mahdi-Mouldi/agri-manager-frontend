import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private authService: Auth, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (reponse: any) => {
        this.authService.setToken(reponse.token);
        this.loading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error || 'Email ou mot de passe incorrect.';
        console.error('Login échoué', error);
      }
    });
  }
}