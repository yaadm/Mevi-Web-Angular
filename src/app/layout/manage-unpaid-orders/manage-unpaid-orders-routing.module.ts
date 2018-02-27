import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageUnpaidOrdersComponent } from './manage-unpaid-orders.component';

const routes: Routes = [
    { path: '', component: ManageUnpaidOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ManageUnpaidOrdersRoutingModule { }
