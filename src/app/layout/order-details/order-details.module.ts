import { NgModule } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { OrderDetailsRoutingModule } from './order-details-routing.module';
import { OrderDetailsComponent, ResolveInsurancePipe, ResolveUnloadingPipe } from './order-details.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { BootstrapModalModule } from 'ngx-bootstrap-modal';
import { AgmCoreModule } from '@agm/core';


import { SuggestionCardModule, ProductCardModule, TruckCardModule, FooterPageModule, SharedModalModuleModule, PageHeaderModule, firebaseConfigDebug, UserRatingModule } from '../../shared';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    OrderDetailsRoutingModule,
    HttpModule,
    ProductCardModule,
    TruckCardModule,
    SuggestionCardModule,
    BootstrapModalModule,
    PageHeaderModule,
    SharedModalModuleModule,
    FooterPageModule,
    UserRatingModule,
    HttpClientModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    }),
    AgmCoreModule.forRoot({
      apiKey: firebaseConfigDebug.apiKey,
      libraries: ['places']
    })
  ],
  declarations: [ OrderDetailsComponent, ResolveInsurancePipe, ResolveUnloadingPipe ],
})
export class OrderDetailsModule { }
