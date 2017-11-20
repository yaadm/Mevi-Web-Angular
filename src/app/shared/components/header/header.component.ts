import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { DataSnapshot } from 'firebase/database';
import { AngularFireDatabase, AngularFireList, AngularFireObject, AngularFireAction } from 'angularfire2/database';
import { DatabaseService, AuthListener } from '../../services';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy, AuthListener {

    pushRightClass = 'push-right';
    currentUser: DataSnapshot;

    constructor(private translate: TranslateService,
      public router: Router,
      public afAuth: AngularFireAuth,
      public databaseService: DatabaseService,
      public afDb: AngularFireDatabase) {

      this.router.events.subscribe((val) => {
          if (val instanceof NavigationEnd && window.innerWidth <= 992 && this.isToggled()) {
              this.toggleSidebar();
          }
      });

    }

    ngOnInit() {
      this.databaseService.subscribeToAuth(this);
    }

    ngOnDestroy() {
      this.databaseService.unsubscribeFromAuth(this);
    }

    isToggled(): boolean {
        const dom: Element = document.querySelector('body');
        return dom.classList.contains(this.pushRightClass);
    }

    toggleSidebar() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle(this.pushRightClass);
    }

    rltAndLtr() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('rtl');
    }

    changeLang(language: string) {
        this.translate.use(language);
    }

    login() {
      this.databaseService.login();
    }

    logout() {
      this.databaseService.logout();
    }

    onUserChanged(user: DataSnapshot) {
      this.currentUser = user;
    }
}
