import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalConfirmComponent } from '../../shared';
import { ModalInputComponent } from '../../shared/components';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AuthListener } from '../../shared/services';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DialogService } from 'ngx-bootstrap-modal';
import * as firebase from 'firebase';

@Pipe({name: 'resolveStatus'})
export class ResolveStatusPipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'חדש';
      case 1:
        return 'ממתין';
      case 2:
        return 'הושלם';
       case 3:
        return 'בוטל';
       case 4:
        return 'נמחק';
    }
    return 'לא ידוע';
  }
}

@Component({
  selector: 'app-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss'],
  animations: [routerTransition()]
})
export class UserOrdersComponent implements OnInit, OnDestroy, AuthListener {
  orders:  Observable<{}[]>;
  deliveries:  Observable<{}[]>;
  ordersArray = [];
  deliveriesArray = [];
  ordersSubscription;
  deliveriesSubscription;
  userId;
  userSnapshot: DataSnapshot;
  
  @ViewChild('paymentAmount')
  public paymentAmountRef: ElementRef;
  
  @ViewChild('paymentReceipt')
  public paymentReceiptRef: ElementRef;
  
  @ViewChild('paymentAdditionalInfo')
  public paymentAdditionalInfoRef: ElementRef;
  
  constructor(private translate: TranslateService, public database: DatabaseService, private activatedRoute: ActivatedRoute
      , private dialogService: DialogService) {
    this.setupTranslation(translate);
    this.userId = this.activatedRoute.snapshot.params['userId'];
    if (this.userId) {
      console.log('userId: ' + this.userId);
      
      database.subscribeToAuth(this);
    } else {
      console.log('userId is null !');
    }
  }

  ngOnInit() {
    
    
  }

  ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
      this.database.unsubscribe(this.ordersSubscription);
      this.database.unsubscribe(this.deliveriesSubscription);
  }

  onUserChanged(user: any) {
    if (user) {
      
      this.database.getUserById(this.userId).subscribe(
      (afa: AngularFireAction<DataSnapshot>) => {
          this.userSnapshot = afa.payload;
      });
      
      this.orders = this.database.subscribeToUserOrders(this.userId);
      this.ordersSubscription = this.orders.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.reverse().forEach(order => {
            
              this.updateOrdersArray(order);
          });
        });
      
      this.deliveries = this.database.subscribeToUserDeliveries(this.userId);
      this.deliveriesSubscription = this.deliveries.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.reverse().forEach(order => {
            
              this.updateDeliveriesArray(order);
          });
        });
    } else {
      this.database.unsubscribeFromAuth(this);
    }
  }

  updateOrdersArray (order) {
    const index = this.ordersArray.indexOf(order, 0);
    if (index !== -1) {
      this.ordersArray[index] = order;
    } else {
      this.ordersArray.push(order);
    }
  }
  
  updateDeliveriesArray (order) {
    const index = this.deliveriesArray.indexOf(order, 0);
    if (index !== -1) {
      this.deliveriesArray[index] = order;
    } else {
      this.deliveriesArray.push(order);
    }
  }
  
  reportUserPayment() {
    
    if (this.paymentAmountRef.nativeElement.value <= 0) {
      
      this.showInfoDialog('שגיאה', 'חובה להזין סכום חיובי');
      return;
    } else if (this.paymentReceiptRef.nativeElement.value === '') {
      
      this.showInfoDialog('שגיאה', 'חובה להזין מספר חשבונית');
      return;
    }
    
    const user = this.userSnapshot.val();
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'דווח על תשלום', 
      message: 'האם אתה בטוח שברצונך ללדווח על תשלום של ' + this.paymentAmountRef.nativeElement.value + ' ש"ח ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
            'paymentAmountInNIS' : parseInt(this.paymentReceiptRef.nativeElement.value, 10),
            'receiptNumber' : this.paymentReceiptRef.nativeElement.value,
            'receiptLink' : '',
            'timestamp' : firebase.database.ServerValue.TIMESTAMP,
            'note' : this.paymentAdditionalInfoRef.nativeElement.value ? this.paymentAdditionalInfoRef.nativeElement.value : ''
          }
          
          this.database.addUserPayment(user.uid, payload).then(_ => {
            // on success
            
            this.showInfoDialog('הצלחה', 'תשלום דווח בהצלחה');
          }, reason => {
            // on reject
            this.showInfoDialog('נכשל', 'לא הצלחנו לדווח על התשלום, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  showInfoDialog (modalTitle, moadlMessage) {
    this.dialogService.addDialog(ModalInformComponent, {
      title: modalTitle,
      message: moadlMessage})
      .subscribe((success) => {
          if (success) {

          } else {
          }
      });
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
