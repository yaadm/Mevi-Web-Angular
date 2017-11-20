import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, NgZone } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug, ModalLoadingModule, ModalConfirmComponent } from '../../shared';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AgmCoreModule, MapsAPILoader } from '@agm/core';
import {} from '@types/googlemaps';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
  selector: 'app-create-order-page',
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
  animations: [routerTransition()]
})
export class CreateOrderComponent implements OnInit {

  public fromLatitude: number;
  public fromLongitude: number;
  public fromZoom: number;
  public toLatitude: number;
  public toLongitude: number;
  public toZoom: number;
  public searchControl: FormControl;
  private geoCoder;
  model: any;
  public productsList = [];

  @ViewChild('fromTimePicker')
  public fromTimePickerRef: ElementRef;

  @ViewChild('fromSearch')
  public fromSearchElementRef: ElementRef;

  @ViewChild('toSearch')
  public toSearchElementRef: ElementRef;

  @ViewChild('inputProductName')
  public inputProductName: ElementRef;

  @ViewChild('inputProductsAmount')
  public inputProductsAmount: ElementRef;

  @ViewChild('checkboxIsContainer')
  public checkboxIsContainer: ElementRef;

  @ViewChild('checkboxIsOnPallets')
  public checkboxIsOnPallets: ElementRef;

  @ViewChild('checkboxIsFregile')
  public checkboxIsFregile: ElementRef;

  @ViewChild('selectorWidth')
  public selectorWidth: ElementRef;

  @ViewChild('selectorHeight')
  public selectorHeight: ElementRef;

  @ViewChild('selectorLength')
  public selectorLength: ElementRef;

  @ViewChild('selectorWeight')
  public selectorWeight: ElementRef;

  constructor(private translate: TranslateService, private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone, private database: DatabaseService, private dialogService: DialogService) {
    this.setupTranslation(translate);
  }

  ngOnInit() {

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
      this.toMarkerDragEnd(event);

      // set current position
      this.setCurrentPosition();

      const autocomplete = new google.maps.places.Autocomplete(this.fromSearchElementRef.nativeElement, {
        types: ['address']
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();

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

    if (!this.inputProductName.nativeElement.value) {
      console.log('inputProductName is empty');
      return;
    } else if (!this.inputProductsAmount.nativeElement.value || this.inputProductsAmount.nativeElement.value <= 0) {
      console.log('inputProductsAmount is empty');
      return;
    }

    const item = {
      name: this.inputProductName.nativeElement.value,
      quantity: this.inputProductsAmount.nativeElement.value,
      container: this.checkboxIsContainer.nativeElement.checked,
      onPallets: this.checkboxIsOnPallets.nativeElement.checked,
      fragile: this.checkboxIsFregile.nativeElement.checked,
      width: +this.selectorWidth.nativeElement.value,
      height: +this.selectorHeight.nativeElement.value,
      length: +this.selectorLength.nativeElement.value,
      weight: +this.selectorWeight.nativeElement.value
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
    this.inputProductName.nativeElement.value = '';
    this.inputProductsAmount.nativeElement.value = '';
    this.checkboxIsContainer.nativeElement.checked = false;
    this.checkboxIsOnPallets.nativeElement.checked = false;
    this.checkboxIsFregile.nativeElement.checked = false;
    this.selectorWidth.nativeElement.value = 1;
    this.selectorHeight.nativeElement.value = 1;
    this.selectorLength.nativeElement.value = 1;
    this.selectorWeight.nativeElement.value = 10;
  }

  public publishOrder () {
     this.showConfirmationDialog();
  }

  showConfirmationDialog () {
    this.dialogService.addDialog(ModalConfirmComponent, {
      title: 'פרסום מודעה',
      message: 'האם אתה בטוח שברצונך לפרסם את ההזמנה ?'})
      .subscribe((isConfirmed) => {
          if (isConfirmed) {
          } else {
          }
      });
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
