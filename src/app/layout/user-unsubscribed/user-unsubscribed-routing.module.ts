import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserUnsubscribedComponent } from './user-unsubscribed.component';

const routes: Routes = [
    { path: '', component: UserUnsubscribedComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserUnsubscribedRoutingModule { }
