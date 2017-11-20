import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DialogService } from 'ng2-bootstrap-modal';

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

  hasCompletedSuccessfully = false;

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

  onSubmit() {

    if (!this.companyNameRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין שם חברה');
      return;
    } else if (!this.companyIdRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין ח.פ \ עוסק מורשה');
      return;
    } else if (!this.companyPhoneRef.nativeElement.value) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה להזין טלפון להתקשרות');
      return;
    }

    const companyIdExistsSubscription = this.database.subscribeToIsCompanyIdExists(this.companyIdRef.nativeElement.value).subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          companyIdExistsSubscription.unsubscribe();

          if (afa.length > 0) {

            const foundUid = afa[0].payload.child('uid').val();
            const myUid = this.database.currentUser.child('uid').val();

            if (foundUid !== myUid) {
              this.showInformationDialog('החברה כבר רשומה', 'הח.פ \ עוסק מורשה שהזנת כבר קיים במערכת עם אימייל אחר');
              return;
            }
          }

          const payload = {
            'companyName': this.companyNameRef.nativeElement.value,
            'companyId': +this.companyIdRef.nativeElement.value,
            'companyPhone': +this.companyPhoneRef.nativeElement.value
          }
          this.database.updateUserRegistrationData(payload).then(_ => {
            // updated
            this.hasCompletedSuccessfully = true;
            this.router.navigate(['/home-page']);
          });
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
