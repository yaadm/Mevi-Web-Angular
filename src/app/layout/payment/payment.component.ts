import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef, Renderer } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-manage-users-page',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  animations: [routerTransition()]
})
export class PaymentComponent implements OnInit, OnDestroy, AfterViewInit, AuthListener {
  userId: string;
  userSnapshot: DataSnapshot;
  isFirestTime = true;
  @ViewChild('iframeContent')
  public iframeContent: ElementRef;
  constructor(private translate: TranslateService, public database: DatabaseService, private activatedRoute: ActivatedRoute,
    public renderer: Renderer, private router: Router, private sanitizer: DomSanitizer) {
    this.userId = this.activatedRoute.snapshot.params['userId'];
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }

  ngOnInit() {
    
    this.iframeContent.nativeElement.src = 'https://www.mevi.co.il/rediredctUserToPayment?uid='  + this.userId;
    
    this.database.getUserById(this.userId).subscribe(
    (afa: AngularFireAction<DataSnapshot>) => {
        this.userSnapshot = afa.payload;
    });
  }
  
  ngAfterViewInit() {
    }
  
  ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
      
      if (this.isFirestTime) {
        this.isFirestTime = false;
        return;
      }
      
      if (user.child('uid').val() === this.userId && user.child('manager').val() === true) {
        console.log('navigating to manager-registration-page');
        this.router.navigate(['/manager-registration-page']);
      }
    }
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
