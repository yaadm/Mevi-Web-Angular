import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { AuthListener } from '../../shared/services';
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
  
  @ViewChild('selectionAreaFrom')
  public selectionAreaFromRef: ElementRef;
    
  @ViewChild('selectionAreaTo')
  public selectionAreaToRef: ElementRef;
  
  @ViewChild('startingDate')
  public startingDateRef: ElementRef;
  
  @ViewChild('endingDate')
  public endingDateRef: ElementRef;
  
  constructor(private translate: TranslateService, public database: DatabaseService) {
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }
  
  onSearch() {
    
    this.filterOrders();
  }

  filterOrders() {
    
    const northLat = 32.41;
    const southLat = 31.86;
    
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
  
  ngOnInit() {
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

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
