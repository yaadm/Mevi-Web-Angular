import { DatabaseService, firebaseConfigDebug } from '../../services';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-order-card',
    templateUrl: './order-card.component.html',
    styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent implements OnInit {
    @Input() public order: any;

    constructor(private translate: TranslateService, public database: DatabaseService) { }

    ngOnInit() {}

    getStaticMapUrl(order: any) {
      const width = 500;
      const pickupLat = order.pickupLat;
      const pickupLng = order.pickupLng;
      const destinationLat = order.destinationLat;
      const destinationLng = order.destinationLng;
      return 'https://maps.googleapis.com/maps/api/staticmap?size=' + width + 'x' + 200 + '&markers=' + pickupLat + ',' + pickupLng + '&markers=' + destinationLat + ',' + destinationLng + '&key=' + firebaseConfigDebug.apiKey;
    }
}
