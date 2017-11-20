import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OpenOrdersComponent } from './open-orders.component';

const routes: Routes = [
    { path: '', component: OpenOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OpenOrdersRoutingModule { }
