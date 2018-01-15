import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { routerTransition } from '../../router.animations';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { AuthListener } from '../../shared/services';
import { Constants } from '../../shared/services/database/database.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

@Component({
  selector: 'app-open-orders-page',
  templateUrl: './open-orders.component.html',
  styleUrls: ['./open-orders.component.scss'],
  animations: [routerTransition()]
})
export class OpenOrdersComponent implements OnInit, OnDestroy, AuthListener {
  items:  Observable<AngularFireAction<DataSnapshot>[]>;
  itemsArray = [];
  filteredItemsArray = [];
  searchTerm = undefined;
  
  @ViewChild('selectionAreaFrom')
  public selectionAreaFromRef: ElementRef;
    
  @ViewChild('selectionAreaTo')
  public selectionAreaToRef: ElementRef;
  
  @ViewChild('startingDate')
  public startingDateRef: ElementRef;
  
  @ViewChild('endingDate')
  public endingDateRef: ElementRef;
  
  constructor(private translate: TranslateService, public database: DatabaseService, private activatedRoute: ActivatedRoute, public router: Router) {
    
    if (this.activatedRoute.snapshot.params['from'] === undefined) {
      // user entered url without params - redirect
      this.router.navigate(['/open-orders-page', '0', '0', '0', '0']);
      return;
    }
    
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }
  
  onSearch() {
    
    const areaFrom = this.selectionAreaFromRef.nativeElement.value;
    const areaTo = this.selectionAreaToRef.nativeElement.value;
    let startingDateTime = this.startingDateRef.nativeElement.value;
    let endingDateTime = this.endingDateRef.nativeElement.value;
    
    if (startingDateTime === undefined || startingDateTime === '') { 
      startingDateTime = '0';
    } else {
      startingDateTime = new Date(startingDateTime).getTime();
    }
    
    if (endingDateTime === undefined || endingDateTime === '') { 
      endingDateTime = '0';
    } else {
      endingDateTime = new Date(endingDateTime).getTime();
    }
    
    this.router.navigate(['/open-orders-page', areaFrom, areaTo, startingDateTime, endingDateTime]);
    
    this.filterOrders();
  }

  ngOnInit() {
    
    this.activatedRoute.params.subscribe(params => {

      console.log('new params: ' + JSON.stringify(params));
      
      const fromArea = this.activatedRoute.snapshot.params['from'];
      const toArea = this.activatedRoute.snapshot.params['to'];
      const startDate = this.activatedRoute.snapshot.params['start'];
      const endDate = this.activatedRoute.snapshot.params['end'];
      
      if (fromArea !== undefined) {
        this.selectionAreaFromRef.nativeElement[+fromArea].selected = true;
      } else {
        this.selectionAreaFromRef.nativeElement[0].selected = true;
      }
      
      if (toArea !== undefined) {
        this.selectionAreaToRef.nativeElement[+toArea].selected = true;
      } else {
        this.selectionAreaToRef.nativeElement[0].selected = true;
      }
      
      if (startDate !== undefined && startDate > 0) {
        const newDateString = this.getDateString(startDate);
        this.startingDateRef.nativeElement.value = newDateString;
      } else {
        this.startingDateRef.nativeElement.value = '';
      }
      
      if (endDate !== undefined && endDate > 0) {
        const newDateString = this.getDateString(startDate);
        this.endingDateRef.nativeElement.value = newDateString;
      } else {
        this.endingDateRef.nativeElement.value = '';
      }
      
      this.filterOrders();
   });
    
    
  }

  getDateString(dateInMillis) {
    const dp = new DatePipe(this.translate.currentLang);
    return dp.transform(new Date(+dateInMillis), 'yyyy-MM-dd');
  }
  
  ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
      this.items = this.database.subscribeToOpenedOrders();
      this.items.subscribe(
        (afa: AngularFireAction<DataSnapshot>[]) => {
          afa.reverse().forEach(order => {
            this.updateItemsArray(order);
            this.filterOrders();
          });
        });
      
    } else {
      this.database.unsubscribeFromAuth(this);
    }
  }

  updateItemsArray (order) {
    
    const myUid = this.database.getCurrentUser().child('uid').val();
    if (order.userId !== myUid) {
      const index = this.itemsArray.indexOf(order, 0);
      if (index !== -1) {
        this.itemsArray[index] = order;
      } else {
        this.itemsArray.push(order);
      }
    } else {
      const index = this.itemsArray.indexOf(order, 0);
      if (index !== -1) {
        this.itemsArray.splice(index, 1);
      }
    }
  }

  filterOrders() {
    
    if (this.itemsArray === undefined || this.itemsArray.length <= 0) {
      console.log('array is empty');
      return;
    }
    
    const northLat = Constants.NORTH_LAT;
    const southLat = Constants.SOUTH_LAT;
    
    const areaFrom = this.selectionAreaFromRef.nativeElement.value;
    const areaTo = this.selectionAreaToRef.nativeElement.value;
    const startingDateTime = this.startingDateRef.nativeElement.value;
    const endingDateTime = this.endingDateRef.nativeElement.value;
    
    this.filteredItemsArray = this.itemsArray.filter(order => {
      
      if (areaFrom > 0) {
        // has area filter
        
        if (areaFrom === '1') {
          // north
          
          if (order.pickupLat < northLat) {
            // if its not north
            
            return false;
          }
        } else if (areaFrom === '2') {
          // center
          if (order.pickupLat > northLat || order.pickupLat < southLat) {
            // if its not north
            
            return false;
          }
        } else if (areaFrom === '3') {
          // south
          
          if (order.pickupLat > southLat) {
            // if its not north
            
            return false;
          }
        }
      }
      
      if (areaTo > 0) {
        // has area filter
        
        if (areaTo === '1') {
          // north
          
          if (order.destinationLat < northLat) {
            // if its not north
            
            return false;
          }
        } else if (areaTo === '2') {
          // center
          if (order.destinationLat > northLat || order.destinationLat < southLat) {
            // if its not north
            
            return false;
          }
        } else if (areaTo === '3') {
          // south
          
          if (order.destinationLat > southLat) {
            // if its not north
            
            return false;
          }
        }
      }
      
      if (startingDateTime !== undefined) {
        // has starting date
        const startingDate = new Date(startingDateTime);
        startingDate.setHours(0, 0, 0, 0);
        const pickupDate = new Date(order.pickupDate);
        pickupDate.setHours(0, 0, 0, 0);
        
        if (pickupDate < startingDate) {
          // pickup date before starting date
          
          return false;
        }
        
      }
      
      if (endingDateTime !== undefined) {
        // has ending date
        const endingDate = new Date(endingDateTime);
        endingDate.setHours(0, 0, 0, 0);
        const pickupDate = new Date(order.pickupDate);
        pickupDate.setHours(0, 0, 0, 0);
        
        if (pickupDate > endingDate) {
          // pickup date after ending date
          
          return false;
        }
      }
      
      return true;
      
    });
  }
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
