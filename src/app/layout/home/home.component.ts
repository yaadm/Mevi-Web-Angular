import { Component, OnInit, ViewEncapsulation, OnDestroy, HostListener, NgZone } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, AuthListener } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'ngx-bootstrap-modal';
import { log } from 'util';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [routerTransition()]
})
  
export class HomeComponent implements OnInit, OnDestroy, AuthListener {
  
  static shouldRedirectToCreateOrder = false;
  static shouldRedirectToManagerRegistration = false;
  
  public doughnutChartLabels: string[] = ['הזמנות פתוחות', 'עסקאות ממתינות', 'עסקאות שהושלמו'];
  public doughnutChartData: number[] = [];
  statistics: any;
  public sliders: Array<any> = [];
  showYoutubeOverlay = true;
  
  
  constructor(private translate: TranslateService, public database: DatabaseService, public router: Router, private dialogService: DialogService, private _ngZone: NgZone) {
    this.setupTranslation(translate);
    
    window['angularComponentRef'] = {
      component: this, 
      zone: _ngZone,
      componentFn: (value) => this.callFromOutside(value), 
    };
  }

  callFromOutside(value) {
    // this.zone.run(() => {
      console.log('calledFromOutside ' + value);
      this.database.onNewFCMTokenFromAndroid(value);
    // });
  }
  
  toggleOverlayVideo() {
    this.showYoutubeOverlay = !this.showYoutubeOverlay;
  }
  
  onUserChanged(user: any) {
    
    if (user !== undefined) {
      // user logged in
      
      if (HomeComponent.shouldRedirectToCreateOrder) {
        HomeComponent.shouldRedirectToCreateOrder = false;
        this.router.navigate(['/create-order-page']);
      } else if (HomeComponent.shouldRedirectToManagerRegistration) {
        
        HomeComponent.shouldRedirectToManagerRegistration = false;
        if (user.child('manager').val() === true) {
          // user is manager
          this.router.navigate(['/open-orders-page', 0, 0, 0, 0]);
        } else {
          this.router.navigate(['/manager-registration-page']);
        }
      }
    }
  }
  
  ngOnInit() {
    
    this.database.subscribeToAuth(this);
    this.database.getLatestStatisticsObject().query.once('value').then(dataSnapshot => {
      
      this.doughnutChartData[0] = dataSnapshot.child('openOrdersCount').val();
      this.doughnutChartData[1] = dataSnapshot.child('pendingOrdersCount').val();
      this.doughnutChartData[2] = dataSnapshot.child('completedOrdersCount').val();
      
      this.statistics = dataSnapshot;
    });
  }
  
  ngOnDestroy() {
    this.database.unsubscribeFromAuth(this);
  }

  onCreateNewOrderClicked() {
    
    if (this.database.currentUser !== undefined) {
      // user logged in
      
      if (this.database.getCurrentUser().child('blocked').val()) {
        this.showInfoMessage('שגיאה', 'המשתמש שלך חסום, בכדי לפתור את הבעיה נא צור קשר עם האתר', ['/contact-us-page'], 'ליצירת קשר'); // TODO: add suggestion to register
        return;
      }
      
      this.router.navigate(['/create-order-page']);
    } else {
      // user not logged in
      HomeComponent.shouldRedirectToCreateOrder = true;
      
      this.database.login();
    }
  }
  
  showInfoMessage(modalTitle, modalMessage, urlLink?: string[], urlText?: string) {
    this.dialogService.addDialog(ModalInformComponent, { title: modalTitle, message: modalMessage, linkUrl: urlLink, linkText: urlText });
  }
  
  onManagerRequestClicked() {
    if (this.database.currentUser !== undefined) {
      // user logged in
      
      if (this.database.getCurrentUser().child('blocked').val()) {
        this.showInfoMessage('שגיאה', 'המשתמש שלך חסום, בכדי לפתור את הבעיה נא צור קשר עם האתר', ['/contact-us-page'], 'ליצירת קשר'); // TODO: add suggestion to register
        return;
      }
      
      this.router.navigate(['/open-orders-page', 0, 0, 0, 0]);
      
//      if (this.database.currentUser.child('manager').val() === true) {
//        // user is manager
//        this.router.navigate(['/open-orders-page', 0, 0, 0, 0]);
//      } else {
//        // user need to register as manager
//        this.router.navigate(['/manager-registration-page']);
//      }
      
    } else {
      
      // user not logged in
      
      HomeComponent.shouldRedirectToManagerRegistration = true;
      
      this.database.login();
    }
  }
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
  
  @HostListener('window:custom-event', ['$event'])
  customEventFunction(event) {
    console.log('customEventFunction() called event:' + event.type);
  }
  
}
