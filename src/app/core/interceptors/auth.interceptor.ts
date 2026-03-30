  /*Ce code est un intercepteur HTTP.

Son rôle principal : avant d’envoyer chaque requête au serveur, il vérifie si l’utilisateur a un token dans le navigateur.

Si le token existe : il l’ajoute automatiquement dans l’en-tête Authorization de la requête pour prouver que l’utilisateur est connecté.

Si le token n’existe pas : il laisse la requête normale partir sans rien changer.*/



import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`  // ✅ Corrigé : Bearer (pas Barer) et ${} (pas $())
      }
    });
    return next(authReq);
  }

  return next(req);
};