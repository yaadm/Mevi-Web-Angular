import { Component } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-tos-page',
  templateUrl: './tos-page.component.html',
  styleUrls: ['./tos-page.component.scss'],
  animations: [routerTransition()]
})
export class TosPageComponent {
  constructor() {
  }

}
