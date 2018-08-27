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
admin.initializeApp();
const nodemailer = require('nodemailer');
var request = require('request');
const mailTransport = nodemailer.createTransport('smtps://GetTruck.Objective@gmail.com:Aa123456!@smtp.gmail.com');
const GoogleDistanceApi = require('google-distance-api');

const tempUnknownAccessTokenSaving = "d8a0e2a5-0fff-4aee-8e63-7c69f9ce09c1";
const tempUnknownAccessTokenPayment = "bdbca16d-4090-4e20-9c81-d7fe3f3c826c";


const urlForSavingReq = "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl"; // DUBUG: https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl
const urlForPaymentReq = "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleChargeToken"; // DEBUG: https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleChargeToken
const accessTokenTerminalSaving = "d8a0e2a5-0fff-4aee-8e63-7c69f9ce09c1"; // DebugKey: 872f1891-d4f8-4a44-b566-dfb26e99401e
const accessTokenTerminalPayment  = "bdbca16d-4090-4e20-9c81-d7fe3f3c826c"; // DebugKey: 872f1891-d4f8-4a44-b566-dfb26e99401e

exports.onCreateUser = functions.auth.user().onCreate((userRecord, context) => {
	
	const user = userRecord; // The Firebase user.

	const uid = user.uid;
	const email = user.email; // The email of the user.
	const displayName = user.displayName; // The display name of the user.
	const photoUrl = user.photoURL;
	let creationTime = new Date().now();
	let lastSignedIn = new Date().now();
	
	try {
		
		creationTime = new Date(userRecord.metadata.creationTime).getTime();
		lastSignedIn = new Date(userRecord.metadata.lastSignInTime).getTime();
	} catch (e) {}
	
	const userObject = {
			'uid' : uid,
			'email' : email,
			'name' : displayName,
			'imageUrl' : photoUrl,
			'createdAt' : creationTime,
			'lastSingedIn' : lastSignedIn,
			'manager' : false,
			'appManager' : false,
			'blocked' : false,
			'subscribedToMailingList' : true,
			'subscribedToPushNotifications' : true
	};
	
	console.log('user created: ' + JSON.stringify(userObject));
	
	return admin.database().ref('/users/' + uid).set(userObject);
});

exports.onDeleteUser = functions.auth.user().onDelete((userRecord, context) => {
	
	const user = userRecord; // The Firebase user.
	const uid = user.uid;
	
	console.log('user deleted: ' + JSON.stringify(user));
	
	return admin.database().ref('/users/' + uid).remove();
});

exports.onOrderChanged = functions.database.ref('/all-orders/{orderId}').onWrite((change, context) => {

	if(change.before.exists() && !change.after.exists()){
		//  order was deleted
		console.log('order deleted.');
		
	} else if (!change.before.exists() && change.after.exists()){
		// order was created
		
		console.log('order created.');
		
	    const orderId = context.params.orderId;
	    const order = change.after;
	    const isTest = change.after.child('test').val();
	    
	    var promises = [];
	     
	    if (!isTest) {
	    	
	    	//send push to managers
	    	promises.push(sendNotificationToManagers("action_new_post", order));
	    }
	    
	    promises.push(updateDistanceForOrder(order));
	    
	    
	    return Promise.all(promises);
	} else if(change.before.exists() && change.after.exists()){
		// order Edited
		
		console.log('order changed.');
		
		const orderId = context.params.orderId;
		const orderStatus = change.after.child('orderStatus').val();
		const prevOrderStatus = change.before.child('orderStatus').val();
		
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
				
				promises.push(admin.database().ref('/all-orders/' + context.params.orderId).update(payload));
				
				return Promise.all(promises);
			}
		}
	}
	
	return true;
});

exports.onNewBid = functions.database.ref('/all-orders/{orderId}/bidsList/{bidId}').onWrite((change, context) => {

	// Exit when the data is deleted.
	if (!change.after.exists()) {
		console.log('data deleted');
		return true;
	} else if (change.before.exists()) {
		console.log('data edited');
	} else {
		console.log('data created');
	}
	
	const orderId = context.params.orderId;
	
	//send notification to owner
	return admin.database().ref('/all-orders/' + orderId + '/userId').once('value').then(userIdSnapshot => {
		
		const ownerId = userIdSnapshot.val();

		console.log('sending notification to owner: ' + ownerId);
		
		const innerPromises = [];
		
		innerPromises.push(sendNotificationsToUserById(ownerId, "action_new_bid", orderId));
		
		return Promise.all(innerPromises);
	});
});

