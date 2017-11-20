import { DatabaseService, firebaseConfigDebug } from '../../services/database/database.service';
import { Component, OnInit, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({name: 'resolveTruckType'})
export class ResolveTruckTypePipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'טריילר';
      case 1:
        return 'פול';
      case 2:
        return 'דאבל';
       case 3:
        return 'סינגל';
    }
    return 'לא ידוע';
  }
}

@Pipe({name: 'resolveTruckSubType'})
export class ResolveTruckSubTypePipe implements PipeTransform {
  transform(value: number): string {
    switch (value) {
      case 0:
        return 'פלטה';
      case 1:
        return 'הייבר (אמבטיה)';
      case 2:
        return 'וילונות';
       case 3:
        return 'קירור';
    }
    return 'לא ידוע';
  }
}

@Component({
    selector: 'app-truck-card',
    templateUrl: './truck-card.component.html',
    styleUrls: ['./truck-card.component.scss']
})
export class TruckCardComponent implements OnInit {
    @Input() public order: any;
    constructor(private translate: TranslateService, public database: DatabaseService) { }

    ngOnInit() {}
}
