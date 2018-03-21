import { routerTransition } from '../../router.animations';
import { OnInit, OnDestroy, Component, ChangeDetectionStrategy, ViewChild, TemplateRef } from '@angular/core';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
import { Subject } from 'rxjs/Subject';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { DatabaseService, AuthListener } from '../../shared';
import { Router } from '@angular/router';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  },
  green: {
    primary: '#186A3B',
    secondary: '#239B56'
  }
};

const searchInDate = 'searchInDate';

@Component({
    selector: 'app-my-calendar',
    templateUrl: './my-calendar.component.html',
    styleUrls: ['./my-calendar.component.scss'],
    animations: [routerTransition()]
})
export class MyCalendarComponent implements OnInit, OnDestroy, AuthListener {
  @ViewChild('modalContent') modalContent: TemplateRef<any>;

  view = 'month';

  viewDate: Date = new Date();

  modalData: {
    action: string;
    event: CalendarEvent;
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];

  activeDayIsOpen = false;

  constructor(public database: DatabaseService, private router: Router) {
    
  }

  ngOnInit(): void {
    this.database.subscribeToAuth(this);
  }
  
  ngOnDestroy(): void {
    this.database.unsubscribeFromAuth(this);
  }
  
  onUserChanged(user: any) {
    if (user) {
      const myOrdersList = this.database.getMyOrders().then(myOrdersSnapshot => {
        
        myOrdersSnapshot.forEach(orderSnapshot => {
          
          if (orderSnapshot.child('orderStatus').val() > 0) {
            this.addEvent(orderSnapshot);
          }
        });
        
        const myDeliveriesList = this.database.getMyDeliveries().then(myDeliveriesSnapshot => {
        
        myDeliveriesSnapshot.forEach(orderSnapshot => {
          
            this.addEvent(orderSnapshot);
        });
      });
      });
    }
  }
  
  addEvent(orderSnapshot): void {
    
    const orderStatus = orderSnapshot.child('orderStatus').val();
    const myId = this.database.currentUser.child('uid').val();
    
    let selectedColor = colors.red;
    let eventTitle: string;
    
    if (orderSnapshot.child('selectedBid').val() === myId) { // my delivery
      selectedColor = colors.yellow;
      eventTitle = 'הובלה: ';
    } else if (orderSnapshot.child('userId').val() === myId) { // my order
      selectedColor = colors.green;
      eventTitle = 'הזמנה: ';
    } else if (orderStatus === 0) {
      return;
    }
    
    const selectedBid = orderSnapshot.child('selectedBid').val();
    const deliveryDate = orderSnapshot.child('bidsList').child(selectedBid).child('pickupDate').val();
    
    this.events.push({
      title: eventTitle + orderSnapshot.child('orderId').val(),
      start: new Date(deliveryDate),
      end: new Date(deliveryDate),
      color: selectedColor,
      meta: orderSnapshot.child('orderId').val()
    });
    this.refresh.next();
  }
  
  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    
    const isManager = this.database.currentUser.child('manager').val();
    const isPast = this.database.getTodayDate() > date;
    if (isManager && !isPast) {
      
      if (!this.activeDayIsOpen) {
      
        this.events.push({
          title: 'חפש עבודה למשאיות ביום זה',
          start: date,
          end: date,
          color: colors.blue,
          meta: searchInDate
        });
      }
      
      this.activeDayIsOpen = !this.activeDayIsOpen;
      
      if (this.activeDayIsOpen) {
        
        this.viewDate = date;
      } else {
        
        this.events.splice(this.events.length - 1, 1);
      }
      this.refresh.next();
    
    } else {
      
      if (isSameMonth(date, this.viewDate)) {
        if (
          (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
          events.length === 0
        ) {
          this.activeDayIsOpen = false;
        } else {
          this.activeDayIsOpen = true;
          this.viewDate = date;
        }
      }
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    
    if (event.meta === searchInDate) {
      
      this.router.navigate(['/open-orders-page', 0, 0, event.start.getTime(), event.end.getTime()]);
    } else {
      
      this.router.navigate(['/order-details', event.meta]);
    }
    
  }

}
