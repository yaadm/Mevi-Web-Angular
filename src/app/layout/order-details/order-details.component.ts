import { Component, OnInit, OnDestroy, ViewEncapsulation, PipeTransform, Pipe } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { AuthListener } from '../../shared/services';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

@Pipe({name: 'resolveInsurance'})
export class ResolveInsurancePipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'ללא ביטוח';
      case 50:
        return 'עד 50 אלף שח';
      case 100:
        return 'עד 100 אלף שח';
       case 500:
        return 'עד 500 אלף שח';
       case 1:
        return 'עד מליון  שח';
       case 2:
        return 'מעל למליון  שח';
    }
    return 'לא ידוע';
  }
}

@Pipe({name: 'resolveUnloading'})
export class ResolveUnloadingPipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'עצמאי';
      case 1:
        return 'מלגזה';
      case 2:
        return 'עגורן';
       case 3:
        return 'מנוף';
       case 4:
        return 'דלת הידראולית';
       case 5:
        return 'ראמפה';
    }
    return 'לא ידוע';
  }
}

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  animations: [routerTransition()]
})
export class OrderDetailsComponent implements OnInit, OnDestroy, AuthListener {
  orderId = '';
  order: Observable<any>;
  orderSubscription: any;
  currentOrder: any;
  currentOrderSnapshot: DataSnapshot;
  bidsArray: Array<any>;
  myBid: any;
  today = new Date().getTime();
  constructor(private translate: TranslateService, private activatedRoute: ActivatedRoute, public database: DatabaseService, private router: Router) {
    this.setupTranslation(translate);
    this.orderId = this.activatedRoute.snapshot.params['orderId'];
    if (this.orderId) {
      console.log('orderId: ' + this.orderId);
      database.subscribeToAuth(this);
    } else {
      console.log('orderId is null !');
    }
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    if (this.orderSubscription) {
      this.orderSubscription.unsubscribe();
    }
    this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
      this.order = this.database.subscribeToOrder(this.orderId);
      this.orderSubscription = this.order.subscribe(
        (afa: AngularFireAction<DataSnapshot>) => {
          this.currentOrder = afa.payload.val();
          this.currentOrderSnapshot = afa.payload;
          const myUid = user.child('uid').val();

          try {
            this.myBid = afa.payload.child('bidsList').child(myUid).val()
          } catch (e) {}

          this.bidsArray = [];
          const now = new Date().getTime();
          afa.payload.child('bidsList').forEach(item => {
            const itemPayload = item.val();

            // remove expired bids
            if (itemPayload.expirationDate === undefined || itemPayload.expirationDate > now) {
              this.bidsArray.push(itemPayload);
            }
          });
        });
      this.database.addSubscription(this.orderSubscription);
    } else {

      if (this.orderSubscription) {
        this.orderSubscription.unsubscribe();
      }
      this.currentOrder = undefined;
    }
  }

  getStaticMapUrl(order: DataSnapshot) {
    const width = 500;
    const pickupLat = order.pickupLat;
    const pickupLng = order.pickupLng;
    const destinationLat = order.destinationLat;
    const destinationLng = order.destinationLng;
    return 'https://maps.googleapis.com/maps/api/staticmap?size=' + width + 'x' + 200 + '&markers=' + pickupLat + ',' + pickupLng + '&markers=' + destinationLat + ',' + destinationLng + '&key=' + firebaseConfigDebug.apiKey;
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
