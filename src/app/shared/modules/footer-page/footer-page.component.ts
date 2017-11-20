import { Component, OnInit, Input, Output, EventEmitter, PipeTransform, Pipe } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-footer-page',
    templateUrl: './footer-page.component.html',
    styleUrls: ['./footer-page.component.scss']
})
export class FooterPageComponent implements OnInit {
    constructor(private translate: TranslateService) { }

    ngOnInit() {}

}
