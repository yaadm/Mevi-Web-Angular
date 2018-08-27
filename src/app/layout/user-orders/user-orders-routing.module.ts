import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserOrdersComponent } from './user-orders.component';

const routes: Routes = [
    { path: '', component: UserOrdersComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserOrdersRoutingModule { }
