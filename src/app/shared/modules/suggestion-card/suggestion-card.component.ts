import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-suggestion-card',
    templateUrl: './suggestion-card.component.html',
    styleUrls: ['./suggestion-card.component.scss']
})
export class SuggestionCardComponent implements OnInit {
    @Input() bgClass: string;
    @Input() icon: string;
    @Input() header: string;
    @Input() text: string;
    @Input() action: number;
    @Input() actionRout: string;
    @Input() actionLink: string;
    @Output() event: EventEmitter<any> = new EventEmitter();

    constructor(private translate: TranslateService) { }

    ngOnInit() {}
}