exports.onBidSelected = functions.database.ref('/all-orders/{orderId}/selectedBid').onWrite((change, context) => {
	
	if (!change.after.exists()) {
		console.log('data deleted.');
		return true;
	}
	
	const bidderId = change.after.val();
	
	if(!bidderId){
		console.log('data deleted.');
		return true;
	}
	
	var promises = [];
	
	promises.push(sendNotificationsToUserById(bidderId, "action_new_delivery", context.params.orderId));
	
	return Promise.all(promises);
});

exports.onAppManagerStateChange = functions.database.ref('/users/{userId}/appManager').onWrite((change, context) => {
	
	if(!change.after.exists()){
		console.log('appManager key removed');
		return true;
	}
	
	if(!change.before.exists()){
		console.log('appManager key created');
		return true;
	}
	
	const isAppManager = change.after.val();
	const userId = context.params.userId;
	
	if(isAppManager){
		return sendNotificationsToUserById(userId, 'action_manager_request_status_changed', '1'); // true
	} else {
		return sendNotificationsToUserById(userId, 'action_manager_request_status_changed', '0'); // false
	}

	return true;
});

exports.onNewManagerRequest = functions.database.ref('/users/{userId}/requestingManager').onWrite((change, context) => {
	
	var isRequestingManager = change.after.val();
	var wasRequestingManager = change.before.val();
	if(isRequestingManager){
		return sendNotificationToAppManagers("action_new_manager_request", '');
	}

	return true;
});

const MANAGER_STATUS_PENDING = "0";

const MANAGER_STATUS_APPROVED = "1";
const MANAGER_STATUS_DENIED = "2";

exports.onManagerStateChanged = functions.database.ref('/users/{userId}/manager').onWrite((change, context) => {
	
	if(!change.before.exists()) {
		
		// user was created
		return true;
	}
	
	const isManager = change.after.val();
	const userId = context.params.userId;
	
	if(isManager === true){
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_APPROVED);
	} else {
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_DENIED);
	}
});

exports.onRequestingManagerDenied = functions.database.ref('/users/{userId}/requestingManagerDenied').onWrite((change, context) => {
	
	const requestingManagerDenied = change.after.val();
	const userId = context.params.userId;
	
	if(requestingManagerDenied === true){
		return sendNotificationsToUserById(userId, "action_manager_request_status_changed", MANAGER_STATUS_DENIED);
	}
	
	return true;
});

