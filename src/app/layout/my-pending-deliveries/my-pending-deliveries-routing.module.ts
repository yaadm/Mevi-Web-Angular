import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyPendingDeliveriesComponent } from './my-pending-deliveries.component';

const routes: Routes = [
    { path: '', component: MyPendingDeliveriesComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyPendingDeliveriesRoutingModule { }
