import { DatabaseService } from '../../services';
import { Constants } from '../../services/database/database.service';
import { Component, OnInit, Input, Output, EventEmitter, PipeTransform, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit {
  
  loadingOpenByLocation = false;
  
  constructor(private translate: TranslateService, public database: DatabaseService, public router: Router) { }

  ngOnInit() {}

  onNewOrderNotificationClick () {
    this.database.enableNotificationOnNewOrders();
  }
  
  openByLocation() {
    
    
    
    if (window.navigator && window.navigator.geolocation) {
      
      console.log('openByLocation()');
      
      this.loadingOpenByLocation = true;
      
        window.navigator.geolocation.getCurrentPosition(
            position => {
                this.loadingOpenByLocation = false;
                console.log('position: ' + position.toString());
                const fromArea = Constants.getLocation(position.coords.latitude);
                this.openOpenOrdersbyLocation(fromArea);
            },
            error => {
              this.loadingOpenByLocation = false;
              console.log('error: ' + error);
                switch (error.code) {
                    case 1:
                        console.log('Permission Denied');
                        break;
                    case 2:
                        console.log('Position Unavailable');
                        break;
                    case 3:
                        console.log('Timeout');
                        break;
                    default:
                        console.log('error: ' + error);
                        break;
                }
              
                this.openOpenOrdersbyLocation(undefined);
            }
        );
    } else {
      
      console.log('no geolocation');
      this.openOpenOrdersbyLocation(undefined); 
    }
  }
  
  openOpenOrdersbyLocation(fromArea) {
    
    if (fromArea === undefined) {
      fromArea = '0';
    }
    
    const date = new Date();
    this.router.navigate(['/open-orders-page', fromArea, '0', date.getTime(), '0']);
  }
}
