import { AuthListener } from '..';
import { callAndroid } from '../../../../assets/javascript/androidTunnel';
import { Injectable, HostListener, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { DataSnapshot } from 'firebase/database';
import { AngularFireDatabase, AngularFireList, AngularFireObject, AngularFireAction } from 'angularfire2/database';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

export const firebaseConfigDebug = {
    apiKey: 'AIzaSyCgaQcKCwyfnTTQLcZD0KjT38I6WEtY_zo', // AIzaSyBVXuyXlPNqEm0OgzZLtLositCCAfZN7QQ
    authDomain: 'gettruck-c3ad3.firebaseapp.com',
    databaseURL: 'https://gettruck-c3ad3.firebaseio.com',
    projectId: 'gettruck-c3ad3',
    storageBucket: 'gettruck-c3ad3.appspot.com',
    messagingSenderId: '808278210056' 
};

/**
 * You must override the following functions:
 * onUserChanged(user: DataSnapshot)
 */
export interface AuthListener {
  onUserChanged(user: DataSnapshot)
}

export class Constants {
  
  public static get PAYMENT_PERCENTAGE(): number { return 0.08; }; // 8%
  
  public static get STATIC_MAP_HEIGHT(): number { return 200 };
  
  public static get NORTH(): number { return 1 };
  public static get CENTER(): number { return 2 };
  public static get SOUTH(): number { return 3 };
  public static get NORTH_LAT(): number { return 32.41; };
  public static get SOUTH_LAT(): number { return 31.86; };
  public static getLocation(locationLat): number {
    
    if (locationLat >= this.NORTH_LAT) {
      return this.NORTH_LAT;
    } else if (locationLat >= this.SOUTH) {
      return this.CENTER;
    } else {
      return this.SOUTH;
    }
  }
}

@Injectable()
export class DatabaseService {

  public currentUser: DataSnapshot;
  user: firebase.User;
  private allOrdersSubscription = [];
  private authListeners: AuthListener[] = [];
  myNewOrdersSubscription: any;
  private allSubscriptions: Subscription[] = [];
  private token: string;
  constructor(public afAuth: AngularFireAuth, public afDb: AngularFireDatabase, public router: Router) {

    
//    window['angularComponent'].zone.run(() => {
//      console.log('vanillaToAngularCallback() - ' );
//   });
    
//    window.vanillaToAngularCallback = (uid) => {
//      // communicate with other Angular providers
//      console.log('vanillaToAngularCallback() - ' + uid);
//    }
    
    this.startListeningForUser();
  }

  startListeningForUser() {

    this.afAuth.authState.subscribe(
        (firebaseUser: firebase.User) => {
          if (firebaseUser) {

            console.log('Logged In - Partial');

            if (!firebaseUser.uid) {
      
              console.log('Error loading User !');
      
              this.logout();
      
              const promise = new Promise<void>((resolve, reject) => {
                reject();
              });
              return promise;
            }
            
            this.user = firebaseUser;
            
            // User Signed In
            const userSubscription: Subscription = this.afDb.object('/users/' + firebaseUser.uid).snapshotChanges().subscribe(
              (afa: AngularFireAction<DataSnapshot>) => {

                this.currentUser = afa.payload;

                const companyId = this.currentUser.child('companyId').val();
                const companyAddress = this.currentUser.child('companyAddress').val();
                const companyPhone = this.currentUser.child('companyPhone').val();

                if (companyId && companyAddress && companyPhone) {
                  console.log('Logged In As: ' + this.currentUser.child('name').val());
                  
                  if (!this.token) {
                    
                    this.forwardToAndroidWebView(firebaseUser.uid);
                  }
                  
                  this.publishUserChangeToAuth(this.currentUser);
                } else {
                  console.log('User not registered.');
                  this.router.navigate(['/registration-page']);
                }
              }
            );

            this.addSubscription(userSubscription);

          } else {

            // User Logged Out
            console.log('Logged Out');
            this.currentUser = undefined;
            this.publishUserChangeToAuth(undefined);

          }
        }
      );
  }

  login() {
    localStorage.setItem('isLoggedin', 'true');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt: 'select_account'});
    // this.afAuth.auth.signInWithPopup(provider);
    this.afAuth.auth.signInWithRedirect(provider); // The redirect method is preferred on mobile devices.
  }

  logout() {
    this.router.navigate(['/home-page']);
    this.unsubscribeFromAll();
    // firebase.database().goOffline();
    localStorage.removeItem('isLoggedin');
    this.afAuth.auth.signOut();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  subscribeToAuth(listener: AuthListener) {
    listener.onUserChanged(this.currentUser);
    this.authListeners.push(listener);
  }

  unsubscribeFromAuth(listener: AuthListener) {

    const index = this.authListeners.indexOf(listener, 0);
    if (index > -1) {
       this.authListeners.splice(index, 1);
    }
  }

  publishUserChangeToAuth(user: DataSnapshot) {
    for (const listener of this.authListeners) {
      listener.onUserChanged(user);
    }
  }

  /**
   * Returns subscription object, which is used to unsubscribe.
   */
  subscribeToOrder(orderId: string): Observable<AngularFireAction<firebase.database.DataSnapshot>> {
    return this.afDb.object('/all-orders/' + orderId).snapshotChanges();
  }

  subscribeToMyOrders(): Observable<{}[]>  {
    const uid = this.currentUser.child('uid').val();
    return this.afDb.list('/all-orders', ref => ref.orderByChild('userId').equalTo(uid)).valueChanges();
  }
  
  subscribeToUserOrders(uid): Observable<{}[]>  {
    return this.afDb.list('/all-orders', ref => ref.orderByChild('userId').equalTo(uid)).valueChanges();
  }
  
  subscribeToUserPayments(uid): Promise<any>  {
    return this.afDb.list('/payments-records/' + uid).query.once('value');
  }
  
  subscribeToUnpaidOrders(): Observable<{}[]> {
    return this.afDb.list('/all-orders', ref => ref.orderByChild('failedToCharge').equalTo(true)).valueChanges();
  }

  subscribeToCancelledOrders(): Observable<{}[]> {
    return this.afDb.list('/all-orders', ref => ref.orderByChild('needToResolveCancellation').equalTo(true)).valueChanges();
  }
  
  resolveCancelledOrder(orderId: string) {
    const payload = {
      'needToResolveCancellation' : false
    }
    return this.afDb.object('/all-orders/' + orderId).update(payload);
  }
  
  getMyOrders(): Promise<any>  {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.list('/all-orders', ref => ref.orderByChild('userId').equalTo(uid)).query.once('value');
  }
  
  getMyDeliveries(): Promise<any>  {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.list('/all-orders', ref => ref.orderByChild('selectedBid').equalTo(uid)).query.once('value');
  }
  
  subscribeToOpenedOrders(): Observable<{}[]>  {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      return new Observable<{}[]>();
    }
    return this.afDb.list('/all-orders', ref => ref.orderByChild('orderStatus').equalTo(0)).valueChanges();
  }

  subscribeToMyDeliveries(): Observable<{}[]>  {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      return new Observable<{}[]>();
    }
    return this.afDb.list('/all-orders', ref => ref.orderByChild('selectedBid').equalTo(uid)).valueChanges();
  }
  
  subscribeToUserDeliveries(uid): Observable<{}[]>  {
    if (!uid) {
      
      return new Observable<{}[]>();
    }
    return this.afDb.list('/all-orders', ref => ref.orderByChild('selectedBid').equalTo(uid)).valueChanges();
  }

  addSubscription (subscription) {
    this.allOrdersSubscription.push(subscription);
  }

  subscribeToManagersRequests(): Observable<{}[]>  {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      return new Observable<{}[]>();
    }
    return this.afDb.list('/users', ref => ref.orderByChild('requestingManager').equalTo(true)).valueChanges();
  }

  subscribeToAllUsers(): Observable<{}[]>  {
    return this.afDb.list('/users').valueChanges();
  }

  subscribeToUserById(userId: string): Observable<AngularFireAction<DataSnapshot>> {
    return this.afDb.object('/users/' + userId).snapshotChanges();
  }

  subscribeToIsCompanyIdExists(companyId: string): Observable<{}[]> {
    return this.afDb.list('/users/', ref => ref.orderByChild('companyId').equalTo(companyId)).valueChanges();
  }

  getLatestStatisticsObject(): AngularFireObject<{}> {
    return this.afDb.object('/statistics/latest');
  }
  
  updateBidForOrder(orderId, payload): Promise<void> {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.object('/all-orders/' + orderId + '/bidsList/' + uid).set(payload);
  }
  
  removeMyBidFromOrder(orderId): Promise<void> {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.object('/all-orders/' + orderId + '/bidsList/' + uid).remove();
  }
  
  deleteOrderById(orderId): Promise<void> {
    return this.afDb.object('/all-orders/' + orderId).remove();
  }
  
  updateOrderData(orderId, payload): Promise<void> {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.object('/all-orders/' + orderId).update(payload);
  }
  
  updateMyUserData(payload): Promise<void> {
    const uid = this.currentUser.child('uid').val();
    
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    
    return this.afDb.object('/users/' + uid).update(payload);
  }

  updateUserData(userId, payload): Promise<void> {
    return this.afDb.object('/users/' + userId).update(payload);
  }
  
  addUserPayment(userId, payload): Promise<any[]> {
    
    const promises = [];
    
    promises.push(this.afDb.list('/payments-records/' + userId).push(payload));
    
    promises.push(this.afDb.object('/users/' + userId + '/debt').query.ref.transaction((current) => {
        return (current || 0) - payload.paymentAmountInNIS;
      }, (error, success) => {
        
        if (success) {
          
          console.log('transaction success !');
        } else {
          
          console.log('transaction error: ' + error);
        }
      }));
    
    return Promise.all(promises);
  }
  
  getUserById(userId): Observable<AngularFireAction<DataSnapshot>> {
    return this.afDb.object('/users/' + userId).snapshotChanges();
  }
  
  generateOrderId(): string {
    return this.afDb.list('/all-orders').push({}).key;
  }
  
  removeOrderById(orderId: string): Promise<void> {
    return this.afDb.object('/all-orders/' + orderId).remove();
  }
  
  publishOrder(orderId: string, payload): Promise<void> {
    return this.afDb.object('/all-orders/' + orderId).set(payload);
  }
  
  sendContactUsEmail(payload): firebase.database.ThenableReference {
    return firebase.database().ref('/email-inbox/').push(payload);
    
    /**
     * With AngularFire2 if the user is not logged in, the query will fail, even if the permissions in DB are true.
     */
    
    // return this.afDb.list('/email-inbox/').push(payload);
  }
  
  enableNotificationOnNewOrders () {
    const uid = this.currentUser.child('uid').val();
    if (!uid) {
      
      const promise = new Promise<void>((resolve, reject) => {
        reject();
      });
      return promise;
    }
    return this.afDb.object('/users/' + uid).update({'subscribedToMailingList' : true});
  }
  
  unsubscribe (subscription) {
    
    try {
      subscription.unsubscribe();
    } catch (e) {}
      
    const index: number = this.allOrdersSubscription.indexOf(subscription);
    if (index !== -1) {
      this.allOrdersSubscription.splice(index, 1);
    }
  }

  unsubscribeFromAll () {
    this.allOrdersSubscription.forEach(subscription => {
      subscription.unsubscribe();
    });
    
    for (const subscription of this.allOrdersSubscription) {
      if (subscription) {
          subscription.unsubscribe();
      }
    }
  }
  
  getTodayDate () {
    const today = new Date();
    return this.resetDateToMidnight(today);
  }
  
  resetDateToMidnight (date) {
    return date.setHours(0, 0, 0, 0);
  }
  
  isValidID(idNum) {
    
    let tot = 0;
    const tz = idNum;
    for (let i = 0; i < 8; i++) {
      
        let x = (((i % 2) + 1) * tz.charAt(i));
        if (x > 9)  {
          const xx = x.toString();
          x = parseInt((xx.toString().charAt(0)) + parseInt(xx.toString().charAt(1), 10), 10);
        }
        tot += x;
    }
        
    if ((tot + parseInt(tz.charAt(8), 10)) % 10 === 0) {
        return true;
    } else {
         
        return false;
    }
  }
  
  forwardToAndroidWebView(uid) {
    // console.log('forwardToAndroidWebView()');
    try {
      callAndroid(uid);
    } catch (e) {
      // console.log('error CallAndroid(): ' + e);
    }
  }
  
  public onNewFCMTokenFromAndroid(token) {
    console.log('onNewFCMToken() token=' + token);
    
    const uid = this.currentUser.child('uid').val();
    
    if (!token || !uid) {
      console.log('onNewFCMToken() token or uid is null');
      return;
    }
    
    if (this.token === token) {
      console.log('onNewFCMToken() token already registered');
      return;
    }
    
    this.token = token;
    
    this.afDb.object('/users/' + uid + '/notificationTokens').set(token);
    this.afDb.list('/users/' + uid + '/userNotificationTokens').push(token);
  }
  
  @HostListener('window:custom-event', ['$event'])
  customEventFunction(event) {
    console.log('customEventFunction() called event:' + event.data);
  }
  
  
  
  
  
}



