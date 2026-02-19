import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  /*HttpClient → c’est pour envoyer des demandes au serveur (comme demander de se connecter, créer un compte, etc.).

Router → c’est pour changer de page dans l’application Angular.*/
    private apiUrl = 'http://localhost:8080/auth';
    constructor(private http: HttpClient, private router: Router) {}
    login(username: string, password: string): Observable<any>{
        return this.http.post(`${this.apiUrl}/login`, {username, password}); //envoie les infos au serveur backend
    }

      register(username: string, password: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/register`,
      { username, password },
      { responseType: 'text' }  // خاطر response متاع register موش JSON
    );
  }
    /*ça sauvegarde cette clé dans le navigateur 
    pour que l’utilisateur reste connecté même après avoir fermé la page.*/
    setToken(token: string){
      localStorage.setItem('token', token);
    }
    /* Sert à récupérer le token quand tu en as besoin.

    Exemple : pour savoir si l’utilisateur est déjà connecté.*/ 
    getToken(): string | null {
      return localStorage.getItem('token');
    } 
    /*localStorage.removeItem('token') → on supprime le token, donc l’utilisateur n’est plus connecté.

    this.router.navigate(['/login']) → on redirige l’utilisateur vers la page de connexion.
    */ 
    logout(){
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }

}
