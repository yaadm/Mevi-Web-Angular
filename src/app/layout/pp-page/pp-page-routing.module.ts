import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PpPageComponent } from './pp-page.component';

const routes: Routes = [
    { path: '', component: PpPageComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PpPageRoutingModule { }
