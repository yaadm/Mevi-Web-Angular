import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogComponent, DialogService } from 'ngx-bootstrap-modal';

export interface ConfirmModel {
  title: string;
  message: string;
}

@Component({
    selector: 'app-modal-inform',
    templateUrl: './modal-inform.component.html',
    styleUrls: ['./modal-inform.component.scss']
})
export class ModalInformComponent extends DialogComponent<ConfirmModel, boolean> implements ConfirmModel {

  title: string;
  message: string;
  subMessage: string;
  linkUrl: string[];
  linkText: string;
  
  constructor(dialogService: DialogService) {
    super(dialogService);
  }
  confirm() {
    // we set dialog result as true on click on confirm button,
    // then we can get dialog result from caller code
    this.result = true;
    this.close();
  }
  
  onLinkClicked() {
    this.result = true;
    this.close();
  }
}
