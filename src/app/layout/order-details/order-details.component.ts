import { Component, OnInit, OnDestroy, ViewEncapsulation, PipeTransform, Pipe, ViewChild, ElementRef, isDevMode } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { TranslateService } from '@ngx-translate/core';
import {} from '@types/googlemaps';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { ModalConfirmComponent } from '../../shared/components/modal-confirm/modal-confirm.component';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { ModalInputComponent } from '../../shared/components/modal-input/modal-input.component';
import { AuthListener } from '../../shared/services';
import { MapsAPILoader } from '@agm/core';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import * as firebase from 'firebase';
import { DialogService } from 'ngx-bootstrap-modal';
import { HttpClient } from '@angular/common/http';

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
  isDevMod = false;
  orderId = '';
  order: Observable<any>;
  orderSubscription: any;
  currentOrder: any;
  currentOrderSnapshot: DataSnapshot;
  bidsArray: Array<any>;
  myBid: any;
  today = new Date().getTime();
  distance: string;
  duration: string;
  
  loadingSetBid = false;
  loadingDeleteBid = false;
  loadingAcceptBid = false;
  
  @ViewChild('checkboxAgreement')
  public checkboxAgreementRef: ElementRef;
  @ViewChild('bidAmount')
  public bidAmountRef: ElementRef;
  @ViewChild('bidDate')
  public bidDateRef: ElementRef;
  @ViewChild('bidTime')
  public bidTimeRef: ElementRef;
  @ViewChild('bidExpiration')
  public bidExpirationRef: ElementRef;
  @ViewChild('checkboxExpiration')
  public checkboxExpirationRef: ElementRef;
  @ViewChild('checkboxPaymentCash')
  public checkboxPaymentCashRef: ElementRef;
  @ViewChild('checkboxPaymentCredit')
  public checkboxPaymentCreditRef: ElementRef;
  @ViewChild('checkboxPaymentWire')
  public checkboxPaymentWireRef: ElementRef;
  @ViewChild('checkboxPaymentCheck')
  public checkboxPaymentCheckRef: ElementRef;
  
  constructor(private translate: TranslateService, private activatedRoute: ActivatedRoute, public database: DatabaseService, 
      private router: Router, private dialogService: DialogService, private mapsAPILoader: MapsAPILoader) {
    this.setupTranslation(translate);
    this.orderId = this.activatedRoute.snapshot.params['orderId'];
    if (this.orderId) {
      console.log('orderId: ' + this.orderId);
      database.subscribeToAuth(this);
    } else {
      console.log('orderId is null !');
    }
    this.isDevMod = isDevMode();
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
            if (itemPayload.expirationDate === undefined || itemPayload.expirationDate === 0 || itemPayload.expirationDate > now) {
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
  
  isAnyPaymentMethodChecked () {
    
    return (this.checkboxPaymentCashRef && this.checkboxPaymentCashRef.nativeElement.checked) || 
      (this.checkboxPaymentCreditRef && this.checkboxPaymentCreditRef.nativeElement.checked) ||
      (this.checkboxPaymentWireRef && this.checkboxPaymentWireRef.nativeElement.checked) || 
      (this.checkboxPaymentCheckRef && this.checkboxPaymentCheckRef.nativeElement.checked);
  }
  
  publishBid () {
    
    if (!this.bidAmountRef.nativeElement.value || this.bidAmountRef.nativeElement.value <= 0) {
      this.showInfoMessage('שגיאה', 'חובה להזין סכום חיובי');
      return;
    } else if (!this.bidDateRef.nativeElement.value) {
      this.showInfoMessage('שגיאה', 'חובה להזין תאריך הגעה');
      return;
    } else if (!this.bidTimeRef.nativeElement.value || this.getMillisFromTimeInput(this.bidTimeRef.nativeElement.value) === undefined) {
      this.showInfoMessage('שגיאה', 'חובה להזין שעת הגעה');
      return;
    } else if (this.checkboxExpirationRef.nativeElement.checked && !this.bidExpirationRef.nativeElement.value) {
      this.showInfoMessage('שגיאה', 'חובה להזין תאריך תפוגה');
      return;
    } else if (!this.isAnyPaymentMethodChecked()) {
      this.showInfoMessage('לא הזנת שדה חובה', 'חובה לבחור אופן קבלת תשלום');
      return;
    } else if (!this.checkboxAgreementRef.nativeElement.checked) {
      this.showInfoMessage('לא הזנת שדה חובה', 'חובה לאשר מדיניות פרטיות ותנאי שימוש');
      return;
    }
    
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'אישור הגשת הצעת מחיר', 
      message: 'אתה עומד להגיש הצעת מחיר על סך: ' + parseInt(this.bidAmountRef.nativeElement.value, 10) + ' ש"ח', 
      subMessage: '*אנו מחייבים 8% מסכום העסקה - בעת השלמת עסקה' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const bidder = this.database.getCurrentUser().val();
          
          let expirationDate = null;
          if (this.checkboxExpirationRef.nativeElement.checked) {
            expirationDate = new Date(this.bidExpirationRef.nativeElement.value).getTime();
          }
          
          console.log('exp: ' + expirationDate);
          
          const possiblePaymentMethods = {
            'paymentCash': (this.checkboxPaymentCashRef && this.checkboxPaymentCashRef.nativeElement.checked) ? true : false,
            'paymentCredit': (this.checkboxPaymentCreditRef && this.checkboxPaymentCreditRef.nativeElement.checked) ? true : false,
            'paymentWire': (this.checkboxPaymentWireRef && this.checkboxPaymentWireRef.nativeElement.checked) ? true : false,
            'paymentCheck': (this.checkboxPaymentCheckRef && this.checkboxPaymentCheckRef.nativeElement.checked) ? true : false
          }
          
          const payload = {
              'orderId' : this.orderId,
              'bidAmount' : parseInt(this.bidAmountRef.nativeElement.value, 10),
              'pickupDate' : new Date(this.bidDateRef.nativeElement.value).getTime(),
              'pickupTime' : this.getMillisFromTimeInput(this.bidTimeRef.nativeElement.value),
              'bidCreationDate' : firebase.database.ServerValue.TIMESTAMP,
              'expirationDate': expirationDate,
              'bidId' : this.database.getCurrentUser().child('uid').val(),
              'possiblePaymentMethods' : possiblePaymentMethods,
              bidder
          };
          
          this.loadingSetBid = true;
          this.database.updateBidForOrder(this.orderId, payload).then(_ => {
            // success
            this.loadingSetBid = false;
            this.resetMakeBidForm();
            this.showInfoMessage('הצלחה', 'הצעת המחיר הוגשה בהצלחה');
          }, reason => {
            // error
            this.loadingSetBid = false;
            console.log('failure reason: ' + reason);
            this.showInfoMessage('נכשל', 'הגשת הצעת המחיר נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  resetMakeBidForm () {
    this.bidAmountRef.nativeElement.value = '';
    this.bidDateRef.nativeElement.value = '';
    this.bidTimeRef.nativeElement.value = '';
    this.checkboxExpirationRef.nativeElement.checked = false; // will make bidExpirationRef to reset too.
    this.checkboxAgreementRef.nativeElement.checked = false;
    try {
      this.checkboxPaymentCashRef.nativeElement.checked = false;
    } catch (e) {
      // TODO handle exception
    }
    try {
      this.checkboxPaymentCreditRef.nativeElement.checked = false;
    } catch (e) {
      // TODO handle exception
    }
    try {
      this.checkboxPaymentWireRef.nativeElement.checked = false;
    } catch (e) {
      // TODO handle exception
    }
    try {
      this.checkboxPaymentCheckRef.nativeElement.checked = false;
    } catch (e) {
      // TODO handle exception
    }
  }
  
  acceptBid (bidItem) {
    
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'סגירת עסקה', 
      message: 'לסגור עסקה על סך: ' + bidItem.bidAmount + ' ש"ח ?\n' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
            'selectedBid' : bidItem.bidId,
            'bidSelectedDate' : firebase.database.ServerValue.TIMESTAMP,
            'orderStatus' : 1 // ORDER_STATUS_PENDING
          }
          
          this.loadingAcceptBid = true;
          this.database.updateOrderData(this.orderId, payload).then(_ => {
            // success;
            this.loadingAcceptBid = false;
            this.showInfoMessage('הצלחה', 'סגרתם עיסקה !');
          }, reason => {
            // failure
            console.log('failure reason: ' + reason);
            this.loadingAcceptBid = false;
            this.showInfoMessage('נכשל', 'סגירת העסקה נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  deleteOrder () {
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'מחיקת הזמנה', 
      message: 'האם אתה בטוח שברצונך למחוק את ההזמנה ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          this.database.deleteOrderById(this.orderId).then(_ => {
            // success;
            this.router.navigate(['/my-new-orders-page']);
          }, reason => {
            // failure
            console.log('failure reason: ' + reason);
            this.showInfoMessage('נכשל', 'מחיקת ההזמנה נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  cancelOrderAsOwner () {
    this.dialogService.addDialog(ModalInputComponent, { 
      title: 'ביטול עסקה', 
      message: 'מדוע הינך מעוניין לבטל את העסקה עם ' + this.currentOrderSnapshot.child('bidsList').child(this.currentOrder.selectedBid).child('bidder').child('name').val() + ' ?' })
      .subscribe((input) => {
        
        if (input) {
          
          const payload = {
            'ownerCancellationReason' : input,
            'orderStatus' : 2, // ORDER_STATUS_COMPLETED
            'ownerCancellationDate' : firebase.database.ServerValue.TIMESTAMP
          }
          
          this.database.updateOrderData(this.orderId, payload).then(_ => {
            // success;
            this.showInfoMessage('הצלחה', 'העסקה בוטלה בהצלחה !');
          }, reason => {
            // failure
            console.log('failure reason: ' + reason);
            this.showInfoMessage('נכשל', 'ביטול העסקה נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  cancelOrderAsBidder () {
    this.dialogService.addDialog(ModalInputComponent, { 
      title: 'ביטול עסקה', 
      message: 'מדוע הינך מעוניין לבטל את העסקה עם ' + this.currentOrder.userName + ' ?' })
      .subscribe((input) => {
        
        if (input) {
          
          const payload = {
            'bidderCancellationReason' : input,
            'orderStatus' : 2, // ORDER_STATUS_COMPLETED
            'bidderCancellationDate' : firebase.database.ServerValue.TIMESTAMP
          }
          
          this.database.updateOrderData(this.orderId, payload).then(_ => {
            // success;
            this.showInfoMessage('הצלחה', 'העסקה בוטלה בהצלחה !');
          }, reason => {
            // failure
            console.log('failure reason: ' + reason);
            this.showInfoMessage('נכשל', 'ביטול העסקה נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  removeMyBid () {
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'מחיקת הצעת מחיר', 
      message: 'האם אתה בטוח שברצונך למחוק את הצעת המחיר שלך ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          this.loadingDeleteBid = true;
          this.database.removeMyBidFromOrder(this.orderId).then(_ => {
            // success;
            this.loadingDeleteBid = false;
            this.showInfoMessage('הצלחה', 'הצעת המחיר נמחקה !');
          }, reason => {
            // failure
            this.loadingDeleteBid = false;
            console.log('failure reason: ' + reason);
            this.showInfoMessage('נכשל', 'מחיקת הצעת מחיר נכשלה, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  showInfoMessage(modalTitle, modalMessage) {
    this.dialogService.addDialog(ModalInformComponent, { title: modalTitle, message: modalMessage });
  }
  
  getStaticMapUrl(order: DataSnapshot) {
    const width = 500;
    const pickupLat = order.pickupLat;
    const pickupLng = order.pickupLng;
    const destinationLat = order.destinationLat;
    const destinationLng = order.destinationLng;
    return 'https://maps.googleapis.com/maps/api/staticmap?size=' + width + 'x' + 200 + '&markers=' + pickupLat + ',' + pickupLng + '&markers=' + destinationLat + ',' + destinationLng + '&language=iw&key=' + firebaseConfigDebug.apiKey;
  }

  getMillisFromTimeInput(rawTime) {

    const split = rawTime.split(':');
    if (split.length <= 0) {
      console.error('rawTime input has no ":" characters !');
      return undefined;
    }
    try {
      const time = new Date();
      time.setHours(split[0], split[1], 0, 0);
      return time.getTime();
    } catch (e) {
      console.log(e.message);
    }
    return undefined;
  }
  
  updateDistanceView() {
    
    this.mapsAPILoader.load().then(() => {
      
      const origin = new google.maps.LatLng(this.currentOrder.pickupLat, this.currentOrder.pickupLng);
      const destination = new google.maps.LatLng(this.currentOrder.destinationLat, this.currentOrder.destinationLng);
      
      const service = new google.maps.DistanceMatrixService;
      
      service.getDistanceMatrix(
      {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => {
        
        try {
          
          this.distance = response.rows[0].elements[0].distance.text;
          this.duration = response.rows[0].elements[0].duration.text;
        } catch (error) {
          this.distance = 'לא ידוע';
          this.duration = 'לא ידוע';
        }
            
      });
    });
  }
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
