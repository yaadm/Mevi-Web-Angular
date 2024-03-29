import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared';

const routes: Routes = [
    {
        path: '',
        loadChildren: './layout/layout.module#LayoutModule'
    },
    {
      path: 'login',
      loadChildren: './login/login.module#LoginModule',
      canActivate: [AuthGuard]
    },
    { path: 'signup', loadChildren: './signup/signup.module#SignupModule' },
    { path: 'payment-success', loadChildren: './payment-success/payment-success.module#PaymentSuccessModule' },
    { path: 'not-found', loadChildren: './not-found/not-found.module#NotFoundModule' },
    { path: '**', redirectTo: 'not-found' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
