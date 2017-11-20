import { routerTransition } from '../../router.animations';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
    animations: [routerTransition()]
})
export class AboutUsPageComponent implements OnInit {
    constructor() {
    }

    ngOnInit() {
    }
}
