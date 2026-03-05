    import { inject } from '@angular/core';
    import { CanActivateFn, Router } from '@angular/router';

    export const authGuard: CanActivateFn = () => {
    const router = inject(Router);
    const token = localStorage.getItem('token');

    if (token) {
        return true;       // ← token existe → accès autorisé
    }

    router.navigate(['/login']);
    return false;        // ← pas de token → redirige vers login
    };