exports.onNewContactUsMessage = functions.database.ref('/email-inbox/{messageId}').onWrite((change, context) => {
	
	if(!change.after.exists()){
		// was removed
		
		console.log('Contact us email - was removed from database.');
		return true;
	}
	
	const promises = [];
	
	promises.push(sendNotificationToAppManagers("action_contact_us_request", change.after));
	
	return Promise.all(promises).then(function(value) {
		
		promises.push(admin.database().ref('/email-inbox/').child(change.after.key).remove());
	}, function(reason) {
		
		console.log('Failed to send contact us email to managers');
	});
	
	// return sendNotificationToAppManagers("action_contact_us_request", change.after);
	// return sendEmailToUs(change.after);
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

function sendNotificationToManagers(action, order) {
	console.log('sendNotificationToManagers() called');
	
	const senderUid = order.child('userId').val();
	const orderId = order.child('orderId').val();
	return admin.database().ref('/users').orderByChild('manager').equalTo(true).once('value').then(managers => {

		console.log('found total of ' + managers.numChildren() + ' managers');
		const filteredManagers = [];
		
		managers.forEach(function(manager) {
			
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
			var message = name + ' שלום,<br>בקשת הניהול שלך אושרה !<br><a href="https://mevi.co.il/manager-registration-result-page">לחץ כאן לצפייה</a>';
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
		var message = name + ' שלום,<br>פורסמה בקשת ניהול חדשה<br>שם משתמש: '+ name +'<br>אימייל: ' + email + '<br><br><a href="https://mevi.co.il">לחץ כאן לצפייה</a>';
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

function sendEmailToUsersWithAction(users, action, data) {
	console.log('sendEmailToUsersWithAction() called');
	console.log('sending email to ' + users.length + ' users.');
	
	var promises = [];
	
	users.forEach(function(user) {
		const email = user.child('email').val();
		const name = user.child('name').val();
		const uid = user.child('uid').val();
		const subscribedToEmails = user.child('subscribedToMailingList').val();
		
		if(!email || !action){
			console.log('no email or action');
			return;
		}
		
		console.log('sending email to:' + email);
		
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
			
		}else if(action == "action_contact_us_request"){
			
			var cName = data.child('name').val();
			var cUid = data.child('uid').val();
			var cEmail = data.child('email').val();
			var cPhone = data.child('phone').val();
			var cMessage = data.child('message').val();
			
			/*if(!cEmail || !cMessage){
				promises.push(admin.database().ref('/email-inbox/').child(data.key).remove());
			}*/
			
			if(!cPhone){
				cPhone = '';
			}
			
			mailOptions.subject = 'צור קשר - הודעה חדשה';
			cMessage = cMessage.replace(/(?:\r\n|\r|\n)/g, '<br />');
			
			var header = 'התקבלה הודעה חדשה מדף צור קשר';
			var body = "<table>" +
							"<tr>" +
								"<td>" +
									"מאת" +
								"</td>" +
								"<td>" +
									cName +
								"</td>" +
							"</tr>" +
							"<tr>" +
								"<td>" +
									"אימייל" +
								"</td>" +
								"<td>" +
									cEmail +
								"</td>" +
							"</tr>" +
							"<tr>" +
								"<td>" +
									"טלפון" +
								"</td>" +
								"<td>" +
									cPhone +
								"</td>" +
							"</tr>" +
							"<tr>" +
								"<td>" +
									"הודעה" +
								"</td>" +
								"<td style='width: 100%; background-color: white; padding: 16px;'>" +
									cMessage +
								"</td>" +
							"</tr>" +
						"</table>";
			
			var generatedHTML = generateEmail(header, body, '', '', cUid);
			
			mailOptions.html = generatedHTML;
		}
		
		if(!mailOptions.subject){
			console.log('not sending mail, unknown action.');
			return;
		}
		
		promises.push(mailTransport.sendMail(mailOptions).then(() => {
	      console.log('mail with action: ' + action + ' sent to: ' + email);
	    }, (error) => {
	      console.error('There was an error while sending the email to ' + email, error);  
	    }).catch(error => {
	      console.error('There was an error while sending the email to ' + email, error);  
	    }));
		
	});
	
	return Promise.all(promises);
}

function sendEmailToUsers(users, email) {
	
	console.log('sendEmailToUsers() called');
	console.log('sending email to ' + users.numChildren() + ' users.');
	
	var promises = [];
	
	users.forEach(function(user) {
		
		const userEmail = user.child('email').val();
		const name = user.child('name').val();
		const uid = user.child('uid').val();
		// const subscribedToEmails = user.child('subscribedToMailingList').val();
		
		const mailOptions = {
			    from: '"Mevi" <noreply@mevi.co.il>',
			    to: userEmail
		};
		
	    mailOptions.html = email.html;
	    mailOptions.subject = email.subject;
	    
	    if(!mailOptions.subject || !mailOptions.html){
			console.log('not sending mail, unknown action or HTML');
			return;
		}
		
	    promises.push(mailTransport.sendMail(mailOptions).then(() => {
	      console.log('mail with subject "' + email.subject + '" sent to: ' + userEmail);
	    }, (error) => {
	      console.error('There was an error while sending the email to ' + userEmail, error);  
	    }).catch(error => {
	      console.error('There was an error while sending the email to ' + userEmail, error);  
	    }));
	});
	
	return Promise.all(promises);
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
		
		
		const token = childSnapshot.child('notificationTokens').val();
		
		if (token) {
			
			console.log('sending push to user = ' + childSnapshot.child('uid').val());
			
			notificationTokens.push(token);
			usersSnapshot.push(childSnapshot);
		} else {
			
			console.log('skipping push to user = ' + childSnapshot.child('uid').val() + ' :no notificationToken.');
		}
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
		return admin.database().ref('/email-inbox/').child(emailDataRef.key).remove();
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
      
      return admin.database().ref('/email-inbox/').child(emailDataRef.key).remove();
      
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
	
	promises.push(sendEmailToUsersWithAction(users, action, data));
	
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

function generateEmailWithLinkToOrder(header, message, submessage, footer, orderId){
	
	return "<table dir='rtl' style='width: 100%; background-color: #e9e9e9; border: 0px;'>" +
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
			"<td style='color:black; font-size: 14px; padding: 12px;'>" +
				'<a href="https://mevi.co.il/order-details/' + orderId + '">לחץ כאן לצפייה</a>' +
			"</td>" +
		"</tr>" +
		"<tr>" +
			"<td style='background-color: #black; text-align: center; padding: 10px;'>" +
				"<hr>" +
				"נשלח מאתר http://www.mevi.co.il"  +
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

	if(!uid || uid == undefined){
		
		console.log("onUserPaymentMethodCompleted uid is null");
		
		return res.status(200).send(`<!doctype html>
			    <head>
			      <title>כשלון</title>
			    </head>
			    <body>
			      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
			    </body>
			  </html>`);
	} else {
		console.log("onUserPaymentMethodCompleted uid: " + uid);
	}
	
	if (uid == 'undefined') {
		console.log("stopping onUserPaymentMethodCompleted");
		return res.status(200).send(`<!doctype html>
			    <head>
			      <title>כשלון</title>
			    </head>
			    <body>
			      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
			    </body>
			  </html>`);
	}
	
	var AccessToken = req.body.TransactionToken;
	if(AccessToken){
		
		console.log("onUserPaymentMethodCompleted AccessToken: " + AccessToken);
		
		const payload = {
				'paymentAccessToken' : AccessToken,
//				'manager' : true,
				'requestingManager' : true,
				'paymentAccessTokenDate' : admin.database.ServerValue.TIMESTAMP,
//				'managerRegistrationDate' : admin.database.ServerValue.TIMESTAMP
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
		return res.status(302).send(`<!doctype html>
			    <head>
			      <title>כשלון</title>
			    </head>
			    <body>
			      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
			    </body>
			  </html>`);
	}
	
});

exports.rediredctUserToPayment = functions.https.onRequest((req, res) => {
	console.log("rediredctUserToPayment called");
	
	const uid = req.query.uid;
	console.log("rediredctUserToPayment uid: " + uid);
	
	if(!uid || uid == undefined){
		console.log("rediredctUserToPayment uid is null");
		
		return res.status(302).send(`<!doctype html>
			    <head>
			      <title>כשלון</title>
			    </head>
			    <body>
			      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
			    </body>
			  </html>`);
	}
	
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
		
		return request(options, function(error, response, body) {
			
			var payload = undefined;
			
			if (!error && response.statusCode == 200) {
				console.log("request was successfull !");
				
				var redirectUrl = body.URL;  
				
				if(!redirectUrl){
					console.log("failed to receive redirect url for payment (null)");
					
					return res.status(302).send(`<!doctype html>
						    <head>
						      <title>כשלון</title>
						    </head>
						    <body>
						      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
						    </body>
						  </html>`);
					
				} else {
					
					console.log("successfully received redirect url for payment");
					
					console.log("redirectUrl: " + redirectUrl);
					
					return res.redirect(redirectUrl);
				}
				
			} else {
				
				console.log("failed to redirect user to payment page" +"\n" + JSON.stringify(body));
				return res.status(302).send(`<!doctype html>
					    <head>
					      <title>כשלון</title>
					    </head>
					    <body>
					      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
					    </body>
					  </html>`);
			}
			
		});
		
	}catch(e){
		
		console.log("charing request function error: " + e.message);
		return res.status(302).send(`<!doctype html>
			    <head>
			      <title>כשלון</title>
			    </head>
			    <body>
			      <h1 style="margin: 50px;">יצירת חשבון המנהל נכשלה, נא נסה שוב מאוחר יותר !</h1>
			    </body>
			  </html>`);
	}
	
});

exports.startDailyCronTest = functions.https.onRequest((req, res) => {
	
	paymentCron();
	
	statisticsCron();
	
	sendAllContactUsEmails();
	
	const redirectUrl = "https://mevi.co.il";
	return res.redirect(redirectUrl);
});

/**
 * CRON JOBS
 */

const PAYMENT_PERCENTAGE = 0.08;  // 8%

exports.morning_job = functions.pubsub.topic('morning-tick').onPublish((event) => {
	console.log("daily cron strated.");
	
	notifyUsersAboutTommorowsActions();
	
	return true;
});

exports.daily_job = functions.pubsub.topic('daily-tick').onPublish((event) => {
	console.log("daily cron strated.");
	
	return paymentCron();
});

exports.daily_job_delayed = functions.pubsub.topic('daily-tick-delayed').onPublish((event) => {
	console.log("daily delayed cron strated.");
	
	const promises = [];
	
	promises.push(statisticsCron());
	
	return Promise.all(promises);;
});

function statisticsCron(){

	console.log("Statistics cron strated.");
	
	const promises = [];
	
	const todayDate = new Date();
	todayDate.setHours(0,0,0,0); // set to Midnight
	const today = todayDate.getTime();
	
	const yesterdayDate = new Date();
	yesterdayDate.setDate(yesterdayDate.getDate() - 1);
	
	//statistics
	promises.push(admin.database().ref('/all-orders').once('value').then(ordersSnapshot => {
		
		let openOrdersCount = 0;
		let pendingnOrdersCount = 0;
		let completedOrdersCount = 0;
		let payedOrdersCount = 0;
		let failedToChargeOrdersCount = 0;
		
		
		let newOrdersCountThisMonth = 0;
		let pendingnOrdersCountThisMonth = 0;
		let completedOrdersCountThisMonth = 0;
		let payedOrdersCountThisMonth = 0;
		let failedToChargeOrdersCountThisMonth = 0;
		
		ordersSnapshot.forEach(function(childSnapshot) {
			
			if (!childSnapshot.child('test').val()) {
				
				if(childSnapshot.child('orderStatus').val() === ORDER_STATUS_NEW){
					openOrdersCount++;
				} else if(childSnapshot.child('orderStatus').val() === ORDER_STATUS_PENDING){
					pendingnOrdersCount++;
				} else if(childSnapshot.child('orderStatus').val() === ORDER_STATUS_COMPLETED){
					completedOrdersCount++;
				}
				
				const publishDateTime = childSnapshot.child('publishedAt').val();
				const publishDate = new Date(publishDateTime);
				if (todayDate.getYear() === publishDate.getYear() && todayDate.getMonth() === publishDate.getMonth()) {
					newOrdersCountThisMonth++;
				}
				
				const selectedBidDateTime = childSnapshot.child('bidSelectedDate').val();
				if (selectedBidDateTime) {
					const selectedBidDate = new Date(selectedBidDateTime);
					
					if (todayDate.getYear() === selectedBidDate.getYear() && todayDate.getMonth() === selectedBidDate.getMonth()) {
						pendingnOrdersCountThisMonth++;
					}
				}
				
				const selectedBid = childSnapshot.child('selectedBid').val();
				
				if(selectedBid) {
					
					const selectedBidDateTime = childSnapshot.child('bidsList').child(selectedBid).child('pickupDate').val();
					const selectedBidDate = new Date(selectedBidDateTime);
					if (todayDate.getYear() === selectedBidDate.getYear() && todayDate.getMonth() === selectedBidDate.getMonth()) {
						completedOrdersCountThisMonth++;
					}
				}
				
				const paymentDateTime = childSnapshot.child('paymentDate').val();
				if (paymentDateTime) {
					
					payedOrdersCount++;
					
					const paymentDate = new Date(paymentDateTime);
					
					if (todayDate.getYear() === paymentDate.getYear() && todayDate.getMonth() === paymentDate.getMonth()) {
						payedOrdersCountThisMonth++;
					}
				}
				
				const failedToChargeDateTime = childSnapshot.child('failedToChargeDate').val();
				if (failedToChargeDateTime) {
					
					failedToChargeOrdersCount++;
					
					const failedToChargeDate = new Date(failedToChargeDateTime);
					
					if (todayDate.getYear() === failedToChargeDate.getYear() && todayDate.getMonth() === failedToChargeDate.getMonth()) {
						failedToChargeOrdersCountThisMonth++;
					}
				}
			}
		});
		
		const payload = {
			'openOrdersCount' : openOrdersCount,
			'pendingOrdersCount' : pendingnOrdersCount,
			'completedOrdersCount' : completedOrdersCount,
			'payedOrdersCount' : payedOrdersCount,
			'failedToChargeOrdersCount' : failedToChargeOrdersCount,
			'newOrdersCountThisMonth' : newOrdersCountThisMonth,
			'pendingnOrdersCountThisMonth' : pendingnOrdersCountThisMonth,
			'completedOrdersCountThisMonth' : completedOrdersCountThisMonth,
			'payedOrdersCountThisMonth' : payedOrdersCountThisMonth,
			'failedToChargeOrdersCountThisMonth' : failedToChargeOrdersCountThisMonth,
			'date' : today
		}
		
		const innerPromises = [];
		
		innerPromises.push(admin.database().ref('/statistics').child('history').child(today).update(payload));
		innerPromises.push(admin.database().ref('/statistics').child('latest').update(payload));
		
		return Promise.all(innerPromises);
	}));
	
	// users and managers registration counters
	promises.push(admin.database().ref('/users').once('value').then(usersSnapshot => {
		
		let newUsersCountThisMonth = 0;
		let newUsersCountYesterday = 0;
		let newManagersCountYesterday = 0;
		let newManagersCountThisMonth = 0;
		
		usersSnapshot.forEach(function(childSnapshot) {
			
			if (childSnapshot.child('managerRegistrationDate').exists()) {
				const registrationDate = new Date(childSnapshot.child('managerRegistrationDate').val());
				
				if (registrationDate.getYear() === yesterdayDate.getYear() && 
					registrationDate.getMonth() === yesterdayDate.getMonth() && 
					registrationDate.getDate() === yesterdayDate.getDate()) {
					
					// this manager registered yesterday.
					newManagersCountYesterday++;
				}
				
				if (todayDate.getYear() === registrationDate.getYear() && todayDate.getMonth() === registrationDate.getMonth()) {
					newManagersCountThisMonth++;
				}
			}
			
			if (childSnapshot.child('createdAt').exists()) {
				const registrationDate = new Date(childSnapshot.child('createdAt').val());
				yesterdayDate.setDate(yesterdayDate.getDate() - 1);
				
				if (registrationDate.getYear() === yesterdayDate.getYear() && 
					registrationDate.getMonth() === yesterdayDate.getMonth() && 
					registrationDate.getDate() === yesterdayDate.getDate()) {
					
					// this user registered yesterday.
					newUsersCountYesterday++;
				}
				
				if (todayDate.getYear() === registrationDate.getYear() && todayDate.getMonth() === registrationDate.getMonth()) {
					newUsersCountThisMonth++;
				}
			} else {
				
				console.log('Error for user [' + childSnapshot.child('uid').val() + '], no createdAt value, SHOULD NEVER HAPPEN!');
			}
		});
		
		const payload = {
			'newUsersCountYesterday' : newUsersCountYesterday,
			'newUsersCountThisMonth' : newUsersCountThisMonth,
			'newManagersCountYesterday' : newManagersCountYesterday,
			'newManagersCountThisMonth' : newManagersCountThisMonth,
			'date' : today
		}
		
		const innerPromises = [];
		
		innerPromises.push(admin.database().ref('/statistics').child('history').child(today).update(payload));
		innerPromises.push(admin.database().ref('/statistics').child('latest').update(payload));
		
		return Promise.all(innerPromises);
	}));
	
	return Promise.all(promises)
}

function paymentCron(){
	
	console.log("payment cron strated.");

	// get all pending orders
	return admin.database().ref('/all-orders').orderByChild('orderStatus').equalTo(ORDER_STATUS_PENDING).once('value').then(pendingOrdersSnapshot => {

		console.log("Pending orders fetched (" + pendingOrdersSnapshot.numChildren() + ")");
		
		if (pendingOrdersSnapshot.numChildren() <= 0) {
			
			console.log("No pending orders, finishing operation.");
			return true;
		}
		
		var promises = [];

		pendingOrdersSnapshot.forEach(function(childSnapshot) {

			var key = childSnapshot.key;
			
			var childData = childSnapshot.val();
			// var hasPaid = childSnapshot.child('hasPaid').val();
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
						var obligo = userSnapshot.child('obligo').val();
						var isTest = orderSnapshot.child('test').val();
						
						if (isTest === true) {
							
							const bidAmount = orderSnapshot.child('bidsList').child(managerUid).child('bidAmount').val();
							var paymentAmount = bidAmount * PAYMENT_PERCENTAGE;
							
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
							
						} else if(!paymentAccessToken && obligo && obligo > 0){
							console.log("Has obligo of: " + obligo + " NIS");
							const debt = userSnapshot.child('debt').val();
							
							console.log("Has debt of: " + debt > 0 ? debt + " NIS" : "0 NIS");

							const bidAmount = orderSnapshot.child('bidsList').child(managerUid).child('bidAmount').val();
							var paymentAmount = bidAmount * PAYMENT_PERCENTAGE;
							
							paymentAmount = paymentAmount.toFixed(2); // 2 decimals after number
							
							const debtRef = admin.database().ref('/users').child(uid).child('debt');
							innerPromises.push(debtRef.transaction(function(current) {
						        	return (current || 0) + paymentAmount;
							    }));
							
							const debtPayload = {
									'amount' : paymentAmount,
									'date' : admin.database.ServerValue.TIMESTAMP,
									'orderId' : key
							}
							innerPromises.push(admin.database().ref('/debts-records').child(uid).push(debtPayload));
							const orderPayload = {
									'pendingPayment' : false,
							}
						
							innerPromises.push(admin.database().ref('/all-orders/').child(key).update(orderPayload));
							
							console.log("Success: debt of [" + paymentAmount + " NIS] added to account [" + uid + "] for order [" + key + "]");
							
							const totalDebt = paymentAmount + debt;
							const precentage = totalDebt / obligo;
							if (precentage >= 0.8) {
								console.log("user [" + uid + "] filled more than 80% of his obligo.");
								// TODO: user filled more than 80% of his obligo.
								// Send Warning to user and to app managers
							}
						} else if(paymentAccessToken) {
							
							//console.log("paymentAccessToken: " + paymentAccessToken);
							
							const bidAmount = orderSnapshot.child('bidsList').child(managerUid).child('bidAmount').val();
							//console.log("bidAmount: " + bidAmount);
							
							var paymentAmount = bidAmount * PAYMENT_PERCENTAGE;
							
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
									
									var orderPayload = undefined;
									var userPayload = undefined;
									
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
											
											orderPayload = {
												'pendingPayment' : false,
												'paymentDate' : admin.database.ServerValue.TIMESTAMP,
												'failedToCharge' : false,
												'saleToken' : saleToken,
												'ReceiptLink' : receiptLink,
												'paymentAmountInNIS' : paymentAmount
											}
											
											userPayload = {
												'timestamp' : admin.database.ServerValue.TIMESTAMP,
												'receiptLink' : receiptLink,
												'saleToken' : saleToken,
												'paymentAmountInNIS' : paymentAmount,
												'orderId' : key,
												'note' : 'Server Generated - Credit Card'
											}
											
											innerPromises.push(admin.database().ref('/payments-records').child(uid).push(userPayload));
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

											console.log("Failure: account [" + uid + "] was not charged [" + paymentAmount + " NIS] for order [" + key + "] - ICredit Status: " + status + " ,DebugMessage: " + debugMessage + " ,ClientMessage" , + clientMessage);
											
											console.log("Removing Manager permissions for user [" + uid + "]");
											
											orderPayload = {
													'pendingPayment' : true,
													'failedToCharge' : true,
													'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
													'failedToChargeReason' : error,
													"ClientMessage": clientMessage,
												    "DebugMessage": debugMessage,
											}
											
											const userPayload = {
													// 'manager' : false,
													'managerRequestDenialReason' : 'חיוב נדחה, נא להזין כרטיס אשראי חדש',
													'requestingManagerDenied' : true,
													'requestingManagerDeniedDate' : admin.database.ServerValue.TIMESTAMP,
													'prevPaymentAccessToken' : paymentAccessToken,
													'paymentAccessToken' : '',
													'requestingManager' : false,
													'orderId' : key
											}
											
											innerPromises.push(admin.database().ref('/users').child(uid).update(userPayload));
										}
										
										
									} else {
										
										console.log("Failure: account [" + uid + "] was not charged [" + paymentAmount + " NIS] for order [" + key + "] - Error: " + error);
										
										orderPayload = {
												'pendingPayment' : true,
												'failedToCharge' : true,
												'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
												'failedToChargeReason' : error
										}
									}
									
									innerPromises.push(admin.database().ref('/all-orders/').child(key).update(orderPayload));
								});
								
							}catch(e){
								
								console.log("charing request function error: " + e.message);
							}
							
						} else {
							
							console.log("Failure: no paymentAccessToken or obligo !");
							console.log("revoking manager permission for user: " + uid);

							// TODO: send email with link to renew your credit card information
							
							
							
							const userPayload = {
									'manager' : false,
									'managerRequestDenialReason' : 'חיוב נדחה, נא להזין כרטיס אשראי חדש',
									'requestingManagerDenied' : true,
									'requestingManagerDeniedDate' : admin.database.ServerValue.TIMESTAMP,
									'requestingManager' : false,
									'prevPaymentAccessToken' : paymentAccessToken,
									'paymentAccessToken' : '',
							}
							
							innerPromises.push(admin.database().ref('/users').child(uid).update(userPayload));

							const orderPayload = {
									'pendingPayment' : true,
									'failedToCharge' : true,
									'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
									'failedToChargeReason' : 'paymentAccessToken is null'
							}
						
							innerPromises.push(admin.database().ref('/all-orders/').child(key).update(orderPayload));
						}
						
						return Promise.all(innerPromises);
					}));
					
				});

				return Promise.all(promises);
			});
		});
	});
	
}

