import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ModalLoadingComponent } from '../../shared/modules/modal-loading/modal-loading.component';
import { DatabaseService } from '../../shared';

@Component({
  selector: 'app-manager-registration',
  templateUrl: './manager-registration.component.html',
  styleUrls: ['./manager-registration.component.scss'],
  animations: [routerTransition()]
})
export class ManagerRegistrationComponent implements OnInit, OnDestroy {
  constructor(private translate: TranslateService, private loadingModal: ModalLoadingComponent, private router: Router, public database: DatabaseService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }

}
