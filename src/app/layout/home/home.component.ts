import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, AuthListener } from '../../shared';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

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
  
  constructor(private translate: TranslateService, public database: DatabaseService, public router: Router) {
    this.setupTranslation(translate);
    this.sliders.push({
          imagePath: 'assets/images/slider3.jpg',
          label: 'קבל הצעות מחיר להובלות שלך',
          text: 'כאן תוכל לקבל הצעות מחיר ולהבטיח מחיר הוגן.'
      }, {
          imagePath: 'assets/images/slider2.jpg',
          label: 'מצא עבודה למשאיות שלך',
          text: 'מצא להם עבודה והתחל להרוויח כסף !'
      }, {
          imagePath: 'assets/images/slider1.jpg',
          label: 'עכשיו גם לאנדרואיד',
          text: 'באפליקציה תוכלו לקבל הודעות בזמן אמת ולהשאר עם יד על הדופק'
      });
  }

  onUserChanged(user: any) {
    
    if (user !== undefined) {
      // user logged in
      
      if (HomeComponent.shouldRedirectToCreateOrder) {
        this.router.navigate(['/create-order-page']);
        HomeComponent.shouldRedirectToCreateOrder = false;
      } else if (HomeComponent.shouldRedirectToManagerRegistration) {
        
        if (user.child('manager').val() === true) {
          // user is manager
          this.router.navigate(['/open-orders-page', 0, 0, 0, 0]);
          HomeComponent.shouldRedirectToCreateOrder = false;
        } else {
          this.router.navigate(['/manager-registration-page']);
          HomeComponent.shouldRedirectToCreateOrder = false;
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
      this.router.navigate(['/create-order-page']);
    } else {
      // user not logged in
      HomeComponent.shouldRedirectToCreateOrder = true;
      
      this.database.login();
    }
  }
  
  onManagerRequestClicked() {
    if (this.database.currentUser !== undefined) {
      // user logged in
      
      if (this.database.currentUser.child('manager').val() === true) {
        // user is manager
        this.router.navigate(['/open-orders-page', 0, 0, 0, 0]);
      } else {
        // user need to register as manager
        this.router.navigate(['/manager-registration-page']);
      }
      
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
}
