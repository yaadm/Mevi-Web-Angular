import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyNewOrdersRoutingModule } from './my-new-orders-routing.module';
import { MyNewOrdersComponent } from './my-new-orders.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { OrderCardModule, FooterPageModule } from '../../shared';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    MyNewOrdersRoutingModule,
    HttpModule,
    OrderCardModule,
    FooterPageModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
  ],
  declarations: [ MyNewOrdersComponent ],
  providers: []
})
export class MyNewOrdersModule { }
