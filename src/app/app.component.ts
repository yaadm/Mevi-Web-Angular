import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private translate: TranslateService) {

    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');

    const dom: any = document.querySelector('body');
    if (!dom.classList.contains('rtl')) {
      dom.classList.add('rtl');
    }
  }

  ngOnInit() { }

}
