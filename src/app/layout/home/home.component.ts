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
  public sliders: Array<any> = [];
  
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
    this.sliders.push({
          imagePath: 'assets/images/slider1.jpg',
          label: 'First slide label',
          text: 'Nulla vitae elit libero, a pharetra augue mollis interdum.'
      }, {
          imagePath: 'assets/images/slider2.jpg',
          label: 'Second slide label',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      }, {
          imagePath: 'assets/images/slider3.jpg',
          label: 'Third slide label',
          text: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur.'
      });
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
