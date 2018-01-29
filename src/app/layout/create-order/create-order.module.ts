import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CreateOrderRoutingModule } from './create-order-routing.module';
import { CreateOrderComponent } from './create-order.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { BootstrapModalModule } from 'ngx-bootstrap-modal';

import { SuggestionCardModule } from '../../shared';

import { NgxStepperModule } from 'ngx-stepper';

import { AgmCoreModule } from '@agm/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ProductCardModule, firebaseConfigDebug, FooterPageModule, SharedModalModuleModule, PageHeaderModule } from '../../shared';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    CreateOrderRoutingModule,
    HttpModule,
    ProductCardModule,
    SuggestionCardModule,
    FooterPageModule,
    BootstrapModalModule,
    SharedModalModuleModule,
    PageHeaderModule,
    NgxStepperModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    }),
    AgmCoreModule.forRoot({
      apiKey: firebaseConfigDebug.apiKey,
      libraries: ['places'],
      language: 'iw'
    }),
    FormsModule,
    ReactiveFormsModule,
    NgbModule.forRoot()
  ],
  declarations: [ CreateOrderComponent ],
  providers: [  ],
  entryComponents: [ ]
})
export class CreateOrderModule { }
