import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TosPageComponent } from './tos-page.component';

const routes: Routes = [
    { path: '', component: TosPageComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TosPageRoutingModule { }
