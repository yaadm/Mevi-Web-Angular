import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentSuccessRoutingModule } from './payment-success-routing.module';
import { PaymentSuccessComponent } from './payment-success.component';

@NgModule({
  imports: [
    CommonModule,
    PaymentSuccessRoutingModule
  ],
  declarations: [PaymentSuccessComponent]
})
export class PaymentSuccessModule { }
