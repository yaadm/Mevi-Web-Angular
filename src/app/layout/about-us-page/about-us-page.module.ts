import { FooterPageModule } from '../../shared';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutUsPageRoutingModule } from './about-us-page-routing.module';
import { AboutUsPageComponent } from './about-us-page.component';

@NgModule({
  imports: [
    CommonModule,
    AboutUsPageRoutingModule,
    FooterPageModule
  ],
  declarations: [AboutUsPageComponent]
})
export class AboutUsPageModule { }
