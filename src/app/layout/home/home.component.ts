import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService } from '../../shared';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [routerTransition()]
})
export class HomeComponent implements OnInit {

  public doughnutChartLabels: string[] = ['הזמנות פתוחות', 'עסקאות ממתינות', 'עסקאות שהולשמו'];
  public doughnutChartData: number[] = [];
  statistics: any;
  
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {
    this.database.getLatestStatisticsObject().query.once('value').then(dataSnapshot => {
      
      this.doughnutChartData[0] = dataSnapshot.child('openOrdersCount').val();
      this.doughnutChartData[1] = dataSnapshot.child('pendingOrdersCount').val();
      this.doughnutChartData[2] = dataSnapshot.child('completedOrdersCount').val();
      
      this.statistics = dataSnapshot;
    });
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
