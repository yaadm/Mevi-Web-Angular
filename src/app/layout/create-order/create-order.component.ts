import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, NgZone, EventEmitter, isDevMode } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalConfirmComponent } from '../../shared';
import { ModalInformComponent } from '../../shared/components/modal-inform/modal-inform.component';
import { Constants } from '../../shared/services/database/database.service';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AgmCoreModule, MapsAPILoader, AgmMap } from '@agm/core';
import { DatePipe } from '@angular/common';
import { } from '@types/googlemaps';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from 'ngx-bootstrap-modal';
import * as firebase from 'firebase';
import { Router } from '@angular/router';
import { StepperOptions, NgxStepperComponent } from 'ngx-stepper';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { delay } from 'q';

@Component({
  selector: 'app-create-order-page',
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
  animations: [routerTransition()]
})
export class CreateOrderComponent implements OnInit {

  isDevMode: boolean;
  defaultGeocoderEvent = {
    coords: {
      lat: 32.085300,
      lng: 34.781768
    }
  }  

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
  
  @ViewChild('selectorCargoShippingOptions')
  public selectorCargoShippingOptions: ElementRef;
  
  @ViewChild('placesRef') 
  public placesRef: GooglePlaceDirective;
    
  @ViewChild('stepperDemo')
  public steppers: NgxStepperComponent;
  
  @ViewChild('checkboxIsTestAccount')
  public checkboxIsTestAccount: ElementRef;
  
  public stepperOptions: StepperOptions = {
    enableSvgIcon: true,
    mobileStepText: false
  };
  
  public gpacOptions = {
    componentRestrictions: { country: 'IL' }
  }
  
  public mToMapVisibility = false;
  public mFromMapVisibility = false;
  
  constructor(private translate: TranslateService, private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone, public database: DatabaseService, private dialogService: DialogService,
    private router: Router, private _iconRegistry: MatIconRegistry, private _sanitizer: DomSanitizer) {
    this.isDevMode = isDevMode();
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
    } else if (new Date(this.pickupDateRef.nativeElement.value) < this.database.getTodayDate()) {
      this.showInfoMessage('תאריך ההעמסה שנבחר עבר');
      console.log('pickupDate: ' + new Date(this.pickupDateRef.nativeElement.value));
      console.log('nowDate: ' + new Date());
      return;
    }
    
    
    
    // TODO: check if input date > current date -> show error message
    
