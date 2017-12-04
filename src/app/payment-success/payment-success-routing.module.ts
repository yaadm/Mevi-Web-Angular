import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success.component';

const routes: Routes = [
    { path: '', component: PaymentSuccessComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentSuccessRoutingModule { }
