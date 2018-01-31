import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, NgZone } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalConfirmComponent } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { Constants } from '../../shared/services/database/database.service';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AgmCoreModule, MapsAPILoader, AgmMap } from '@agm/core';
import { DatePipe } from '@angular/common';
import {} from '@types/googlemaps';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from 'ngx-bootstrap-modal';
import * as firebase from 'firebase';
import { Router } from '@angular/router';
import { StepperOptions, NgxStepperComponent } from 'ngx-stepper';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

@Component({
  selector: 'app-create-order-page',
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
  animations: [routerTransition()]
})
export class CreateOrderComponent implements OnInit {

  loading = false;
  
  public fromLatitude: number;
  public fromLongitude: number;
  public fromZoom = 12;
  public toLatitude: number;
  public toLongitude: number;
  public toZoom = 12;
  public searchControl: FormControl;
  private geoCoder;
  model: any;
  public productsList = [];

  @ViewChild('fromCompanyName')
  public fromCompanyNameRef: ElementRef;

  @ViewChild('fromSearch')
  public fromSearchElementRef: ElementRef;

  @ViewChild('pickupDate')
  public pickupDateRef: ElementRef;

  @ViewChild('pickupTime')
  public pickupTimeRef: ElementRef;

  @ViewChild('toCompanyName')
  public toCompanyNameRef: ElementRef;

  @ViewChild('toSearch')
  public toSearchElementRef: ElementRef;

  @ViewChild('selectionInsurance')
  public selectionInsuranceRef: ElementRef;

  @ViewChild('selectionUloadingType')
  public selectionUnloadingTypeRef: ElementRef;

  @ViewChild('selectionOrderType')
  public selectionOrderTypeRef: ElementRef;

  @ViewChild('selectorTruckType')
  public selectorTruckTypeRef: ElementRef;

  @ViewChild('selectorTruckSubType')
  public selectorTruckSubTypeRef: ElementRef;

  @ViewChild('inputTrucksCount')
  public inputTrucksCountRef: ElementRef;

  @ViewChild('inputProductName')
  public inputProductNameRef: ElementRef;

  @ViewChild('inputProductsAmount')
  public inputProductsAmountRef: ElementRef;

  @ViewChild('checkboxIsContainer')
  public checkboxIsContainerRef: ElementRef;

  @ViewChild('checkboxIsOnPallets')
  public checkboxIsOnPallets: ElementRef;

  @ViewChild('checkboxIsFregile')
  public checkboxIsFregileRef: ElementRef;

  @ViewChild('selectorWidth')
  public selectorWidthRef: ElementRef;

  @ViewChild('selectorHeight')
  public selectorHeightRef: ElementRef;

  @ViewChild('selectorLength')
  public selectorLengthRef: ElementRef;

  @ViewChild('selectorWeight')
  public selectorWeightRef: ElementRef;

  @ViewChild('checkboxPaymentCash')
  public checkboxPaymentCashRef: ElementRef;
  
  @ViewChild('checkboxPaymentCredit')
  public checkboxPaymentCreditRef: ElementRef;
  
  @ViewChild('checkboxPaymentWire')
  public checkboxPaymentWireRef: ElementRef;
  
  @ViewChild('checkboxPaymentCheck')
  public checkboxPaymentCheckRef: ElementRef;
  
  @ViewChild('inputAdditionalInfo')
  public inputAdditionalInfoRef: ElementRef;
  
  @ViewChild('stepperDemo')
  public steppers: NgxStepperComponent;
  
  public options: StepperOptions = {
    enableSvgIcon: true,
    mobileStepText: false
  };
  
  public mToMapVisibility = false;
  public mFromMapVisibility = false;
  
  constructor(private translate: TranslateService, private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone, private database: DatabaseService, private dialogService: DialogService,
    private router: Router, private _iconRegistry: MatIconRegistry, private _sanitizer: DomSanitizer) {
    this.setupTranslation(translate);
  }

  public selectCampaign(): void {
    this.steppers.showFeedback('Checking, please wait ...');
    this.steppers.next();
    if (this.steppers.currentStep === 1) {
      this.initToMap();
    }
  }
  
  public finishStepOne() {
    
    if (!this.fromSearchElementRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת מיקום העמסה');
      return;
    } else if (this.fromLatitude === undefined || this.fromLongitude === undefined) {
      this.showInfoMessage('חובה להזין מיקום העמסה');
      return;
    } else if (!this.pickupDateRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין תאריך העמסה');
      return;
    } else if (!this.pickupTimeRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין שעת העמסה');
      return;
    }
    
    this.steppers.next();
    this.initToMap();
  }
  
