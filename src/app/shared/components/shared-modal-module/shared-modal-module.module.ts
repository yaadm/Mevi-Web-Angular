import { ModalConfirmComponent } from '../modal-confirm/modal-confirm.component';
import { ModalInformComponent } from '../modal-inform/modal-inform.component';
import { ModalInputComponent } from '../modal-input/modal-input.component';
import { ModalLoadingComponent } from '../modal-loading/modal-loading.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        RouterModule
    ],
    declarations: [ ModalInputComponent, ModalConfirmComponent, ModalInformComponent, ModalLoadingComponent ],
    exports: [ ModalConfirmComponent, ModalInputComponent, ModalInformComponent, ModalLoadingComponent ],
    entryComponents: [ ModalInputComponent, ModalConfirmComponent, ModalInformComponent, ModalLoadingComponent ]
})
export class SharedModalModuleModule { }
