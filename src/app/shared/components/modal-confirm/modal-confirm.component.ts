import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogComponent, DialogService } from 'ngx-bootstrap-modal';

export interface ConfirmModel {
  title: string;
  message: string;
  subMessage: string;
}

@Component({
    selector: 'app-modal-confirm',
    templateUrl: './modal-confirm.component.html',
    styleUrls: ['./modal-confirm.component.scss']
})
export class ModalConfirmComponent extends DialogComponent<ConfirmModel, boolean> implements ConfirmModel {

  title: string;
  message: string;
  subMessage: string;
  constructor(dialogService: DialogService) {
    super(dialogService);
  }
  confirm() {
    // we set dialog result as true on click on confirm button,
    // then we can get dialog result from caller code
    this.result = true;
    this.close();
  }
}
