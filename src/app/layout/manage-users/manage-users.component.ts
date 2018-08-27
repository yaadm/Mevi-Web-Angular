import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalInputComponent, ModalConfirmComponent } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import * as firebase from 'firebase';
import { DialogService } from 'ngx-bootstrap-modal';

@Component({
  selector: 'app-manage-users-page',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  animations: [routerTransition()]
})
export class ManageUsersComponent implements OnInit, OnDestroy, AuthListener {
  items:  Observable<{}[]>;
  itemsArray = [];
  visibilityMap: string[] = [];
  itemsSubscription;
  
  @ViewChild('selectionSearchType')
  public selectionSearchTypeRef: ElementRef;
  
  @ViewChild('inputCompanyId')
  public inputCompanyIdRef: ElementRef;
  
  @ViewChild('inputCompanyName')
  public inputCompanyNameRef: ElementRef;
  
  constructor(private translate: TranslateService, public database: DatabaseService, private dialogService: DialogService) {
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
      this.items = this.database.subscribeToAllUsers();
      this.itemsSubscription = this.items.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.forEach(userItem => {
            this.updateItemsArray(userItem);
          });
        });
    } else {
      this.database.unsubscribeFromAuth(this);
    }
  }

  updateItemsArray (userItem) {
    let index = -1;

    for (let i = 0; i < this.itemsArray.length; i++) {
      if (this.itemsArray[i].uid === userItem.uid) {
        index = i;
        break;
      }
    }

    if (index !== -1) {
      this.itemsArray[index] = userItem;
    } else {
      this.itemsArray.push(userItem);
    }
  }
  
  searchById () {
    
    const searchStr = this.inputCompanyIdRef.nativeElement.value;
    
    if (searchStr) {
      
      this.itemsArray.forEach(user => {
        
        if (user.companyId && user.companyId.indexOf(searchStr) !== -1) {
          
          const index = this.visibilityMap.indexOf(user.uid);
          if (index !== -1) {
            this.visibilityMap.splice(index, 1);
          }
        } else {
          
          this.visibilityMap.push(user.uid);
        }
      });
      
    } else {
      
      this.resetAllVisibility();
    }
    
  }
  
  searchByName () {
    
    const searchStr = this.inputCompanyNameRef.nativeElement.value;
    
    if (searchStr) {
      
      this.itemsArray.forEach(user => {
        
        if (user.companyId && user.name.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1) {
          
          const index = this.visibilityMap.indexOf(user.uid);
          if (index !== -1) {
            this.visibilityMap.splice(index, 1);
          }
        } else {
          
          this.visibilityMap.push(user.uid);
        }
      });
      
    } else {
      
      this.resetAllVisibility();
    }
    
  }

  resetAllVisibility () {
    this.visibilityMap.splice(0, this.visibilityMap.length);
  }
  
  onSearchTypeChanged() {
    
    const searchType = this.selectionSearchTypeRef.nativeElement.value;
    if (searchType === '0') {
      this.resetAllVisibility();
    } else if (searchType === '1') {
      this.itemsArray.forEach(user => {
        
        if (user.requestingManager === true) {
          
          const index = this.visibilityMap.indexOf(user.uid);
          if (index !== -1) {
            this.visibilityMap.splice(index, 1);
          }
        } else {
          
          this.visibilityMap.push(user.uid);
        }
      });
    } else if (searchType === '2') {
      this.itemsArray.forEach(user => {
        
        if (user.manager === true && !user.rating) {
          
          const index = this.visibilityMap.indexOf(user.uid);
          if (index !== -1) {
            this.visibilityMap.splice(index, 1);
          }
        } else {
          
          this.visibilityMap.push(user.uid);
        }
      });
    }
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
  
  denyManager (userItem) {
    this.dialogService.addDialog(ModalInputComponent, {
      title: 'סיבת ביטול',
      message: 'מדוע אתה דוחה את בקשת הניהול ?'})
      .subscribe((data) => {
          if (data) {
            const payload = {
              'manager' : false,
              'managerRequestDenialReason' : data,
              'requestingManagerDenied' : true,
              'requestingManager' : false
            }
            
            this.database.updateUserData(userItem.uid, payload).then(_ => {
              // on success
              
              this.showInfoDialog('הצלחה', 'המנוי נדחה');
            }, reason => {
              // on reject
              this.showInfoDialog('נכשל', 'לא הצלחנו לבטל את המנוי, נא לנסות שוב מאוחר יותר');
            });
          }
      });
  }
  
  updateRating(userItem) {
    
    let userRating = 0.0;
    if (userItem.rating !== undefined) {
      try {
        userRating = parseFloat(userItem.rating);
      } catch (e) {}
    }
    
    this.dialogService.addDialog(ModalInputComponent, {
      title: 'עדכון דירוג',
      message: 'הזן דירוג',
      subMessage: 'הדירוג של ' + userItem.name + ' הוא: ' + userRating.toString()})
      .subscribe((data) => {
          if (data) {
            
            let rating = -1;
            
            try {
              rating = parseFloat(data);
              rating = parseFloat(rating.toFixed(2));
            } catch (e) {
              this.showInfoDialog('שגיאה', 'הדירוג שהוזן אינו חוקי (מספר בין 0 - 5)');
              return;
            }
            
            if (rating < 0 || rating > 5) {
              this.showInfoDialog('שגיאה', 'הדירוג שהוזן אינו חוקי (מספר בין 0 - 5)');
              return;
            }
            
            const payload = {
              'rating' : rating,
            }
            
            this.database.updateUserData(userItem.uid, payload).then(_ => {
              // on success
              
              this.showInfoDialog('הצלחה', 'הדירוג עודכן');
            }, reason => {
              // on reject
              this.showInfoDialog('נכשל', 'לא הצלחנו לעדכן את הדירוג, נא לנסות שוב מאוחר יותר');
            });
          }
      });
  }
  
  denyManagerRequest (user) {
    this.dialogService.addDialog(ModalInputComponent, {
      title: 'איך הסתיימה השיחה ?',
      message: 'מה נסגר בסוף השיחה ?'})
      .subscribe((data) => {
          if (data) {
            const payload = {
              'managerRequestDenialReason' : data,
              'requestingManagerDenied' : true,
              'requestingManager' : false
            }
            
            this.database.updateUserData(user.uid, payload).then(_ => {
              // on success
              
              this.showInfoDialog('הצלחה', 'הטיפול הסתיים');
            }, reason => {
              // on reject
              this.showInfoDialog('נכשל', 'לא הצלחנו לבסיים את הטיפול, נא לנסות שוב מאוחר יותר');
            });
          }
      });
  }
  
  removeCreditCard(user) {
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'מחיקת פרטי אשראי', 
      message: 'האם אתה בטוח שברצונך ללמחוק אשראי של ' + user.name + ' ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
            'paymentAccessToken' : ''
          }
          
          this.database.updateUserData(user.uid, payload).then(_ => {
            // on success
            
            this.showInfoDialog('הצלחה', 'אשראי נמחק');
          }, reason => {
            // on reject
            this.showInfoDialog('נכשל', 'לא הצלחנו למחוק את האשראי, נא לנסות שוב מאוחר יותר');
          });
        }
      });
  }
  
  blockUser(user) {
    
    if (user.blocked) {
      
      this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'ביטול חסימת משתמש', 
      message: 'האם אתה בטוח שברצונך לאפשר את ' + user.name + ' ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
            'blocked' : false
          }
          
          this.database.updateUserData(user.uid, payload).then(_ => {
            // on success
            
            this.showInfoDialog('הצלחה', 'המנוי אופשר');
          }, reason => {
            // on reject
            this.showInfoDialog('נכשל', 'לא הצלחנו לאפשר את המנוי, נא לנסות שוב מאוחר יותר');
          });
        }
      });
      
    } else {
      
      this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'חסימת משתמש', 
      message: 'האם אתה בטוח שברצונך לחסום את ' + user.name + ' ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
            // 'manager' : false, // do we need to remove the manager permission ?
            'blocked' : true
          }
          
          this.database.updateUserData(user.uid, payload).then(_ => {
            // on success
            
            this.showInfoDialog('הצלחה', 'המנוי נחסם');
          }, reason => {
            // on reject
            this.showInfoDialog('נכשל', 'לא הצלחנו לחסום את המנוי, נא לנסות שוב מאוחר יותר');
          });
        }
      });
    }
    
    
  }
  
  approveManagerWithObligo(user) {
    
    this.dialogService.addDialog(ModalInputComponent, {
      title: 'פתיחת תיק אובליגו',
      message: 'מה הסכום לאובליגו חודשי ? (בשקלים)',
      subMessage: 'הסכום הקיים הינו: ' + (user.obligo ? user.obligo + ' שח' : '0 שח') })
      .subscribe((data) => {
          if (data) {
            
            const obligo: number = +data;
            if (!Number.isInteger(obligo)) {
              this.showInfoDialog('נכשל', 'חובה להזין מספר');
              return;
            }
            
            const payload: any = {
              'manager' : true,
              'obligo' : obligo,
              'requestingManagerDenied' : false,
              'requestingManager' : false
            }
            
            // 'managerRegistrationDate' : admin.database.ServerValue.TIMESTAMP
            if (!user.managerRegistrationDate) {
              payload.managerRegistrationDate = firebase.database.ServerValue.TIMESTAMP;
            }
            
            console.log('managerRegistrationDate: ' + JSON.stringify(payload));
            
            this.database.updateUserData(user.uid, payload).then(_ => {
              // on success
              
              this.showInfoDialog('הצלחה', 'המנוי עכשיו מנהל');
            }, reason => {
              // on reject
              this.showInfoDialog('נכשל', 'לא הצלחנו לעדכן את המנוי, נא לנסות שוב מאוחר יותר');
            });
          }
      });
  }
  
  approveManagerWithCredit(user) {
    this.dialogService.addDialog(ModalConfirmComponent, { 
      title: 'אישור מנהל משאיות', 
      message: 'האם אתה בטוח שברצונך לאשר את ' + user.name + ' ?' })
      .subscribe((isConfirmed) => {
        
        if (isConfirmed) {
          
          const payload = {
             'manager' : true,
             'requestingManagerDenied' : false,
          }
          
          this.database.updateUserData(user.uid, payload).then(_ => {
            // on success
            
            this.showInfoDialog('הצלחה', 'המנוי מנהל');
          }, reason => {
            // on reject
            this.showInfoDialog('נכשל', 'לא הצלחנו לעדכן את המנוי, נא לנסות שוב מאוחר יותר');
          });
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
