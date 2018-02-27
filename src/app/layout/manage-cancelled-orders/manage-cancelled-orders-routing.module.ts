import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageCancelledOrdersComponent } from './manage-cancelled-orders.component';

const routes: Routes = [
    { path: '', component: ManageCancelledOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ManageCancelledOrdersRoutingModule { }
