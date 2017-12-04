import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
    @Input() heading: string;
    @Input() parentName: string;
    @Input() parentRouterLink: string;
    @Input() icon: string;

    constructor(private translate: TranslateService) {
      this.setupTranslation(translate);
    }
    private setupTranslation(translate: TranslateService) {
      translate.addLangs(['en', 'iw']);
      translate.setDefaultLang('iw');
      const browserLang = translate.getBrowserLang();
      translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
    }
}
