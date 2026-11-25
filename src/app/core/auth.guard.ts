import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from './auth.service';
export const authGuard: CanActivateFn = () => inject(Auth).token() ? true : inject(Router).createUrlTree(['/login']);
