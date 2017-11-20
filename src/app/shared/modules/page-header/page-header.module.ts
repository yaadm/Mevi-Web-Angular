import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

import { PageHeaderComponent } from './page-header.component';
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
    declarations: [PageHeaderComponent],
    exports: [PageHeaderComponent]
})
export class PageHeaderModule { }
