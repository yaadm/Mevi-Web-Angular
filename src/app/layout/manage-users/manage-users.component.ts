import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalInputComponent } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
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
  }

  onUserChanged(user: any) {
    if (user) {
      this.items = this.database.subscribeToAllUsers();
      this.items.subscribe(
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
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
