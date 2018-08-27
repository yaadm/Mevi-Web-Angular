import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserOrdersRoutingModule } from './user-orders-routing.module';
import { UserOrdersComponent, ResolveStatusPipe } from './user-orders.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { OrderCardModule, FooterPageModule, SideBarModule, PageHeaderModule, UserPaymentsModule } from '../../shared';
import { SharedModalModuleModule } from '../../shared/components';
import { UserPaymentsComponent } from '../../shared/modules/user-payments/user-payments.component';
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
    UserOrdersRoutingModule,
    HttpModule,
    OrderCardModule,
    UserPaymentsModule,
    BootstrapModalModule,
    SharedModalModuleModule,
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
  declarations: [ UserOrdersComponent, ResolveStatusPipe ],
  providers: []
})
export class UserOrdersModule { }
