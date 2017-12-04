import { DatabaseService } from '../../services';
import { Component, OnInit, Input, Output, EventEmitter, PipeTransform, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
    constructor(private translate: TranslateService, public database: DatabaseService) { }

    ngOnInit() {}

  onNewOrderNotificationClick () {
    this.database.enableNotificationOnNewOrders();
  }
}
