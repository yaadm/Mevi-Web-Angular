import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyPendingOrdersComponent } from './my-pending-orders.component';

const routes: Routes = [
    { path: '', component: MyPendingOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyPendingOrdersRoutingModule { }
