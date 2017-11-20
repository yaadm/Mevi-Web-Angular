import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManagerRegistrationComponent } from './manager-registration.component';

const routes: Routes = [
    { path: '', component: ManagerRegistrationComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ManagerRegistrationRoutingModule { }
