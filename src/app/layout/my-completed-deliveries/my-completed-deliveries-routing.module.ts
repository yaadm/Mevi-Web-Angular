import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyCompletedDeliveriesComponent } from './my-completed-deliveries.component';

const routes: Routes = [
    { path: '', component: MyCompletedDeliveriesComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyCompletedDeliveriesRoutingModule { }
