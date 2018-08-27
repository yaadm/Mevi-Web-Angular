import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserPaymentsComponent } from './user-payments.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpLoaderFactory } from '../page-header/page-header.module';
import { RouterModule } from '@angular/router';
@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule.forRoot({
          loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [Http]
          }
        })
    ],
    declarations: [UserPaymentsComponent],
    exports: [UserPaymentsComponent]
})
export class UserPaymentsModule { }
