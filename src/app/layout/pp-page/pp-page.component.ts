import { Component } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pp-page',
  templateUrl: './pp-page.component.html',
  styleUrls: ['./pp-page.component.scss'],
  animations: [routerTransition()]
})
export class PpPageComponent {
  constructor() {
  }

}
