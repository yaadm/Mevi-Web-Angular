import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManagersRegistrationRequestsComponent } from './managers-registration-requests.component';

const routes: Routes = [
    { path: '', component: ManagersRegistrationRequestsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ManagersRegistrationRequestsRoutingModule { }
