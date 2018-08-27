import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ChartsModule as Ng2Charts } from 'ng2-charts';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

import { SuggestionCardModule, FooterPageModule, PageHeaderModule, SharedModalModuleModule } from '../../shared';
import { BootstrapModalModule } from 'ngx-bootstrap-modal';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    HomeRoutingModule,
    HttpModule,
    SuggestionCardModule,
    SharedModalModuleModule,
    BootstrapModalModule,
    FooterPageModule,
    PageHeaderModule,
    Ng2Charts,
    NgbCarouselModule.forRoot(),
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
  ],
  declarations: [ HomeComponent ]
})
export class HomeModule { }
