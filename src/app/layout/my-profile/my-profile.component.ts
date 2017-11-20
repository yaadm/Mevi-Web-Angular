import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService } from '../../shared';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  animations: [routerTransition()]
})
export class MyProfileComponent {
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
  }


  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
