import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';  // chemin vers ton service


@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  username: string ='';
  password: string ='';
  
  constructor(private authService: Auth, private router: Router) {}

  onSubmit(){
     //Elle envoie l’email et le mot de passe de l’utilisateur au serveur pour vérifier ses informations
      this.authService.login(this.username, this.password).subscribe({ 
        next: (reponse: any) => {
          this.authService.setToken(reponse.token);
          //le serveur renvoie un token qui prouve que l’utilisateur est connecté.
          //on sauvegarde le token dans le navigateur pour rester connecté.
          this.router.navigate(['/dashboard']);
          //on redirige l’utilisateur vers la page dashboard.
        },
        error: (error) => {
          console.error('Login echoué', error);
        }
      });
      
    }
}