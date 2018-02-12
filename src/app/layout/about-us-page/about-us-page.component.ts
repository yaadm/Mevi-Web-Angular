import { routerTransition } from '../../router.animations';
import { firebaseConfigDebug } from '../../shared';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
    animations: [routerTransition()]
})
export class AboutUsPageComponent implements OnInit {
    constructor() {
    }

    ngOnInit() {
    }
  
  getStaticMapUrl() {
    const width = 500;
    const pickupLat = 31.658314;
    const pickupLng = 34.620346;
    return 'https://maps.googleapis.com/maps/api/staticmap?size=' + width + 'x' + 200 + '&markers=' + pickupLat + ',' + pickupLng  + '&zoom=12' + '&language=iw&key=' + firebaseConfigDebug.apiKey;
  }
}
