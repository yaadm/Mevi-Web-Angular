import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './shared';
import { DatabaseService, firebaseConfigDebug } from './shared';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

export const firebaseConfig = {
    apiKey: 'AIzaSyC7OHQrPLQP0DpQ5ZpBMJM4NW2H4E55Oo8',
    authDomain: 'objective-ltd.firebaseapp.com',
    databaseURL: 'https://objective-ltd.firebaseio.com',
    projectId: 'objective-ltd',
    storageBucket: 'objective-ltd.appspot.com',
    messagingSenderId: '336908932713'
};

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
    // for development
    // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
    return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [Http]
            }
        }),
        AngularFireModule.initializeApp(firebaseConfigDebug),
        AngularFireDatabaseModule,
        AngularFireAuthModule
    ],
    providers: [
      AuthGuard,
      DatabaseService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
