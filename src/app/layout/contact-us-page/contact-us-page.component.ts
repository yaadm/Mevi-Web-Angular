import { routerTransition } from '../../router.animations';
import { DatabaseService } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
    selector: 'app-contact-us-page',
    templateUrl: './contact-us-page.component.html',
    styleUrls: ['./contact-us-page.component.scss'],
    animations: [routerTransition()]
})
export class ContactUsPageComponent implements OnInit {
  
  @ViewChild('name')
  public nameRef: ElementRef;
  @ViewChild('email')
  public emailRef: ElementRef;
  @ViewChild('phone')
  public phoneRef: ElementRef;
  @ViewChild('message')
  public messageRef: ElementRef;
  
  constructor(private dialogService: DialogService, private database: DatabaseService) {
  }

  ngOnInit() {
  }
  
  sendMessage () {
    
    if (!this.nameRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין שם');
      return;
    } else if (!this.emailRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין אימייל');
      return;
    } else if (!this.messageRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין הודעה');
      return;
    }
    
    const payload = {
        'name' : this.nameRef.nativeElement.value,
        'email' : this.emailRef.nativeElement.value,
        'phone' : this.phoneRef.nativeElement.value,
        'message' : this.messageRef.nativeElement.value
    }
    
    this.database.sendContactUsEmail(payload).then(item => {
      // success
      this.dialogService.addDialog(ModalInformComponent, { title: 'הצלחה', message: 'ההודעה נשלחה בהצלחה !' });
      this.resetForm();
    }, rejected => {
      // failure
      this.showInfoMessage('שליחת האימייל נכשלה, נא לנסות שוב במועד מאוחר יותר');
    });
    
  }
  
  resetForm () {
    this.nameRef.nativeElement.value = '';
    this.emailRef.nativeElement.value = '';
    this.phoneRef.nativeElement.value = '';
    this.messageRef.nativeElement.value = '';
  }
  
  showInfoMessage(modalMessage) {
    this.dialogService.addDialog(ModalInformComponent, { title: 'שגיאה', message: modalMessage });
  }
}
