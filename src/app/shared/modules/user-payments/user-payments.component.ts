import { AuthListener } from '../../services';
import { DatabaseService, firebaseConfigDebug } from '../../services/database/database.service';
import { Component, OnInit, Input, Output, EventEmitter, Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

@Component({
    selector: 'app-user-payments',
    templateUrl: './user-payments.component.html',
    styleUrls: ['./user-payments.component.scss']
})
export class UserPaymentsComponent implements OnInit, OnDestroy, AuthListener {
  @Input() public userId: string;
  filteredItemsArray = [];
  userPaymentsSubscription;
  loadedUser;
  
  constructor(private translate: TranslateService, public database: DatabaseService) { 
    
  }

  ngOnInit() {
    this.database.subscribeToAuth(this);
  }
  
  onUserChanged(user: any) {
    
    if (user) {
      
      if (!this.loadedUser) {
        this.loadedUser = user;
        
        this.database.subscribeToUserPayments(this.userId).then(MyPaymentsSnapshot => {
        
          MyPaymentsSnapshot.forEach(paymentSnapshot => {
            
            this.updatePaymentsArray(paymentSnapshot.val());
          });
        });
      }
    }
  }
  
  updatePaymentsArray (paymentObject) {
    const index = this.filteredItemsArray.indexOf(paymentObject, 0);
    if (index !== -1) {
      this.filteredItemsArray[index] = paymentObject;
    } else {
      this.filteredItemsArray.push(paymentObject);
    }
  }
  
  ngOnDestroy(): void {
    this.database.unsubscribe(this.userPaymentsSubscription);
    this.database.unsubscribeFromAuth(this);
  }
}
