/**
 * DATABASE FUNCTIONS
 */

'use strict';

var ORDER_STATUS_NEW = 0;
var ORDER_STATUS_PENDING = 1;
var ORDER_STATUS_COMPLETED = 2;
var ORDER_STATUS_CANCELLED = 3;
var ORDER_STATUS_DELETED = 4;

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const nodemailer = require('nodemailer');
var request = require('request');
const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const mailTransport = nodemailer.createTransport(`smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);
const GoogleDistanceApi = require('google-distance-api');

const tempUnknownAccessTokenSaving = "d8a0e2a5-0fff-4aee-8e63-7c69f9ce09c1";
const tempUnknownAccessTokenPayment = "bdbca16d-4090-4e20-9c81-d7fe3f3c826c";


const urlForSavingReq = "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl"; // DUBUG: https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl
const urlForPaymentReq = "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleChargeToken"; // DEBUG: https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleChargeToken
const accessTokenTerminalSaving = "d8a0e2a5-0fff-4aee-8e63-7c69f9ce09c1"; // DebugKey: 872f1891-d4f8-4a44-b566-dfb26e99401e
const accessTokenTerminalPayment  = "bdbca16d-4090-4e20-9c81-d7fe3f3c826c"; // DebugKey: 872f1891-d4f8-4a44-b566-dfb26e99401e

exports.onCreateUser = functions.auth.user().onCreate(event => {
	
	const user = event.data; // The Firebase user.

	const uid = user.uid;
	const email = user.email; // The email of the user.
	const displayName = user.displayName; // The display name of the user.
	const photoUrl = user.photoURL;
	const creationTime = Date.now();
	
	const userObject = {
			'uid' : uid,
			'email' : email,
			'name' : displayName,
			'imageUrl' : photoUrl,
			'createdAt' : creationTime,
			'lastSingedIn' : creationTime,
			'manager' : false,
			'appManager' : false,
			'subscribedToMailingList' : true,
			'subscribedToPushNotifications' : true
	};
	
	return admin.database().ref('/users/' + uid).set(userObject);
});

exports.onDeleteUser = functions.auth.user().onDelete(event => {
	
	const user = event.data; // The Firebase user.
	const uid = user.uid;
	
	return admin.database().ref('/users/' + uid).remove();
});

exports.onOrderChanged = functions.database.ref('/all-orders/{orderId}').onWrite(event => {

	if(event.data.previous.exists() && !event.data.exists()){
		//  order was deleted
		console.log('order deleted.');
		
	} else if (!event.data.previous.exists() && event.data.exists()){
		// order was created
		
		console.log('order created.');
		
	    const orderId = event.params.orderId;
	    const order = event.data;
	    
	    var promises = [];
	    
	    //send push to managers
	    promises.push(sendNotificationToManagers("action_new_post", order));
	    
	    promises.push(updateDistanceForOrder(order));
	    
	    
	    return Promise.all(promises);
	} else if(event.data.previous.exists() && event.data.exists()){
		// order Edited
		
		console.log('order changed.');
		
		const orderId = event.params.orderId;
		const orderStatus = event.data.child('orderStatus').val();
		const prevOrderStatus = event.data.previous.child('orderStatus').val();
		
		if(orderStatus !== prevOrderStatus){
			//status has changed
			
			console.log('order status changed from ' + prevOrderStatus + " to " + orderStatus);
			
			if(orderStatus == ORDER_STATUS_PENDING && prevOrderStatus !== ORDER_STATUS_PENDING){
				
				// order state changed (from new) to pending - bidSelected
				return true;
			}else if(orderStatus == ORDER_STATUS_COMPLETED && prevOrderStatus !== ORDER_STATUS_COMPLETED){
				
				// order state changed (from pending) to completed 

				/*var promises = [];
				
				return Promise.all(promises);*/

				return true;
			}else if(orderStatus === ORDER_STATUS_CANCELLED && prevOrderStatus !== ORDER_STATUS_CANCELLED){
				
				// order state changed (from pending) to cancelled
				
				var promises = [];
				
				const payload = {
					'needToResolveCancellation' : true
				}
				
				promises.push(admin.database().ref('/all-orders/' + event.params.orderId).update(payload));
				
				return Promise.all(promises);
			}
		}
	}
	
	return true;
});

function updateDistanceForOrder (order) {
	
	const originsStr = order.child('pickupLat').val() + ',' + order.child('pickupLng').val();
	const destinationsStr = order.child('destinationLat').val() + ',' + order.child('destinationLng').val();
	
	const options = {
	  key: 'AIzaSyCgaQcKCwyfnTTQLcZD0KjT38I6WEtY_zo',
	  origins: [originsStr],
	  destinations: [destinationsStr],
	  language: 'iw'
	}
	
	try {
		GoogleDistanceApi.distance(options, (err, data) => {
		    if(err) {
		        return console.log(err);
		    }
		 
		    console.log(data);
		    
		    try {
		    	const payload = {
	    	    	'distance' : data[0].distance,
	    	    	'duration' : data[0].duration
	    	    }
		    	    
	    	    return admin.database().ref('/all-orders/' + order.child('orderId').val()).update(payload);
		    } catch (error) {
		    	// console.log(error);
				console.log('could not calculate distance');
		    }
		});
	} catch (error) {
		// console.log(error);
		console.log('could not calculate distance');
	}
}

exports.onNewBid = functions.database.ref('/all-orders/{orderId}/bidsList/{bidId}').onWrite(event => {

	// Exit when the data is deleted.
	if (!event.data.exists()) {
		console.log('data deleted');
		return true;
	} else if (event.data.previous.exists()) {
		console.log('data edited');
	} else {
		console.log('data created');
	}
	
	const orderId = event.params.orderId;
	
	//send notification to owner
	return admin.database().ref('/all-orders/' + orderId + '/userId').once('value').then(userIdSnapshot => {
		
		const ownerId = userIdSnapshot.val();

		console.log('sending notification to owner: ' + ownerId);
		
		const innerPromises = [];
		
		innerPromises.push(sendNotificationsToUserById(ownerId, "action_new_bid", orderId));
		
		return Promise.all(innerPromises);
	});
});

exports.onBidSelected = functions.database.ref('/all-orders/{orderId}/selectedBid').onWrite(event => {
	
	if (!event.data.exists()) {
		console.log('data deleted.');
		return true;
	}
	
	const bidderId = event.data.val();
	
	if(!bidderId){
		console.log('data deleted.');
		return true;
	}
	
	var promises = [];
	
	promises.push(sendNotificationsToUserById(bidderId, "action_new_delivery", event.params.orderId));
	
	return Promise.all(promises);
});

exports.onAppManagerStateChange = functions.database.ref('/users/{userId}/appManager').onWrite(event => {
	
	if(!event.data.exists()){
		console.log('appManager key removed');
		return;
	}
	
	const isAppManager = event.data.val();
	const userId = event.params.userId;
	
	if(isAppManager){
		return sendNotificationsToUserById(userId, 'app-manager-state-change', '1'); // true
	} else {
		return sendNotificationsToUserById(userId, 'app-manager-state-change', '0'); // false
	}
	
});

exports.onNewManagerRequest = functions.database.ref('/users/{userId}/requestingManager').onWrite(event => {
	
	var isRequestingManager = event.data.val();
	var wasRequestingManager = event.data.previous.val();
	if(isRequestingManager){
		return sendNotificationToAppManagers("action_new_manager_request", '');
	}
});

const MANAGER_STATUS_PENDING = "0";
const MANAGER_STATUS_APPROVED = "1";
const MANAGER_STATUS_DENIED = "2";

exports.onManagerStateChanged = functions.database.ref('/users/{userId}/manager').onWrite(event => {
	
	if(!event.data.previous.exists()) {
		
		// user was created
		return;
	}
	
	const isManager = event.data.val();
	const userId = event.params.userId;
	
	if(isManager === true){
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_APPROVED);
	} else {
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_DENIED);
	}
});

exports.onRequestingManagerDenied = functions.database.ref('/users/{userId}/requestingManagerDenied').onWrite(event => {
	
	const requestingManagerDenied = event.data.val();
	const userId = event.params.userId;
	
	if(requestingManagerDenied === true){
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_DENIED);
	}
});

exports.onNewContactUsMessage = functions.database.ref('/email-inbox/{messageId}').onWrite(event => {
	
	if(!event.data.exists()){
		// was removed
		
		console.log('Contact us email - was removed from database.');
		return true;
	}
	
	return sendEmailToUs(event.data);
});

function sendNotificationToManagers(action, order) {
	console.log('sendNotificationToManagers() called');
	
	const senderUid = order.child('userId').val();
	const orderId = order.child('orderId').val();
	return admin.database().ref('/users').orderByChild('manager').equalTo(true).once('value').then(managers => {

		console.log('found total of ' + managers.numChildren() + ' managers');
		const filteredManagers = [];
		
		managers.forEach(function(manager, i, array) {
			
			if(!senderUid || manager.child('uid').val() !== senderUid){
				
				// its the the sender's user object
				
				if(manager.child('subscribedToMailingList').val() === true){
					// manager is subscribed for mail
					console.log('adding user: ' + manager.child('email').val());
					
					filteredManagers.push(manager);
				} else {

					console.log('skipping user: ' + manager.child('email').val() + ' - (unsubscribed)');
				}
				
			} else {
				
				console.log('skipping user: ' + manager.child('email').val() + ' - (he is the sender)');
			}
		});
		
		if(filteredManagers.length === 0){
			console.log('no managers are subscribed to mailing list');
			return;
		}
		
		return sendNotificationsToUsers(filteredManagers, action, orderId);
	});
}

function sendNotificationToAppManagers(action, data) {
	return admin.database().ref('/users').orderByChild('appManager').equalTo(true).once('value').then(appManagers => {
		return sendNotificationsToUsers(appManagers, action, data);
	});
}

function sendNotificationsToUserById(userId, action, data) {
	
	return admin.database().ref('/users/' + userId).once('value').then(user => {
		
		const notificationToken = user.child('notificationTokens').val();
		
		const innerPromises = [];
		
		if(notificationToken){
			
			const payload = {
				    data : {
				    	  "action" : action,
				    	  "data" : data
				    }
			};
			
			innerPromises.push(admin.messaging().sendToDevice(notificationToken, payload).then(response => {
		        // For each message check if there was an error.
		        const tokensToRemove = [];
		        response.results.forEach((result, index) => {
		          const error = result.error;
		          if (error) {
		        	  console.log('Notification to user: ' + userId + ' Failed !');
		        	  //console.error('Failure sending notification to', userId, error);
		            // Cleanup the tokens who are not registered anymore.
		            if (error.code === 'messaging/invalid-registration-token' ||
		                error.code === 'messaging/registration-token-not-registered') {
		            	tokensToRemove.push(user.ref.child('notificationTokens').remove());
		            }
		          } else {
		        	  console.log('Notification sent to user:' + userId);
		          }
		        });
		        return Promise.all(tokensToRemove);
		      }));
		}
		
		innerPromises.push(sendEmailToUser(user, action, data));
		
		return Promise.all(innerPromises);
		
	});
}

function sendEmailToUser(user, action, data) {

	const email = user.child('email').val();
	const name = user.child('name').val();
	const uid = user.child('uid').val();
	const subscribedToEmails = user.child('subscribedToMailingList').val();
	
	if(!email || !action){
		return;
	}
	
	const mailOptions = {
		    from: '"Mevi" <noreply@mevi.co.il>',
		    to: email
	};
	
	if(action == "action_new_bid"){
		
		var subject = 'קיבלת הצעת מחיר חדשה !';
		mailOptions.subject = subject;
		var message = name + ' שלום,<br>קיבלת הצעת מחיר חדשה<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
		var body = generateEmail(subject, message, '', '', uid);
	    mailOptions.html = body;
	    
	}else if(action == "action_new_delivery"){
		
		var subject = 'זכית בהצעת מחיר !';
		mailOptions.subject = subject;
		var message = name + ' שלום,<br>זכית בהצעת המחיר !<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
		var body = generateEmail(subject, message, '', '', uid);
	    mailOptions.html = body;
	    
	}else if(action == "action_manager_request_status_changed"){
		
		if(data === MANAGER_STATUS_APPROVED){
			
			var subject = 'בקשת הניהול שלך אושרה !';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>בקשת הניהול שלך אושרה !<br><a href="https://mevi.co.il">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
			mailOptions.html = body;
		} else {
			
			const denyReason = user.child('managerRequestDenialReason').val();
			
			var subject = 'בקשת הניהול שלך נדחתה';
			mailOptions.subject = subject;
		    var message = name + ' שלום,<br>בקשת הניהול שלך נדחתה מהסיבות הבאות:<br>' + denyReason  +'<br><a href="https://mevi.co.il">Mevi.co.il</a>';
		    var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
		}
	}else if(action == "action_new_post"){
		
		if(subscribedToEmails === false){
			console.log('skipping email sending to user due to unsubscribed: ' + uid);
			return;
		}
		
		var subject = 'פורסמה בקשת הובלה חדשה';
		mailOptions.subject = subject;
		var message = name + ' שלום,<br>פורסמה בקשת הובלה חדשה<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
		var body = generateEmail(subject, message, '', '', uid);
	    mailOptions.html = body;
		
	}else if(action == "action_new_manager_request"){
		
		var subject = 'מישהו נרשם למנהל משאיות - נא לבדוק באפליקציה';
		mailOptions.subject = subject;
		var message = name + ' שלום,<br>פורסמה בקשת ניהול חדשה<br><a href="https://mevi.co.il">לחץ כאן לצפייה</a>';
		var body = generateEmail(subject, message, '', '', uid);
	    mailOptions.html = body;
		
	}
	
	if(!mailOptions.subject){
		console.log('not sending mail, unknown action.');
		return;
	}
	
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('mail with action: ' + action + ' sent to:', email);
    }).catch(error => {
      console.error('There was an error while sending the email:', error);  
    });
}

function sendEmailToUsers(users, action, data) {
	console.log('sendNotificationsToUsers() called');
	console.log('sending email to ' + users.length + ' users.');
	
	users.forEach(function(user, i, array) {
		
		const email = user.child('email').val();
		const name = user.child('name').val();
		const uid = user.child('uid').val();
		const subscribedToEmails = user.child('subscribedToMailingList').val();

		console.log('sending email to:' + email);
		
		if(!email || !action){
			return;
		}
		
		const mailOptions = {
			    from: '"Mevi" <noreply@mevi.co.il>',
			    to: email
		};
		
		if(action == "action_new_bid"){
			
			var subject = 'קיבלת הצעת מחיר חדשה !';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>קיבלת הצעת מחיר חדשה<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
		    
		}else if(action == "action_new_delivery"){
			
			var subject = 'זכית בהצעת מחיר !';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>זכית בהצעת המחיר !<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
		    
		}else if(action == "action_manager_request_status_changed"){
			
			if(data === MANAGER_STATUS_APPROVED){
				
				var subject = 'בקשת הניהול שלך אושרה !';
				mailOptions.subject = subject;
				var message = name + ' שלום,<br>בקשת הניהול שלך אושרה !<br><a href="https://mevi.co.il">לחץ כאן לצפייה</a>';
				var body = generateEmail(subject, message, '', '', uid);
				mailOptions.html = body;
			} else {
				
				const denyReason = user.child('managerRequestDenialReason').val();
				
				var subject = 'בקשת הניהול שלך נדחתה';
				mailOptions.subject = subject;
			    var message = name + ' שלום,<br>בקשת הניהול שלך נדחתה מהסיבות הבאות:<br>' + denyReason  +'<br><a href="https://mevi.co.il">Mevi.co.il</a>';
			    var body = generateEmail(subject, message, '', '', uid);
			    mailOptions.html = body;
			}
		}else if(action == "action_new_post"){
			
			if(subscribedToEmails === false){
				console.log('skipping email sending to user due to unsubscribed: ' + uid);
				return;
			}
			
			var subject = 'פורסמה בקשת הובלה חדשה';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>פורסמה בקשת הובלה חדשה<br><a href="https://mevi.co.il/order-details/' + data + '">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
			
		}else if(action == "action_new_manager_request"){
			
			var subject = 'מישהו נרשם למנהל משאיות - נא לבדוק באפליקציה';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>פורסמה בקשת ניהול חדשה<br><a href="https://mevi.co.il/managers-registration-requests-page">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
			
		}
		
		if(!mailOptions.subject){
			console.log('not sending mail, unknown action.');
			return;
		}
		
	    return mailTransport.sendMail(mailOptions).then(() => {
	      console.log('mail with action: ' + action + ' sent to: ' + email);
	    }).catch(error => {
	      console.error('There was an error while sending the email to ' + email, error);  
	    });
		
	});
}

function sendPushToUsers(users, action, data) {
	console.log('sendPushToUsers() called');
	console.log('sending push to ' + users.length + ' users.');
	
	const notificationTokens = [];
	const usersSnapshot = [];
	
	users.forEach(function(childSnapshot) {

		if(action == "action_new_post"){
			
			var subscribedToPushNotifications = childSnapshot.child('subscribedToPushNotifications').val();
			
			if(subscribedToPushNotifications == undefined || subscribedToPushNotifications !== true){
				
				console.log('skipping push to user = ' + childSnapshot.child('uid').val() + ' :user not subsribed to push');
				
				return;
			}
		}
		
		
		console.log('sending push to user = ' + childSnapshot.child('uid').val());
		
		notificationTokens.push(childSnapshot.child('notificationTokens').val());
		usersSnapshot.push(childSnapshot);
	});
	
	if(notificationTokens.length === 0){
		console.log('No notification tokens found !');
		return;
	}
	
	const payload = {
		    data : {
		    	  "action" : action,
		    	  "data" : data
		    }
	};
	
	const promises = [];
	
	promises.push(admin.messaging().sendToDevice(notificationTokens, payload).then(response => {
        // For each message check if there was an error.
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
        	  
        	  console.log('Notification to user: ' + usersSnapshot[index].child('uid').val() + ' Failed !');
        	  //console.error('Failure sending notification to', notificationTokens[index], error);
            // Cleanup the tokens who are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
            	
            	tokensToRemove.push(usersSnapshot[index].ref.child('notificationTokens').remove());
            }
          }
        });
        return Promise.all(tokensToRemove);
   }));
	
    return Promise.all(promises);
	
}

function sendEmailToUs(emailDataRef) {

	var name = emailDataRef.child('name').val();
	var uid = emailDataRef.child('uid').val();
	var email = emailDataRef.child('email').val();
	var phone = emailDataRef.child('phone').val();
	var message = emailDataRef.child('message').val();
	
	if(!email || !message){
		return;
	}
	
	if(!phone){
		phone = '';
	}
	
	const mailOptions = {
		    from: email,
		    to: 'gettruck.objective@gmail.com',
		    subject: 'צור קשר - הודעה חדשה'
	};
	
	message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
	
	var header = 'התקבלה הודעה חדשה מדף צור קשר';
	var body = "<table>" +
					"<tr>" +
						"<td>" +
							"מאת" +
						"</td>" +
						"<td>" +
							name +
						"</td>" +
					"</tr>" +
					"<tr>" +
						"<td>" +
							"אימייל" +
						"</td>" +
						"<td>" +
							email +
						"</td>" +
					"</tr>" +
					"<tr>" +
						"<td>" +
							"טלפון" +
						"</td>" +
						"<td>" +
							phone +
						"</td>" +
					"</tr>" +
					"<tr>" +
						"<td>" +
							"הודעה" +
						"</td>" +
						"<td style='width: 100%; background-color: white; padding: 16px;'>" +
							message +
						"</td>" +
					"</tr>" +
				"</table>";
	
	var generatedHTML = generateEmail(header, body, '', '', uid);
	
	mailOptions.html = generatedHTML;
    
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('Contact us email - sent !');
      
      admin.database().ref('/email-inbox/').child(emailDataRef.key).remove();
      
      return true;
      
    }, error => {
    	
        console.log('Contact us email - failed: ' , error);
        return true;
        
      }).catch(error => {
    	  
    	  console.error('Contact us email - failed to send !', error);  
	      return true;
    });
}

function sendNotificationsToUsers(users, action, data) {
	console.log('sendNotificationsToUsers() called');
	
	const promises = [];
	
	promises.push(sendEmailToUsers(users, action, data));
	
	promises.push(sendPushToUsers(users, action, data));
	
    return Promise.all(promises);
}

function generateEmail(header, message, submessage, footer, uid){
	
	return "<table dir='rtl' style='width: 100%; background-color: #e9e9e9; border: 0;'>" +
		"<tr>" +
			"<td style='color:white; background-color: #3F51B5; font-size: 16px; padding: 16px;'>" +
				header +
			"</td>" +
		"</tr>" +
		"<tr>" +
			"<td style='color:black; font-size: 14px; padding: 14px;'>" +
				message +
			"</td>" +
		"</tr>" +
		"<tr>" +
			"<td style='color:black; font-size: 12px; padding: 12px;'>" +
				submessage +
			"</td>" +
		"</tr>" +
		"<tr>" +
			"<td style='background-color: #black; text-align: center; padding: 10px;'>" +
				"<hr>" +
				"נשלח מאתר http://www.mevi.co.il" + " | " + "<a href='https://www.mevi.co.il/unsubscribe?uid=" + uid + "'>הסר מרשימת התפוצה</a>"
				"<br>" +
				"<span style='font-size: 10px; padding: 10px;'>" + 
					footer +
				"</span>" + 
			"</td>" +
		"</tr>" +
	"</table>";
	
}

/**
 * STORAGE FUNCTIONS
 */

const mkdirp = require('mkdirp-promise');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const LOCAL_TMP_FOLDER = '/tmp/';

// Max height and width of the thumbnail in pixels.
const THUMB_MAX_HEIGHT = 200;
const THUMB_MAX_WIDTH = 200;

/*exports.generateThumbnail = functions.storage.object().onChange(event => {
	
	if(event.data.previous.exists()){
		return;
	}
	
	const filePath = event.data.name;
	const filePathSplit = filePath.split('/');
	const fileName = filePathSplit.pop();
	const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');
	const thumbFilePath = `${fileDir}${fileName}`;
	const tempLocalDir = `${LOCAL_TMP_FOLDER}${fileDir}`;
	const tempLocalFile = `${tempLocalDir}${fileName}`;
	const tempLocalThumbFile = `${LOCAL_TMP_FOLDER}${thumbFilePath}`;

	// Exit if this is triggered on a file that is not an image.
	if (!event.data.contentType.startsWith('image/')) {
		console.log('This is not an image.');
		return;
	}

	// Exit if this is a move or deletion event.
	if (event.data.resourceState === 'not_exists') {
		console.log('This is a deletion event.');
		return;
	}
	
	console.log('Image file directory = ' + fileDir);
	
	// Exit if this is not from images or users_images folder
	if (!fileDir.includes('images') && !fileDir.includes('users_images')) {
		console.log('This image is not in "images" or "users_images" folder.');
		return;
	}

	// Create the temp directory where the storage file will be downloaded.
	return mkdirp(tempLocalDir).then(() => {
		// Download file from bucket.
		const bucket = gcs.bucket(event.data.bucket);
		return bucket.file(filePath).download({
			destination : tempLocalFile
		}).then(() => {
			console.log('The file has been downloaded to', tempLocalFile);
			// Generate a thumbnail using ImageMagick.
			return spawn('convert', [ tempLocalFile, '-thumbnail', `${THUMB_MAX_WIDTH}x${THUMB_MAX_HEIGHT}>`, tempLocalThumbFile ]).then(() => {
				console.log('Thumbnail created at', tempLocalThumbFile);
				
				return bucket.upload(tempLocalThumbFile, {
					destination : thumbFilePath
				}).then(() => {
					console.log('Thumbnail uploaded to Storage at', thumbFilePath);
					
					if(fileDir.includes('users_images')){
						// this is a user image
						
						console.log('This is a user image for user id: ' + fileName);
						console.log('Generating download url..');
						
						const file = bucket.file(filePath);
						return file.getSignedUrl({
						  action: 'read',
						  expires: '03-09-2491'
						}).then(signedUrls => {
						  // signedUrls[0] contains the file's public URL
							
							var url = signedUrls[0];
							
							console.log('Generated url: ' + url);
							
							console.log('Updating user object in DB with the new url..');
							// update user object in DB
							return admin.database().ref('/users/' + fileName + '/imageUrl').set(url);
						});
					}
				});
			});
		});
	});
});*/


/// THIS FUNCTION HAS A KNOWN BUG AT GOOGLE - UNMARK WHEN SOLVED
/*exports.updateUserImage = functions.storage.object().onChange(event => {
	
	const filePath = event.data.name;
	const filePathSplit = filePath.split('/');
	const fileName = filePathSplit.pop();
	const fileDir = filePathSplit.join('/') + (filePathSplit.length > 0 ? '/' : '');
	var bucket = gcs.bucket(event.data.bucket);
	
	if (!fileDir.includes('users_images')) {
		console.log('This image is not in "users_images" folder.');
		return;
	}
	
	const file = bucket.file(filePath);
	return file.getSignedUrl({
	  action: 'read',
	  expires: '03-09-2491'
	}).then(signedUrls => {
	  // signedUrls[0] contains the file's public URL
		
		var url = signedUrls[0];
		
		console.log('Generated url: ' + url);
		
		var userId = fileName.substring(0, fileName.indexOf('.jpg'));
		
		console.log('for user: ' + userId);
		
		console.log('Updating user object in DB with the new url..');
		// update user object in DB
		return admin.database().ref('/users/' + userId + '/imageUrl').set(url);
	});
});*/

/**
 * HTML REQUESTS
 */

exports.unsubscribe = functions.https.onRequest((req, res) => {
	
	const uid = req.query.uid;
	console.log("unsubscribed uid: " + uid);

	const payload = {
		'subscribedToMailingList' : false
	}
	
	//TODO: redirect to one of our web pages to show the message
	
	return admin.database().ref('/users').child(uid).update(payload).then(function () {
		
		const redirectUrl = "https://mevi.co.il/user-unsubscribed";
		return res.redirect(redirectUrl);
		
	}, function (err) {
		
		return res.status(200).send(`<!doctype html>
			    <head>
			      <title>Time</title>
			    </head>
			    <body>
			      * הוסרת מרשימת התפוצה בהצלחה !
			    </body>
			  </html>`);
	});
});

exports.onUserPaymentMethodCompleted = functions.https.onRequest((req, res) => {
	console.log("onUserPaymentMethodCompleted called");
	
	const uid = req.query.uid;

	if(!uid){
		
		console.log("onUserPaymentMethodCompleted uid is null");
		
		return false;
	} else {
		console.log("onUserPaymentMethodCompleted uid: " + uid);
	}
	
	var AccessToken = req.body.TransactionToken;
	if(AccessToken){
		
		console.log("onUserPaymentMethodCompleted AccessToken: " + AccessToken);
		
		const payload = {
				'paymentAccessToken' : AccessToken,
				'manager' : true,
				'requestingManager' : false,
				'paymentAccessTokenDate' : admin.database.ServerValue.TIMESTAMP
		};
		
		return admin.database().ref('users').child(uid).update(payload).then(function () {
			
			return res.status(200).send(`<!doctype html>
				    <head>
				      <title>הצלחה</title>
				    </head>
				    <body>
				      <h1 style="margin: 50px;">חשבון המנהל נוצר בהצלחה !</h1>
				    </body>
				  </html>`);
			
		}, function (reason) {
			
			//failed
			const redirectUrl = "https://mevi.co.il";
			return res.redirect(redirectUrl);
			
		});
		
	} else {
		
		console.log("onUserPaymentMethodCompleted AccessToken is null");
	}
	
	return true;
});

exports.rediredctUserToPayment = functions.https.onRequest((req, res) => {
	console.log("rediredctUserToPayment called");
	
	const uid = req.query.uid;
	console.log("rediredctUserToPayment uid: " + uid);
	
	try{
		
		var options = {
				uri : urlForSavingReq,
				method : 'POST',
				json : {
					  "GroupPrivateToken": accessTokenTerminalSaving,
					  "Items": [
					    {
					      "CatalogNumber": "1",
					      "UnitPrice": 1,
					      "Quantity": 1,
					      "Description": "Mevi - הרשמה לאתר ללא עלות - החשבון שלך לא חוייב !"
					    }
					  ],
					  "RedirectURL": "https://mevi.co.il/payment-success",
					  "IPNURL": "https://mevi.co.il/onUserPaymentMethodCompleted?uid=" + uid,
					  "HideItemList": true,
					  "Currency": 1,
					  "SendMail": false,
					  "Country": "false",
					  "SaleType":3 // it means it will not charge the account !
				}
			};
		
		request(options, function(error, response, body) {
			
			var payload = undefined;
			
			if (!error && response.statusCode == 200) {
				console.log("request was successfull !");
				
				var redirectUrl = body.URL;  
				
				if(!redirectUrl){
					console.log("failed to receive redirect url for payment (null)");
					
					return res.redirect;
					
				} else {
					
					console.log("successfully received redirect url for payment");
					
					console.log("redirectUrl: " + redirectUrl);
					
					return res.redirect(redirectUrl);
				}
				
			} else {
				
				console.log("failed to redirect user to payment page" +"\n" + JSON.stringify(body));
			}
			
		});
		
	}catch(e){
		
		console.log("charing request function error: " + e.message);
	}
	
});

exports.startDailyCronTest = functions.https.onRequest((req, res) => {
	
	paymentCron();
	
	statisticsCron();
	
	const redirectUrl = "https://mevi.co.il";
	return res.redirect(redirectUrl);
});

/**
 * CRON JOBS
 */

const mPaymentPercentage = 0.08;  // 8%

exports.daily_job = functions.pubsub.topic('daily-tick').onPublish((event) => {
	console.log("daily cron strated.");
	
	paymentCron();
	
	return true;
});

exports.daily_job_delayed = functions.pubsub.topic('daily-tick-delayed').onPublish((event) => {
	console.log("daily delayed cron strated.");
	
	statisticsCron();
	
	return true;
});

function statisticsCron(){

	console.log("Statistics cron strated.");
	//statistics
	return admin.database().ref('/all-orders').once('value').then(ordersSnapshot => {
		
		let openOrdersCount = 0;
		let pendingnOrdersCount = 0;
		let completedOrdersCount = 0;
		
		ordersSnapshot.forEach(function(childSnapshot) {
			
			if(childSnapshot.child('orderStatus').val() === 0){
				openOrdersCount++;
			} else if(childSnapshot.child('orderStatus').val() === 1){
				pendingnOrdersCount++;
			} else if(childSnapshot.child('orderStatus').val() === 2){
				completedOrdersCount++;
			}
			
		});
		
		const today = new Date().getTime();
		
		const payload = {
			'openOrdersCount' : openOrdersCount,
			'pendingOrdersCount' : pendingnOrdersCount,
			'completedOrdersCount' : completedOrdersCount,
			'date' : today
		}
		
		const promises = [];
		
		promises.push(admin.database().ref('/statistics').child('history').push(payload));
		promises.push(admin.database().ref('/statistics').child('latest').set(payload));
		
		return Promise.all(promises);
	});
}

function paymentCron(){
	
	console.log("payment cron strated.");

	// get all pending orders
	return admin.database().ref('/all-orders').orderByChild('orderStatus').equalTo(ORDER_STATUS_PENDING).once('value').then(pendingOrdersSnapshot => {

		console.log("Pending orders fetched (" + pendingOrdersSnapshot.numChildren() + ")");
		
		var promises = [];

		pendingOrdersSnapshot.forEach(function(childSnapshot) {

			var key = childSnapshot.key;
			
			var childData = childSnapshot.val();
			var hasPaid = childSnapshot.child('hasPaid').val();
			var selectedBidId = childSnapshot.child('selectedBid').val();
			
			if(!selectedBidId){
				console.log("selectedBidId returned null for order: " + key);
				return;
			}
			
			var pickupDateMillis = childSnapshot.child('bidsList').child(selectedBidId).child('pickupDate').val();
			var orderCompletionDate = new Date(pickupDateMillis);
			orderCompletionDate.setMinutes(0, 0, 0);
			orderCompletionDate.setHours(0, 0, 0, 0);
			// inc 2 day - because it triggered at the start of a day.
			orderCompletionDate.setDate(orderCompletionDate.getDate() + 2);

			var today = new Date();
			today.setMinutes(0, 0, 0);
			today.setHours(0, 0, 0, 0);
			// if order completion date has passed
			if (orderCompletionDate.getTime() <= today.getTime()) {

				// need to charge account

				console.log("Adding promise to update key: " + key);
				
				const payload = {
					'orderStatus' : ORDER_STATUS_COMPLETED,
					'pendingPayment' : true,
					'completionDate' : admin.database.ServerValue.TIMESTAMP
				}
				
				// mark order as completed.
				promises.push(admin.database().ref('/all-orders').child(key).update(payload));

			} else {
				
				//console.log("Skipping - order not completed yet:" + key);
			}
		});

		return Promise.all(promises).then(values => {
			//console.log(values); // [] 

			console.log("updated completed orders");
			
			return admin.database().ref('/all-orders/').orderByChild('pendingPayment').equalTo(true).once('value').then(ordersSnapshot => {

				console.log("pendingPayment orders fetched (" + ordersSnapshot.numChildren() + ")");

				promises = [];

				ordersSnapshot.forEach(function(orderSnapshot) {
					
					if (!orderSnapshot) {
						console.log('orderSnapshot is null !');
						return;
					}
					
					const key = orderSnapshot.key;
					
					const managerUid = orderSnapshot.child('selectedBid').val();
					
					if (!managerUid) {
						console.log('managerUid is null !');
						return;
					}
					
					// get the User's paymentAccessToken
					promises.push(admin.database().ref('/users').child(managerUid).once('value').then(userSnapshot => {
						
						var innerPromises = [];
						
						var uid = userSnapshot.child('uid').val();
						
						console.log("starting payment operation for user: " + uid + " for order: " + key);
						
						var paymentAccessToken = userSnapshot.child('paymentAccessToken').val();
						var isTest = orderSnapshot.child('test').val();
						
						if (isTest === true) {
							
							const bidAmount = orderSnapshot.child('bidsList').child(managerUid).child('bidAmount').val();
							var paymentAmount = bidAmount * mPaymentPercentage;
							
							paymentAmount = paymentAmount.toFixed(2); // 2 decimals after number
							
							const payload = {
									'pendingPayment' : false,
									'paymentDate' : admin.database.ServerValue.TIMESTAMP,
									'failedToCharge' : false,
									'saleToken' : 'test',
									'ReceiptLink' : 'test',
									'paymentAmountInNIS' : paymentAmount
								}
							
							innerPromises.push(admin.database().ref('/all-orders/').child(key).update(payload));
							
							console.log("TEST ACCOUNT | Success: account [" + uid + "] was charged [" + paymentAmount + " NIS] for order [" + key + "]");
							
						} else if(!paymentAccessToken){
							console.log("Failure: paymentAccessToken is null !");
							console.log("revoking manager permission for user: " + uid);

							// TODO: send email with link to renew your credit card information
							
							const userPayload = {
									'manager' : false,
									'managerRequestDenialReason' : 'חיוב נדחה, נא להזין כרטיס אשראי חדש',
									'requestingManagerDenied' : true,
									'requestingManagerDeniedDate' : admin.database.ServerValue.TIMESTAMP,
									'requestingManager' : false
							}
							
							innerPromises.push(admin.database().ref('/users').child(uid).update(userPayload));

							const orderPayload = {
									'pendingPayment' : true,
									'failedToCharge' : true,
									'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
									'failedToChargeReason' : 'paymentAccessToken is null'
							}
						
							innerPromises.push(admin.database().ref('/all-orders/').child(key).update(orderPayload));
							
						} else {
							
							//console.log("paymentAccessToken: " + paymentAccessToken);
							
							const bidAmount = orderSnapshot.child('bidsList').child(managerUid).child('bidAmount').val();
							//console.log("bidAmount: " + bidAmount);
							
							var paymentAmount = bidAmount * mPaymentPercentage;
							
							paymentAmount = paymentAmount.toFixed(2); // 2 decimals after number
							
							var description = 'מזהה הובלה: ' + key;
							var emailAddress = userSnapshot.child('email').val();
							var name = userSnapshot.child('name').val();
							var phone = userSnapshot.child('companyPhone').val();
							
							//console.log("payment amount: " + paymentAmount + " NIS");
							
							// TODO: if we fail to charge, send email to app managers, with the info of the user and mark them as failedToCharge = true;
							
							var options = {
									uri : urlForPaymentReq,
									method : 'POST',
									json : {
										  "GroupPrivateToken": accessTokenTerminalPayment,
										  "CreditcardToken": paymentAccessToken, 
										  "Items": [
										    {
										      "Quantity": "1",
										      "UnitPrice": paymentAmount,
										      "Description": description
										    },
										    
										  ],
										  "Order": key,
										  /*"IPNURL": "  https://your ipn url for callback.php",
										  "RedirectURL": "  https://google.com",*/
										  "EmailAddress": emailAddress,
										  "CustomerLastName": name,
										  "CustomerFirstName": name,
										  "PhoneNumber": phone,
										  "Currency": 1,
										  "HideItemList": true,
										  "NoCVV": true,
										  "NumberOfPayments": 1
									}
								};
							
							// console.log("payment request params: " + JSON.stringify(options));
							
							try{
								
								//console.log("sending payment request...");
								
								request(options, function(error, response, body) {
									
									/*try {
										console.log("error" + JSON.stringify(error));
									} catch (e) {
										
									}
									
									try {
										console.log("body" + JSON.stringify(body));
									} catch (e) {
										
									}
									
									try {
										console.log("response" + JSON.stringify(response));
									} catch (e) {
										
									}*/
									
									var payload = undefined;
									
									if (!error && response && response.statusCode == 200) {
										
										let status = -1;
										
										status = body.Status;
										
										console.log("Status received: " + status);
										
										if(status === 0) {
											
											/**
											 * user Charged successfully ! 
											 */
											
											const saleToken = body.SaleToken;
											const receiptLink = body.ReceiptLink;
											
											payload = {
												'pendingPayment' : false,
												'paymentDate' : admin.database.ServerValue.TIMESTAMP,
												'failedToCharge' : false,
												'saleToken' : saleToken,
												'ReceiptLink' : receiptLink,
												'paymentAmountInNIS' : paymentAmount
											}
											
											console.log("Success: account [" + uid + "] was charged [" + paymentAmount + " NIS] for order [" + key + "]");
											
										} else {
											
											let clientMessage = body.ClientMessage;
											let debugMessage = body.DebugMessage;
											
											if(clientMessage == undefined || clientMessage == null){
												clientMessage = "none";
											}
											
											if(debugMessage == undefined || debugMessage == null){
												debugMessage = "none";
											}

											console.log("Failure: account [" + uid + "] was not charged [" + paymentAmount + " NIS] for order [" + key + "] - ICredit Status: " + status + " ,DebugMessage: " + debugMessage);
											
											payload = {
													'pendingPayment' : true,
													'failedToCharge' : true,
													'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
													'failedToChargeReason' : error,
													"ClientMessage": clientMessage,
												    "DebugMessage": debugMessage,
											}
											
											const userPayload = {
													'manager' : false,
													'managerRequestDenialReason' : 'חיוב נדחה, נא להזין כרטיס אשראי חדש',
													'requestingManagerDenied' : true,
													'requestingManagerDeniedDate' : admin.database.ServerValue.TIMESTAMP,
													'requestingManager' : false
											}
											
											innerPromises.push(admin.database().ref('/users').child(uid).update(userPayload));
										}
										
										
									} else {
										
										console.log("Failure: account [" + uid + "] was not charged [" + paymentAmount + " NIS] for order [" + key + "] - Error: " + error);
										
										payload = {
												'pendingPayment' : true,
												'failedToCharge' : true,
												'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
												'failedToChargeReason' : error
										}
									}
									
									innerPromises.push(admin.database().ref('/all-orders/').child(key).update(payload));
								});
								
							}catch(e){
								
								console.log("charing request function error: " + e.message);
							}
							
						}
						
						return Promise.all(innerPromises);
					}));
					
				});

				return Promise.all(promises);
			});
		});
	});
	
}


