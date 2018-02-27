import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRatingComponent } from './user-rating.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpLoaderFactory } from '../page-header/page-header.module';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NgbModule.forRoot(),
        TranslateModule.forRoot({
          loader: {
              provide: TranslateLoader,
              useFactory: HttpLoaderFactory,
              deps: [Http]
          }
        })
    ],
    declarations: [UserRatingComponent],
    exports: [UserRatingComponent]
})
export class UserRatingModule { }
