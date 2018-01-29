import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagersRegistrationRequestsRoutingModule } from './managers-registration-requests-routing.module';
import { ManagersRegistrationRequestsComponent } from './managers-registration-requests.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BootstrapModalModule } from 'ngx-bootstrap-modal';

import { OrderCardModule, FooterPageModule, SharedModalModuleModule } from '../../shared';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    ManagersRegistrationRequestsRoutingModule,
    HttpModule,
    OrderCardModule,
    FooterPageModule,
    BootstrapModalModule,
    SharedModalModuleModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
  ],
  declarations: [ ManagersRegistrationRequestsComponent ],
  providers: [],
  entryComponents: [ ]
})
export class ManagersRegistrationRequestsModule { }
