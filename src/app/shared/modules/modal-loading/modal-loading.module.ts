import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpLoaderFactory } from '../page-header/page-header.module';

import { ModalLoadingComponent } from './modal-loading.component';
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
    declarations: [ModalLoadingComponent],
    exports: [ModalLoadingComponent]
})
export class ModalLoadingModule { }
