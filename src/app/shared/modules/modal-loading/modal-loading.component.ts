import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit, AfterViewChecked } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-loading',
  templateUrl: './modal-loading.component.html',
  styleUrls: ['./modal-loading.component.scss'],
})

export class ModalLoadingComponent implements OnInit, AfterViewChecked, AfterViewInit {
  closeResult: string;
  @ViewChild('content') contentRef;
  constructor(private modalService: NgbModal) {

  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  ngAfterViewChecked(): void {
  }

  public open() {
      this.modalService.open(this.contentRef).result.then((result) => {
          this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      });
  }

  private getDismissReason(reason: any): string {
      if (reason === ModalDismissReasons.ESC) {
          return 'by pressing ESC';
      } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
          return 'by clicking on a backdrop';
      } else {
          return  `with: ${reason}`;
      }
  }
}
