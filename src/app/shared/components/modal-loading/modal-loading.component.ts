import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';

@Component({
    selector: 'app-modal-loading',
    templateUrl: './modal-loading.component.html',
    styleUrls: ['./modal-loading.component.scss']
})
export class ModalLoadingComponent extends DialogComponent<void, boolean> {
  
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
