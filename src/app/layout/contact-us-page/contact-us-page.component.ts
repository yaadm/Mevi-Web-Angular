import { routerTransition } from '../../router.animations';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-contact-us-page',
    templateUrl: './contact-us-page.component.html',
    styleUrls: ['./contact-us-page.component.scss'],
    animations: [routerTransition()]
})
export class ContactUsPageComponent implements OnInit {
    constructor() {
    }

    ngOnInit() {
    }
}