  public finishStepTwo() {
    
    if (!this.toSearchElementRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת מיקום פריקה');
      return;
    } else if (!this.selectionUnloadingTypeRef.nativeElement.value) {
      this.showInfoMessage('חובה לבחור סוג פריקה');
      return;
    }
    
    this.steppers.next();
  }
  
  public finishStepThree() {
    
    if (!this.selectionInsuranceRef.nativeElement.value) {
      this.showInfoMessage('חובה לבחור סוג ביטוח');
      return;
    } else if (!this.selectionOrderTypeRef.nativeElement.value || this.selectionOrderTypeRef.nativeElement.value <= 0) {
      this.showInfoMessage('חובה לבחור סוג הזמנה');
      return;
    } else if (this.parseInt(this.selectionOrderTypeRef.nativeElement.value) === 1) {
      // Products
      
      if (this.productsList.length <= 0) {
        this.showInfoMessage('חובה להזין לפחות מוצר אחד');
        return;
      }
      
    } else if (this.parseInt(this.selectionOrderTypeRef.nativeElement.value) === 2) {
      // Trucks
      
      if (!this.inputTrucksCountRef.nativeElement.value || this.inputTrucksCountRef.nativeElement.value <= 0) {
        this.showInfoMessage('חובה להזין כמות משאיות חיובית');
        return;
      }
      
    }
    
    this.steppers.next();
    
  }
  
  public toggleFromMapVisibility() {
    this.mFromMapVisibility = !this.mFromMapVisibility;
  }
  
  public toggleToMapVisibility() {
    this.mToMapVisibility = !this.mToMapVisibility;
  }
  
