import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { DialogService } from 'ngx-bootstrap-modal';

@Component({
  selector: 'app-manager-registration-result',
  templateUrl: './manager-registration-result.component.html',
  styleUrls: ['./manager-registration-result.component.scss'],
  animations: [routerTransition()]
})
export class ManagerRegistrationResultComponent implements OnInit, OnDestroy {
  @ViewChild('checkboxAgreement')
  public checkboxAgreementRef: ElementRef;
  constructor(private translate: TranslateService, private router: Router, public database: DatabaseService,
      private dialogService: DialogService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  requestPhonePayment() {
    
    if (!this.checkboxAgreementRef.nativeElement.checked) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה לאשר מדיניות פרטיות ותנאי שימוש');
      return;
    }
    
    const payload = {
      'requestingManager': true
    }
    this.database.updateMyUserData(payload).then(_ => {
      // success
    }, reason => {
      // failure
    });
  }
  
  requestOnlinePayment() {
    if (!this.checkboxAgreementRef.nativeElement.checked) {
      this.showInformationDialog('לא הזנת שדה חובה', 'חובה לאשר מדיניות פרטיות ותנאי שימוש');
      return;
    }
    
    this.router.navigate(['/payment', this.database.getCurrentUser().child('uid').val()]);
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
