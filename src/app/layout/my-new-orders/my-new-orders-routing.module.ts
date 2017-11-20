import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyNewOrdersComponent } from './my-new-orders.component';

const routes: Routes = [
    { path: '', component: MyNewOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MyNewOrdersRoutingModule { }
