import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyPendingDeliveriesRoutingModule } from './my-pending-deliveries-routing.module';
import { MyPendingDeliveriesComponent } from './my-pending-deliveries.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { OrderCardModule, FooterPageModule, SideBarModule, PageHeaderModule } from '../../shared';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    MyPendingDeliveriesRoutingModule,
    HttpModule,
    OrderCardModule,
    FooterPageModule,
    PageHeaderModule,
    SideBarModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
  ],
  declarations: [ MyPendingDeliveriesComponent ],
  providers: []
})
export class MyPendingDeliveriesModule { }
