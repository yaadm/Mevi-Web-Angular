import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private router: Router, aroute: ActivatedRouteSnapshot, state: RouterStateSnapshot) { }

    canActivate() {
        if (localStorage.getItem('isLoggedin')) {
            return true;
        }

        // this.router.navigate(['/login']);
        return false;
    }
}
