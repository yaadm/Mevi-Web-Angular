import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DialogComponent, DialogService } from 'ngx-bootstrap-modal';

export interface InputModel {
  title: string;
  message: string;
  subMessage: string;
}

@Component({
    selector: 'app-modal-input',
    templateUrl: './modal-input.component.html',
    styleUrls: ['./modal-input.component.scss']
})
export class ModalInputComponent extends DialogComponent<InputModel, string> implements InputModel {
  title: string;
  message: string;
  subMessage: string;
  @ViewChild('userInput')
  public userInput: ElementRef;
  constructor(dialogService: DialogService) {
    super(dialogService);
  }
  confirm() {
    let result: string;
    result = this.userInput.nativeElement.value;
    // we set dialog result as true on click on confirm button,
    // then we can get dialog result from caller code
    if (result !== undefined && result !== '') {
      this.result = result;
      this.close();
    }

  }
}
