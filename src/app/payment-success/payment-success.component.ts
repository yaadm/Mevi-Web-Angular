import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../router.animations';

@Component({
    selector: 'app-signup',
    templateUrl: './payment-success.component.html',
    styleUrls: ['./payment-success.component.scss'],
    animations: [routerTransition()]
})
export class PaymentSuccessComponent implements OnInit {

    constructor() { }

    ngOnInit() { }
}