    this.steppers.next();
    
    
    // this.initToMap();
  }
  
  public finishStepTwo() {
    
    if (!this.toSearchElementRef.nativeElement.value) {
      this.showInfoMessage('חובה להזין כתובת מיקום פריקה');
      return;
    } else if (!this.toLatitude || !this.toLongitude) {
      this.showInfoMessage('חובה להזין מיקום פריקה');
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
    
    // Fetch GeoCoder for reverse geocoding
      this.geoCoder = new google.maps.Geocoder;

      this.toMarkerDragEnd(this.defaultGeocoderEvent);

      // set current position
      setTimeout(() => { this.setToCurrentPosition(); }, 1000);
      
      const autocomplete = new google.maps.places.Autocomplete(this.toSearchElementRef.nativeElement);
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          
          const address: google.maps.places.PlaceResult = autocomplete.getPlace();
          console.log('address:' + address.formatted_address);
          // get the place result

          // verify result
          if (address.geometry === undefined || address.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.toLatitude = address.geometry.location.lat();
          this.toLongitude = address.geometry.location.lng();
          this.toZoom = 12;
        });
      });
  }
  
  ngOnInit() {
    
    const nowDate = new DatePipe('en').transform(new Date(), 'yyyy-MM-dd');
    this.pickupDateRef.nativeElement.value = nowDate.toString();
    const nowTime = new DatePipe('en').transform(new Date(), 'hh:mm');
    this.pickupTimeRef.nativeElement.value = nowTime.toString();
    this._iconRegistry.addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('./assets/svgs/check.svg'));
    
    // set google maps defaults
    // create search FormControl
    this.searchControl = new FormControl();

    
    // load Places AutoComplete
    this.mapsAPILoader.load().then(() => {

      // Fetch GeoCoder for reverse geocoding
      this.geoCoder = new google.maps.Geocoder;

      this.fromMarkerDragEnd(this.defaultGeocoderEvent);
      
      // set current position
      setTimeout(() => { this.setFromCurrentPosition(); }, 1000);
      
      const autocomplete = new google.maps.places.Autocomplete(this.fromSearchElementRef.nativeElement);
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          
          const address: google.maps.places.PlaceResult = autocomplete.getPlace();
          console.log('address:' + address.formatted_address);
          // get the place result

          // verify result
          if (address.geometry === undefined || address.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.fromLatitude = address.geometry.location.lat();
          this.fromLongitude = address.geometry.location.lng();
          this.fromZoom = 12;
        });
      });

      this.initToMap();
      
    }, reason => {
      // on failed
      console.log('failed to load Maps API: ' + reason);
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

  private setFromCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {

        const event = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }

        this.fromMarkerDragEnd(event);

        this.fromLatitude = position.coords.latitude;
        this.fromLongitude = position.coords.longitude;
        this.fromZoom = 12;

      });
    }
  }

  private setToCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {

        const event = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }

        this.toMarkerDragEnd(event);

        this.toLatitude = position.coords.latitude;
        this.toLongitude = position.coords.longitude;
        this.toZoom = 12;
      });
    }
  }
  
  addNewProduct () {

    const productName = this.inputProductNameRef.nativeElement.value;
    const productQuantity = this.parseInt(this.inputProductsAmountRef.nativeElement.value);
    const selectorCargoShippingOptions = this.parseInt(this.selectorCargoShippingOptions.nativeElement.value);
    
    if (!productName) {
      console.log('inputProductName is empty');
      this.showInfoMessage('חובה להזין שם למוצר');
      return;
    } else if (!productQuantity || productQuantity <= 0) {
      console.log('inputProductsAmount is empty');
      this.showInfoMessage('חובה להזין כמות');
      return;
    } else if (!selectorCargoShippingOptions) {
      this.showInfoMessage('חובה לבחור איך אתה מעביר את הסחורה');
      return;
    }
    
    const item = {
      'name': productName,
      'quantity': productQuantity,
      'cargoShippingOptions': selectorCargoShippingOptions,
      'container': false,
      'onPallets': false,
      'width': 1,
      'height': 1,
      'length': 1,
      'weight': 10
    }
    
    if (selectorCargoShippingOptions === 1) {
      // pallets
      item.container = false;
      item.onPallets = true;
      
    } else if (selectorCargoShippingOptions === 2) {
      // container
      item.container = true;
      item.onPallets = false;
      
    } else if (selectorCargoShippingOptions === 3) {
      // sacks
      item.container = false;
      item.onPallets = false;
      
    } else if (selectorCargoShippingOptions === 4) {
      // other selected
      item.width = this.parseInt(this.selectorWidthRef.nativeElement.value);
      item.height = this.parseInt(this.selectorHeightRef.nativeElement.value);
      item.length = this.parseInt(this.selectorLengthRef.nativeElement.value);
      item.weight = this.parseInt(this.selectorWeightRef.nativeElement.value);
    }
    
    // TODO: should we add Fragile ?
    
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
    this.inputProductsAmountRef.nativeElement.value = 1;
    
    if (this.selectorWidthRef) {
      
      this.selectorWidthRef.nativeElement.value = 1;
    }
    
    if (this.selectorHeightRef) {
      
      this.selectorHeightRef.nativeElement.value = 1;
    }
    
    if (this.selectorLengthRef) {
      
      this.selectorLengthRef.nativeElement.value = 1;
    }
    
    if (this.selectorWeightRef) {
      
      this.selectorWeightRef.nativeElement.value = 10;
    }
    
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
      'test' : false
    }
    
    if (this.checkboxIsTestAccount && this.checkboxIsTestAccount.nativeElement && this.checkboxIsTestAccount.nativeElement.checked) {
      // this is a test account
      console.log('Created a Test Order !');
      payload.test = true;
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

  public handleFromAddressChange(address: Address) {
      this.ngZone.run(() => {
          
          console.log('address:' + address);
          // get the place result

          // verify result
          if (address.geometry === undefined || address.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.fromLatitude = address.geometry.location.lat;
          this.fromLongitude = address.geometry.location.lng;
          this.fromZoom = 12;
        });
  };
  
  public handleToAddressChange(address: Address) {
      this.ngZone.run(() => {
          
          console.log('address:' + address);
          // get the place result

          // verify result
          if (address.geometry === undefined || address.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.toLatitude = address.geometry.location.lat;
          this.toLongitude = address.geometry.location.lng;
          this.toZoom = 12;
        });
  };
  
  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
