import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  animations: [routerTransition()]
})
export class MyProfileComponent {
  
  @ViewChild('inputCompanyName')
  public inputCompanyNameRef: ElementRef;
  @ViewChild('inputCompanyPhone')
  public inputCompanyPhoneRef: ElementRef;
  @ViewChild('inputCompanyAddress')
  public inputCompanyAddressRef: ElementRef;
  @ViewChild('checkboxEmailSubscription')
  public checkboxEmailSubscriptionRef: ElementRef;
  
  constructor(private translate: TranslateService, public database: DatabaseService, private dialogService: DialogService) {
    this.setupTranslation(translate);
  }

  onSubmit () {
    
    if (!this.inputCompanyNameRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין שם חברה');
      return;
    } else if (!this.inputCompanyPhoneRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין טלפון חברה');
      return;
    } else if (!this.inputCompanyAddressRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת חברה');
      return;
    }
    
    const payload = {
      'name': this.inputCompanyNameRef.nativeElement.value,
      'companyAddress': this.inputCompanyAddressRef.nativeElement.value,
      'companyPhone': this.inputCompanyPhoneRef.nativeElement.value,
      'subscribedToMailingList': this.checkboxEmailSubscriptionRef.nativeElement.checked
    }
    
    this.database.updateMyUserData(payload).then(_ => {
      // updated
      this.dialogService.addDialog(ModalInformComponent, { title: 'הצלחה', message: 'הפרופיל עודכן בהצלחה !' });
    });
    
  }

  showInfoMessage(modalMessage) {
    this.dialogService.addDialog(ModalInformComponent, { title: 'שגיאה', message: modalMessage });
  }
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
