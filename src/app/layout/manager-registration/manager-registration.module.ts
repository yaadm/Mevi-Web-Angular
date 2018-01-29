import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

import { ManagerRegistrationRoutingModule } from './manager-registration-routing.module';
import { ManagerRegistrationComponent } from './manager-registration.component';

import { Http, HttpModule } from '@angular/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BootstrapModalModule } from 'ngx-bootstrap-modal';

import { PageHeaderModule, FooterPageModule, SharedModalModuleModule } from '../../shared';
import { FormsModule } from '@angular/forms';
// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
  imports: [
    CommonModule,
    NgbModule.forRoot(),
    ManagerRegistrationRoutingModule,
    BootstrapModalModule,
    SharedModalModuleModule,
    HttpModule,
    PageHeaderModule,
    FormsModule,
    FooterPageModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
  ],
  declarations: [ ManagerRegistrationComponent ],
  providers: []
})
export class ManagerRegistrationModule { }
