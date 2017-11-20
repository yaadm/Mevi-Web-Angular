import { ModalConfirmComponent } from '../modal-confirm/modal-confirm.component';
import { ModalInformComponent } from '../modal-inform/modal-inform.component';
import { ModalInputComponent } from '../modal-input/modal-input.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        RouterModule
    ],
    declarations: [ ModalInputComponent, ModalConfirmComponent, ModalInformComponent ],
    exports: [ ModalConfirmComponent, ModalInputComponent, ModalInformComponent ],
    entryComponents: [ ModalInputComponent, ModalConfirmComponent, ModalInformComponent ]
})
export class SharedModalModuleModule { }
