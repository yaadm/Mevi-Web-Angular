import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalInputComponent, ModalConfirmComponent } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
  selector: 'app-managers-registration-requests-page',
  templateUrl: './managers-registration-requests.component.html',
  styleUrls: ['./managers-registration-requests.component.scss'],
  animations: [routerTransition()]
})
export class ManagersRegistrationRequestsComponent implements OnInit, OnDestroy, AuthListener {
  items:  Observable<AngularFireAction<DataSnapshot>[]>;
  itemsArray = [];
  constructor(private translate: TranslateService, public database: DatabaseService,
      private dialogService: DialogService) {
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
      this.items = this.database.subscribeToManagersRequests();
      this.items.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          // fix this sh*t in the future...
          this.itemsArray = [];
          afa.forEach(userItem => {
            this.updateItemsArray(userItem);
          });
        });
    }
  }

  updateItemsArray (userItem) {
    const index = this.itemsArray.indexOf(userItem, 0);
    if (index !== -1) {
      this.itemsArray[index] = userItem;
    } else {
      this.itemsArray.push(userItem);
    }
  }

  showInputDialog () {
    this.dialogService.addDialog(ModalInputComponent, {
      title: 'סיבת ביטול',
      message: 'מדוע אתה דוחה את בקשת הניהול ?'})
      .subscribe((data) => {
          if (data) {
          } else {
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
  
  denyManagerRequest (user) {
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
            
            this.database.updateUserData(user.uid, payload).then(_ => {
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
