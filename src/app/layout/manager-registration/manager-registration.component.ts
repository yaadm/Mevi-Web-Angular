import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from '../../shared';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
  selector: 'app-manager-registration',
  templateUrl: './manager-registration.component.html',
  styleUrls: ['./manager-registration.component.scss'],
  animations: [routerTransition()]
})
export class ManagerRegistrationComponent implements OnInit, OnDestroy {
  constructor(private translate: TranslateService, private router: Router, public database: DatabaseService,
      private dialogService: DialogService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  requestPhonePayment() {
    
    const payload = {
      'requestingManager': true
    }
    this.database.updateMyUserData(payload).then(_ => {
      // success
    }, reason => {
      // failure
    });
  }
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }

}
