import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManagerRegistrationResultComponent } from './manager-registration-result.component';

const routes: Routes = [
    { path: '', component: ManagerRegistrationResultComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ManagerRegistrationResultRoutingModule { }
