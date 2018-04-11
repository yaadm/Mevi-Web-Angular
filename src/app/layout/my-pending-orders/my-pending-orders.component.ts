import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

@Component({
  selector: 'app-my-pending-orders-page',
  templateUrl: './my-pending-orders.component.html',
  styleUrls: ['./my-pending-orders.component.scss'],
  animations: [routerTransition()]
})
export class MyPendingOrdersComponent implements OnInit, OnDestroy, AuthListener {
  items:  Observable<{}[]>;
  itemsArray = [];
  itemsSubscription;
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.database.unsubscribeFromAuth(this);
    this.database.unsubscribe(this.itemsSubscription);
  }

  onUserChanged(user: any) {
    if (user) {
      this.items = this.database.subscribeToMyOrders();
      this.itemsSubscription = this.items.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.reverse().forEach(order => {
            this.updateItemsArray(order);
          });
        });
    } else {
    }
  }

  updateItemsArray (order) {
    if (order.orderStatus === 1) {
      const index = this.itemsArray.indexOf(order, 0);
      if (index !== -1) {
        this.itemsArray[index] = order;
      } else {
        this.itemsArray.push(order);
      }
    } else {
      const index = this.itemsArray.indexOf(order, 0);
      if (index !== -1) {
        this.itemsArray.splice(index, 1);
      }
    }
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
