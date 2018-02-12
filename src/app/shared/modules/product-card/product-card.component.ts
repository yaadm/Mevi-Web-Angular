import { DatabaseService, firebaseConfigDebug } from '../../services/database/database.service';
import { Component, OnInit, Input, Output, EventEmitter, PipeTransform, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';


@Pipe({name: 'resolveShippingOptions'})
export class ResolveShippingOptionsPipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 1:
        return 'משטחים';
      case 2:
        return 'קונטיינר';
      case 3:
        return 'שקים (באלות)';
       case 4:
        return 'אחר';
    }
    return 'לא ידוע';
  }
}

@Pipe({name: 'resolveSize'})
export class ResolveSizePipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 1:
        return '1';
      case 2:
        return '2';
      case 3:
        return '3';
       case 4:
        return '4';
       case 5:
        return '5 ';
       case 6:
        return '6 ';
       case 7:
        return '7 ';
       case 8:
        return '8 ';
       case 9:
        return 'מעל 8';
    }
    return 'לא ידוע';
  }
}

@Pipe({name: 'resolveWeight'})
export class ResolveWeightPipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 10:
        return 'עד 10 קילו';
      case 20:
        return 'עד 20 קילו';
      case 50:
        return 'עד 50 קילו';
       case 200:
        return 'עד 200 קילו';
       case 500:
        return 'עד 500 קילו';
       case 1000:
        return 'עד 1 טון';
       case 2000:
        return 'עד 2 טון';
       case 5000:
        return 'עד 5 טון';
       case 5001:
        return 'מעל 5 טון';
    }
    return 'לא ידוע';
  }
}

@Component({
    selector: 'app-product-card',
    templateUrl: './product-card.component.html',
    styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnInit {
    @Input() public productItem: any;
    @Input() public productsList: any;
    @Input() public isEditable = true;
    constructor(private translate: TranslateService, public database: DatabaseService) { }

    ngOnInit() {}

    removeProduct(productItem) {
      const index = this.productsList.indexOf(productItem);
      if (index !== -1) {
        this.productsList.splice(index, 1);
      }
    }
}
