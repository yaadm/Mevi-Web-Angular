import { FooterPageModule } from '../../shared';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactUsPageRoutingModule } from './contact-us-page-routing.module';
import { ContactUsPageComponent } from './contact-us-page.component';

@NgModule({
  imports: [
    CommonModule,
    ContactUsPageRoutingModule,
    FooterPageModule
  ],
  declarations: [ContactUsPageComponent]
})
export class ContactUsPageModule { }