function notifyUsersAboutTommorowsActions() {
	console.log('notifyUsersAboutTommorowsActions()');
	return admin.database().ref('/all-orders').orderByChild('orderStatus').equalTo(ORDER_STATUS_PENDING).once('value').then(pendingOrdersSnapshot => {
		
		const promises = [];
		console.log('found (' + pendingOrdersSnapshot.numChildren() + ') pending orders');
		
		pendingOrdersSnapshot.forEach(function(childSnapshot) {
			
			const orderId = childSnapshot.child('orderId').val();
			const selectedBid = childSnapshot.child('selectedBid').val();
			const rawPickupDate = childSnapshot.child('bidsList').child(selectedBid).child('pickupDate').val();
			const pickupDate = new Date(rawPickupDate);
			const now = new Date();
			
			const dateTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
			
			if (dateTomorrow.getFullYear() == pickupDate.getFullYear() && dateTomorrow.getMonth() == pickupDate.getMonth() && dateTomorrow.getDate() == pickupDate.getDate()) {
			    // pickupDate is tomorrow

				console.log('order [' + orderId + '] is due tommorow, sending emails..');
				
				// bidder
				let users = [];
				users.push(childSnapshot.child('bidsList').child(selectedBid).child('bidder').val());
				const bidderName = childSnapshot.child('bidsList').child(selectedBid).child('bidder').child('name').val();
				const message = 'היי ' + bidderName + ',<br><br>תזכורת:,<br>מחר (' + pickupDate.toLocaleString() + ') יש לך הובלה';
				const subject = 'תזכורת: מחר יש לך הובלה';
				const email = {
						html: generateEmailWithLinkToOrder(subject, message, '', '', orderId),
						subject: subject
				};
				console.log('sending email to ' + bidderName + '[' + subject + ']');
				promises.push(sendEmailToUsers(users, email));
				
				// owner
				if (childSnapshot.child('owner').exists()) {
					
					// not always exists.. new feature.
					
					users = [];
					users.push(childSnapshot.child('owner').val());
					const ownerName = childSnapshot.child('owner').child('name').val();
					const bidderName = childSnapshot.child('bidsList').child(selectedBid).child('bidder').child('name').val();
					const message = 'היי ' + ownerName + ',<br><br>תזכורת:,<br>מחר (' + pickupDate.toLocaleString() + ') יגיע אליך מוביל מחברת ' + bidderName;
					const subject = 'תזכורת: מחר מגיע אלך מוביל';
					const email = {
							html: generateEmailWithLinkToOrder(subject, message, '', '', orderId),
							subject: subject
					};
					console.log('sending email to ' + bidderName + '[' + subject + ']');
					promises.push(sendEmailToUsers(users, email));
				}
			}
		});
		
		return Promise.all(promises);
	});
}

function sendAllContactUsEmails () {

	console.log("sendAllContactUsEmails cron strated.");
	
	return admin.database().ref('/email-inbox').once('value').then(emailsSnapshot => {
		
		if (emailsSnapshot.numChildren() <= 0) {
			
			console.log("No stuck emails, finishing operation.");
			return true;
		}
		
		var promises = [];
		
		emailsSnapshot.forEach(function(childSnapshot) {
			
			promises.push(sendNotificationToAppManagers("action_contact_us_request", childSnapshot));
		});
		
		return Promise.all(promises);
	});
}





