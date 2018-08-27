import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DialogService } from 'ngx-bootstrap-modal';
import * as firebase from 'firebase';

@Component({
  selector: 'app-registration-page',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  animations: [routerTransition()]
})
export class RegistrationComponent implements OnInit, OnDestroy {

  @ViewChild('companyName')
  public companyNameRef: ElementRef;
  @ViewChild('companyId')
  public companyIdRef: ElementRef;
  @ViewChild('companyPhone')
  public companyPhoneRef: ElementRef;
  @ViewChild('companyAddress')
  public companyAddressRef: ElementRef;
  @ViewChild('checkboxAgreement')
  public checkboxAgreementRef: ElementRef;
  
  hasCompletedSuccessfully = false;
  loading = false;
  constructor(private translate: TranslateService, private router: Router, private database: DatabaseService,
    private dialogService: DialogService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (!this.hasCompletedSuccessfully) {
      this.database.logout();
    }
  }

  isValidIsraeliID(input) {
    input = String(input).trim();
    if (input.length > 9 || input.length < 5 || isNaN(input)) {
      return false;
    } 

    // Pad string with zeros up to 9 digits
    input = input.length < 9 ? ("00000000" + input).slice(-9) : input;

    return Array.from(input, Number)
      .reduce((counter, digit, i) => {
        const step = digit * ((i % 2) + 1);
        return counter + (step > 9 ? step - 9 : step);
      }) % 10 === 0;
  }
  
  isValidPhone(input) {
    
    input = String(input).trim();
    
    if (isNaN(input)) {
      return false;
    }
    
    if (input.length < 8) {
      return false;
    }
    
    return /^\d+$/.test(input);
  }
  
  onSubmit() {

    if (!this.companyNameRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין שם חברה');
      return;
    } else if (!this.companyIdRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין ח.פ \ עוסק מורשה');
      return;
    } else if (!this.isValidIsraeliID(this.companyIdRef.nativeElement.value)) {
      this.showInformationDialog('לא הזנת שדה חובה', 'ח.פ \ עוסק מורשה לא תקין');
      return;
    } else if (!this.companyAddressRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין כתובת העסק');
      return;
    } else if (!this.companyPhoneRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין טלפון להתקשרות');
      return;
    } else if (!this.isValidPhone(this.companyPhoneRef.nativeElement.value)) {
      this.showInformationDialog('מספר טלפון לא חוקי', 'חובה להזין רק מספרים ללא רווחים');
      return;
    } else if (!this.checkboxAgreementRef.nativeElement.checked) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה לאשר מדיניות פרטיות ותנאי שימוש');
      return;
    } else if (!this.database.currentUser) {
      this.showInformationDialog('שגיאה במשתמש', 'נסה להתחבר מחדש ולנסות שנית מאוחר יותר, תודה');
      return;
    }

    this.loading = true;
    const companyIdExistsSubscription = this.database.subscribeToIsCompanyIdExists(this.companyIdRef.nativeElement.value).subscribe(
        (afa: any) => {
          
          companyIdExistsSubscription.unsubscribe();

          console.log('afa: ' + JSON.stringify(afa[0]));
          
          if (afa.length > 0) {

            const foundUid = afa[0].uid;
            const myUid = this.database.currentUser.child('uid').val();

            if (foundUid !== myUid) {
              
              this.loading = false;
              this.showInformationDialog('החברה כבר רשומה', 'הח.פ \ עוסק מורשה שהזנת כבר קיים במערכת עם אימייל אחר');
              return;
            }
          }

          const payload = {
            'name': this.companyNameRef.nativeElement.value,
            'companyId': this.companyIdRef.nativeElement.value,
            'companyAddress': this.companyAddressRef.nativeElement.value,
            'companyPhone': this.companyPhoneRef.nativeElement.value,
            'agreementAcceptedAt': firebase.database.ServerValue.TIMESTAMP
          }
          this.database.updateMyUserData(payload).then(_ => {
            // updated
            this.hasCompletedSuccessfully = true;
            this.router.navigate(['/home-page']);
          }, reason => {
            console.log('error: ' + reason);
            this.loading = false;
          });
      }, error => {
        // error occurred
        this.loading = false;
      });
  }

  showInformationDialog(modaltitle, modalmessage) {
    this.dialogService.addDialog(ModalInformComponent, {
      title: modaltitle,
      message: modalmessage})
      .subscribe((isConfirmed) => {
          if (isConfirmed) {
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