  initToMap () {
    this.mapsAPILoader.load().then(() => {
      // Fetch GeoCoder for reverse geocoding
      this.geoCoder = new google.maps.Geocoder;

      const event = {
        coords: {
          lat: 32.085300,
          lng: 34.781768
        }
      }
      this.toMarkerDragEnd(event);

      // set current position
      this.setCurrentPosition();

      const autocompleteTo = new google.maps.places.Autocomplete(this.toSearchElementRef.nativeElement, {
        types: ['address']
      });
      autocompleteTo.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocompleteTo.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.toLatitude = place.geometry.location.lat();
          this.toLongitude = place.geometry.location.lng();
          this.toZoom = 12;
        });
      });
    });
  }
  
  ngOnInit() {

    const nowDate = new DatePipe(this.translate.currentLang).transform(new Date(), 'yyyy-MM-dd');
    this.pickupDateRef.nativeElement.value = nowDate.toString();
    const nowTime = new DatePipe(this.translate.currentLang).transform(new Date(), 'hh:mm');
    this.pickupTimeRef.nativeElement.value = nowTime.toString();
    
    this._iconRegistry.addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('./assets/svgs/check.svg'));

    
    // set google maps defaults
    // create search FormControl
    this.searchControl = new FormControl();

    // load Places AutoComplete
    this.mapsAPILoader.load().then(() => {

      // Fetch GeoCoder for reverse geocoding
      this.geoCoder = new google.maps.Geocoder;

      const event = {
        coords: {
          lat: 32.085300,
          lng: 34.781768
        }
      }
      this.fromMarkerDragEnd(event);

      // set current position
      this.setCurrentPosition();

      const autocompleteFrom = new google.maps.places.Autocomplete(this.fromSearchElementRef.nativeElement, {
        types: ['address']
      });
      autocompleteFrom.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocompleteFrom.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.fromLatitude = place.geometry.location.lat();
          this.fromLongitude = place.geometry.location.lng();
          this.fromZoom = 12;
        });
      });
    });
  }

  public fromMarkerDragEnd ($event) {
    this.fromLatitude = $event.coords.lat;
    this.fromLongitude = $event.coords.lng;
    this.geoCoder.geocode({'location': {lat: this.fromLatitude, lng: this.fromLongitude }}, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          this.fromSearchElementRef.nativeElement.value = results[0].formatted_address;
          // console.log(this.searchElementRef.nativeElement.value);
          // infowindow.setContent(results[0].formatted_address);

        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

    });
  }

  public toMarkerDragEnd ($event) {
    this.toLatitude = $event.coords.lat;
    this.toLongitude = $event.coords.lng;
    this.geoCoder.geocode({'location': {lat: this.toLatitude, lng: this.toLongitude }}, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          this.toSearchElementRef.nativeElement.value = results[0].formatted_address;
          // console.log(this.searchElementRef.nativeElement.value);
          // infowindow.setContent(results[0].formatted_address);

        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

    });
  }

  private setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {

        const event = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }

        this.fromMarkerDragEnd(event);
        this.toMarkerDragEnd(event);

        this.fromLatitude = position.coords.latitude;
        this.fromLongitude = position.coords.longitude;
        this.fromZoom = 12;

        this.toLatitude = position.coords.latitude;
        this.toLongitude = position.coords.longitude;
        this.toZoom = 12;
      });
    }
  }

  addNewProduct () {

    if (!this.inputProductNameRef.nativeElement.value) {
      console.log('inputProductName is empty');
      return;
    } else if (!this.inputProductsAmountRef.nativeElement.value || this.inputProductsAmountRef.nativeElement.value <= 0) {
      console.log('inputProductsAmount is empty');
      return;
    }

    const item = {
      'name': this.inputProductNameRef.nativeElement.value,
      'quantity': this.parseInt(this.inputProductsAmountRef.nativeElement.value),
      'container': this.checkboxIsContainerRef.nativeElement.checked,
      'onPallets': this.checkboxIsOnPallets.nativeElement.checked,
      'fragile': this.checkboxIsFregileRef.nativeElement.checked,
      'width': this.parseInt(this.selectorWidthRef.nativeElement.value),
      'height': this.parseInt(this.selectorHeightRef.nativeElement.value),
      'length': this.parseInt(this.selectorLengthRef.nativeElement.value),
      'weight': this.parseInt(this.selectorWeightRef.nativeElement.value)
    }

    this.productsList.push(item);

    this.resetAddProductForm();

    setTimeout(() =>  { document.getElementById('product' + this.productsList.indexOf(item).toString()).scrollIntoView() }, 500)
  }

  removeProduct(productItem) {
    const index = this.productsList.indexOf(productItem);
    if (index !== -1) {
      this.productsList.splice(index, 1);
    }
  }

  resetAddProductForm() {
    this.inputProductNameRef.nativeElement.value = '';
    this.inputProductsAmountRef.nativeElement.value = '';
    this.checkboxIsContainerRef.nativeElement.checked = false;
    this.checkboxIsOnPallets.nativeElement.checked = false;
    this.checkboxIsFregileRef.nativeElement.checked = false;
    this.selectorWidthRef.nativeElement.value = 1;
    this.selectorHeightRef.nativeElement.value = 1;
    this.selectorLengthRef.nativeElement.value = 1;
    this.selectorWeightRef.nativeElement.value = 10;
  }

  isAnyPaymentMethodChecked () {
    
    return this.checkboxPaymentCashRef.nativeElement.checked || 
      this.checkboxPaymentCreditRef.nativeElement.checked ||
      this.checkboxPaymentWireRef.nativeElement.checked || 
      this.checkboxPaymentCheckRef.nativeElement.checked;
  }
  
  public publishOrder () {

    if (!this.fromSearchElementRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת מיקום העמסה');
      return;
    } else if (this.fromLatitude === undefined || this.fromLongitude === undefined) {
      this.showInfoMessage('חובה להזין מיקום העמסה');
      return;
    } else if (!this.pickupDateRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין תאריך העמסה');
      return;
    } else if (!this.pickupTimeRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין שעת העמסה');
      return;
    } else if (!this.toSearchElementRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת מיקום פריקה');
      return;
    } else if (this.toLatitude === undefined || this.toLongitude === undefined) {
      this.showInfoMessage('חובה להזין מיקום פריקה');
      return;
    } else if (!this.selectionInsuranceRef.nativeElement.value) {
      this.showInfoMessage('חובה לבחור סוג ביטוח');
      return;
    } else if (!this.selectionUnloadingTypeRef.nativeElement.value) {
      this.showInfoMessage('חובה לבחור סוג פריקה');
      return;
    } else if (!this.selectionOrderTypeRef.nativeElement.value || this.selectionOrderTypeRef.nativeElement.value <= 0) {
      this.showInfoMessage('חובה לבחור סוג הזמנה');
      return;
    } else if (!this.isAnyPaymentMethodChecked()) {
      this.showInfoMessage('חובה לבחור סוג תשלום אפשרי לחברת ההובלות');
      return;
    }

    const possiblePaymentMethods = {
      'paymentCash': this.checkboxPaymentCashRef.nativeElement.checked,
      'paymentCredit': this.checkboxPaymentCreditRef.nativeElement.checked,
      'paymentWire': this.checkboxPaymentWireRef.nativeElement.checked,
      'paymentCheck': this.checkboxPaymentCheckRef.nativeElement.checked
    }
    
    const payload = {
      'orderStatus' : 0,
      'publishedAt' : firebase.database.ServerValue.TIMESTAMP,
      
      'userId' : this.database.getCurrentUser().child('uid').val(),
      'companyId' : this.database.getCurrentUser().child('companyId').val(),
      'userImage' : this.database.getCurrentUser().child('imageUrl').val(),
      'userName' : this.database.getCurrentUser().child('name').val(),
      'userEmail' : this.database.getCurrentUser().child('email').val(),
      'companyPhone' : this.database.getCurrentUser().child('companyPhone').val(),
      
      'pickupLat' : this.fromLatitude,
      'pickupLng' : this.fromLongitude,
      'pickupLocationName' : this.fromSearchElementRef.nativeElement.value,
      'pickupDate' : new Date(this.pickupDateRef.nativeElement.value).getTime(),
      'pickupTime' : this.getMillisFromTimeInput(this.pickupTimeRef.nativeElement.value),
      
      'destinationLat' : this.toLatitude,
      'destinationLng' : this.toLongitude,
      'destinationLocationName' : this.toSearchElementRef.nativeElement.value,
      'destinationBusinessName' : this.toSearchElementRef.nativeElement.value,
      
      'possiblePaymentMethods': possiblePaymentMethods,
      
      'note' : this.inputAdditionalInfoRef.nativeElement.value,
      'insurance' : this.parseInt(this.selectionInsuranceRef.nativeElement.value),
      'unloading' : this.parseInt(this.selectionUnloadingTypeRef.nativeElement.value),
      'orderType' : this.parseInt(this.selectionOrderTypeRef.nativeElement.value),
      'truckType' : null,
      'truckSubType' : null,
      'truckQuantity' : null,
      'cargoList' : null,
      'orderId' : null,
    }
    
    if (this.parseInt(this.selectionOrderTypeRef.nativeElement.value) === 1) {
      // Products
      
      if (this.productsList.length <= 0) {
        this.showInfoMessage('חובה להזין לפחות מוצר אחד');
        return;
      }
      
      payload.cargoList = this.productsList;
      
    } else if (this.parseInt(this.selectionOrderTypeRef.nativeElement.value) === 2) {
      // Trucks
      
      if (!this.inputTrucksCountRef.nativeElement.value || this.inputTrucksCountRef.nativeElement.value <= 0) {
        this.showInfoMessage('חובה להזין כמות משאיות חיובית');
        return;
      }
      
      payload.truckType = this.parseInt(this.selectorTruckTypeRef.nativeElement.value);
      payload.truckSubType = this.parseInt(this.selectorTruckSubTypeRef.nativeElement.value);
      payload.truckQuantity = this.parseInt(this.inputTrucksCountRef.nativeElement.value);
      
    } else {
      // Should never get here.
      this.showInfoMessage('חובה לבחור סוג הזמנה - ?');
      return;
    }

    this.dialogService.addDialog(ModalConfirmComponent, {
      title: 'פרסום מודעה',
      message: 'האם אתה בטוח שברצונך לפרסם את ההזמנה ?'})
      .subscribe((isConfirmed) => {
          if (isConfirmed) {
            
            const newOrderId = this.database.generateOrderId();
            
            if (!newOrderId) {
              this.showInfoMessage('אירעה שגיאת מערכת, נא לנסות שוב מאוחר יותר');
              return;
            }
            
            this.loading = true;
            
            console.log('new Order Id = ' + newOrderId);
            payload.orderId = newOrderId;
            
            this.database.publishOrder(newOrderId, payload).then(_ => {
              // updated
              
              this.router.navigate(['/order-details', newOrderId]);
            }, reason => {
              // error
              this.loading = false;
            });
          } else {
          }
      });
  }

  showInfoMessage(modalMessage) {
    this.dialogService.addDialog(ModalInformComponent, { title: 'שגיאה', message: modalMessage });
  }

  parseInt(inputString): number {
    return parseInt(inputString, 10);
  }
  
  getMillisFromTimeInput(rawTime) {

    const split = rawTime.split(':');
    if (split.length <= 0) {
      console.error('rawTime input has no ":" characters !');
      return undefined;
    }
    try {
      const time = new Date();
      time.setHours(split[0], split[1], 0, 0);
      return time.getTime();
    } catch (e) {
      console.log(e.message);
    }
    return undefined;
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
