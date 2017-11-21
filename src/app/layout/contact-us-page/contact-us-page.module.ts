import { FooterPageModule, SharedModalModuleModule } from '../../shared';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactUsPageRoutingModule } from './contact-us-page-routing.module';
import { ContactUsPageComponent } from './contact-us-page.component';
import { BootstrapModalModule } from 'ng2-bootstrap-modal';

import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    ContactUsPageRoutingModule,
    FooterPageModule,
    BootstrapModalModule,
    SharedModalModuleModule,
    FormsModule
  ],
  declarations: [ContactUsPageComponent]
})
export class ContactUsPageModule { }
