import { Component, OnInit, OnDestroy, ViewEncapsulation, Pipe, PipeTransform, ViewChild, ElementRef, Renderer } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { DatabaseService, firebaseConfigDebug } from '../../shared';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthListener } from '../../shared/services';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAction } from 'angularfire2/database';
import { DataSnapshot } from 'firebase/database';
import { DomSanitizer} from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-manage-users-page',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  animations: [routerTransition()]
})
export class PaymentComponent implements OnInit, OnDestroy, AuthListener {
  userId: string;
  userSnapshot: DataSnapshot;
  @ViewChild('iframeContent')
  public iframeContent: ElementRef;
  constructor(private translate: TranslateService, public database: DatabaseService, private activatedRoute: ActivatedRoute,
    public renderer: Renderer) {
    this.userId = this.activatedRoute.snapshot.params['userId'];
    this.setupTranslation(translate);
    database.subscribeToAuth(this);
  }

  ngOnInit() {
    try {
      this.iframeContent.nativeElement.src = 'https://www.mevi.co.il/rediredctUserToPayment?uid=' + this.userId;
    } catch (e) { }
    
    this.database.getUserById(this.userId).subscribe(
    (afa: AngularFireAction<DataSnapshot>) => {
        this.userSnapshot = afa.payload;
    });
  }

  ngOnDestroy(): void {
      this.database.unsubscribeFromAuth(this);
  }

  onUserChanged(user: any) {
    if (user) {
    }
  }

  private setupTranslation(translate: TranslateService) {
    translate.addLangs(['en', 'iw']);
    translate.setDefaultLang('iw');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|iw/) ? browserLang : 'iw');
  }
}
