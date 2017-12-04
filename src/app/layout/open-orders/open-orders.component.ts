import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

@Component({
  selector: 'app-open-orders-page',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.scss'],
  animations: [routerTransition()]
})
export class OpenOrdersComponent implements OnInit, OnDestroy, AuthListener {
  items:  Observable<AngularFireAction<DataSnapshot>[]>;
  itemsArray = [];
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
      this.items = this.database.subscribeToOpenedOrders();
      this.items.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.reverse().forEach(order => {
            this.updateItemsArray(order);
          });
        });
    } else {
      this.database.unsubscribeFromAuth(this);
    }
  }

  updateItemsArray (order) {
    
    const myUid = this.database.getCurrentUser().child('uid').val();
    if (order.userId !== myUid) {
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
