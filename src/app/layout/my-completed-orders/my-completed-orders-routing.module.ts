import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyCompletedOrdersComponent } from './my-completed-orders.component';

const routes: Routes = [
    { path: '', component: MyCompletedOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyCompletedOrdersRoutingModule { }
