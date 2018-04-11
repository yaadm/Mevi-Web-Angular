import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  animations: [routerTransition()]
})
export class UserProfileComponent implements OnInit, OnDestroy, AuthListener {
  userId: string;
  userObject: DataSnapshot;
  currentUser: any;
  subscription;
  userObjectObs: Observable<AngularFireAction<DataSnapshot>>;
  constructor(private translate: TranslateService, public database: DatabaseService, private activatedRoute: ActivatedRoute) {
    this.userId = this.activatedRoute.snapshot.params['userId'];
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.database.unsubscribe(this.subscription);
    this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
        this.currentUser = user;
        this.userObjectObs = this.database.subscribeToUserById(this.userId);
        this.subscription = this.userObjectObs.subscribe(
        (afa: AngularFireAction<DataSnapshot>) => {
            this.userObject = afa.payload;
        });
    }
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
