import { Component, OnInit, Input, Output, EventEmitter, PipeTransform, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-user-rating',
    templateUrl: './user-rating.component.html',
    styleUrls: ['./user-rating.scss']
})
export class UserRatingComponent implements OnInit {
    @Input() public user: any;
    constructor(private translate: TranslateService) { }

    ngOnInit() {}

}
