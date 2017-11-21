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
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

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
	  //TODO: remove all user data ?
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
				return;
			}else if(orderStatus == ORDER_STATUS_COMPLETED && prevOrderStatus !== ORDER_STATUS_COMPLETED){
				
				// order state changed (from pending) to completed 

				var promises = [];
				
				return Promise.all(promises);

			}else if(orderStatus === ORDER_STATUS_CANCELLED && prevOrderStatus !== ORDER_STATUS_CANCELLED){
				
				// order state changed (from pending) to cancelled
				
				var promises = [];
				
				//add to cancelled orders
				/*promises.push(admin.database().ref('/cancelled-orders/' + event.params.orderId).set(event.data.val()));
				
				promises.push(admin.database().ref('/all-orders/' + event.params.orderId).remove());*/
				
				return Promise.all(promises);
			}
		}
	}
});

exports.onNewBid = functions.database.ref('/all-orders/{orderId}/bidsList/{bidId}').onWrite(event => {

	// Exit when the data is deleted.
	if (!event.data.exists()) {
		console.log('data deleted');
		return;
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
	
	const bidderId = event.data.val();
	
	if(!bidderId){
		//data not exists
		return;
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
		return;
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
		        	  console.error('Failure sending notification to', tokens[index], error);
		            // Cleanup the tokens who are not registered anymore.
		            if (error.code === 'messaging/invalid-registration-token' ||
		                error.code === 'messaging/registration-token-not-registered') {
		            	tokensToRemove.push(user.child('notificationTokens').remove());
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
		var message = name + ' שלום,<br>קיבלת הצעת מחיר חדשה<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
		var body = generateEmail(subject, message, '', '', uid);
	    mailOptions.html = body;
	    
	}else if(action == "action_new_delivery"){
		
		var subject = 'זכית בהצעת מחיר !';
		mailOptions.subject = subject;
		var message = name + ' שלום,<br>זכית בהצעת המחיר !<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
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
		var message = name + ' שלום,<br>פורסמה בקשת הובלה חדשה<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
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
			var message = name + ' שלום,<br>קיבלת הצעת מחיר חדשה<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
			var body = generateEmail(subject, message, '', '', uid);
		    mailOptions.html = body;
		    
		}else if(action == "action_new_delivery"){
			
			var subject = 'זכית בהצעת מחיר !';
			mailOptions.subject = subject;
			var message = name + ' שלום,<br>זכית בהצעת המחיר !<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
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
			var message = name + ' שלום,<br>פורסמה בקשת הובלה חדשה<br><a href="https://mevi.co.il?orderId=' + data + '">לחץ כאן לצפייה</a>';
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
        	  console.error('Failure sending notification to', notificationTokens[index], error);
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

	console.log('sendEmailToUs()');
	
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
	
	console.log('before generating email');
	
	var generatedHTML = generateEmail(header, body, '', '', uid);
	
	console.log('after generating email');
	
	console.log('Generated Email:\n' + generatedHTML);
	
	mailOptions.html = generatedHTML;
    
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('Contact us email - sent !');
      
      return admin.database().ref('/email-inbox/').child(emailDataRef.key).remove();
    }).catch(error => {
      console.error('Contact us email - failed to send !', error);  
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
		
		/*res.status(200).send(`<!doctype html>
		    <head>
		      <title>Time</title>
		    </head>
		    <body>
		      הוסרת מרשימת התפוצה בהצלחה !
		    </body>
		  </html>`);*/
		
	}).catch(function (err) {
		
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
		
		return;
	} else {
		console.log("onUserPaymentMethodCompleted uid: " + uid);
		
	}
	
	var AccessToken = req.body.TransactionToken;
	if(AccessToken){
		
		console.log("onUserPaymentMethodCompleted AccessToken: " + AccessToken);
		
		const payload = {
				'paymentAccessToken' : AccessToken,
				'manager' : true,
				'requestingManager' : false
		};
		
		return admin.database().ref('users').child(uid).update(payload).then(function () {
			
			const redirectUrl = "https://mevi.co.il";
			return res.redirect(redirectUrl);
			
		}).catch(function (err) {
			
			console.log("onUserPaymentMethodCompleted error for user: " + uid + " with AccessToken: " + AccessToken);
			console.log("onUserPaymentMethodCompleted database error: " + err);
			
			const redirectUrl = "https://mevi.co.il";
			return res.redirect(redirectUrl);
		});
		
	} else {
		
		console.log("onUserPaymentMethodCompleted AccessToken is null");
	}
});

exports.setUserPaymentMethod = functions.https.onRequest((req, res) => {
	
	const uid = req.query.uid;
	console.log("unsubscribed uid: " + uid);

	const payload = {
		'subscribedToMailingList' : false
	}
	
	return admin.database().ref('users').child(uid).update(payload).then(function () {
		
		res.status(200).send(`<!doctype html>
		    <head>
		      <title>Time</title>
		    </head>
		    <body>
		      הוסרת מרשימת התפוצה בהצלחה !
		    </body>
		  </html>`);
		
	}).catch(function (err) {
		
		res.status(200).send(`<!doctype html>
			    <head>
			      <title>Time</title>
			    </head>
			    <body>
			      * הוסרת מרשימת התפוצה בהצלחה !
			    </body>
			  </html>`);
	});
});

exports.rediredctUserToPayment = functions.https.onRequest((req, res) => {
	console.log("rediredctUserToPayment called");
	
	const uid = req.query.uid;
	console.log("rediredctUserToPayment uid: " + uid);
	
	try{
		
		var options = {
				uri : 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl',
				method : 'POST',
				json : {
					  "GroupPrivateToken": "872f1891-d4f8-4a44-b566-dfb26e99401e",
					  "Items": [
					    {
					      "CatalogNumber": "sdf",
					      "UnitPrice": 1,
					      "Quantity": 1,
					      "Description": "df"
					    }
					  ],
					  "RedirectURL": "https://mevi.co.il/managerregistration.html",
					  "IPNURL": "https://mevi.co.il/onUserPaymentMethodCompleted?uid=" + uid,
					  "HideItemList": true,
					  "Currency": 1,
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
					
					return res.redirect('/UserHomePage');
					
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
	
	dailyCron();
	
	const redirectUrl = "https://mevi.co.il";
	return res.redirect(redirectUrl);
});

/**
 * CRON JOBS
 */

const mPaymentPercentage = 0.08;  // 8%

exports.daily_job = functions.pubsub.topic('daily-tick').onPublish((event) => {
	
	dailyCron();
});

function dailyCron(){
	
	console.log("Daily cron strated.");

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
					
					var key = orderSnapshot.key;
					
					var managerUid = orderSnapshot.child('selectedBid').val();
					
					// get the User's paymentAccessToken
					promises.push(admin.database().ref('/users').child(managerUid).once('value').then(userSnapshot => {
						
						var innerPromises = [];
						
						var uid = userSnapshot.child('uid').val();
						
						console.log("starting payment operation for user: " + uid + " for order: " + key);
						
						var paymentAccessToken = userSnapshot.child('paymentAccessToken').val();
						
						if(!paymentAccessToken){
							console.log("Failure: paymentAccessToken is null !");
							console.log("revoking manager permission for user: " + uid);

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
									uri : 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/SaleChargeToken',
									method : 'POST',
									json : {
										  "GroupPrivateToken": "872f1891-d4f8-4a44-b566-dfb26e99401e",
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
										  "CustomerLastName": "",
										  "CustomerFirstName": name,
										  "PhoneNumber": phone,
										  "Currency": 1,
										  "HideItemList": true,
										  "NoCVV": true,
										  "NumberOfPayments": 1
									}
								};
							
							try{
								
								//console.log("sending payment request...");
								
								request(options, function(error, response, body) {
									
									var payload = undefined;
									
									if (!error && response.statusCode == 200) {
										
										/**
										 * user Charged successfully ! 
										 */
										
										payload = {
											'pendingPayment' : false,
											'paymentDate' : admin.database.ServerValue.TIMESTAMP,
											'paymentAmountInNIS' : paymentAmount
										}
										
										console.log("Success: account [" + uid + "] was charged [" + paymentAmount + " NIS] for order [" + key + "]");
										
									} else {
										
										//TODO: change manager = false if the user's payment has failed !
										
										console.log("Failure: account [" + uid + "] was not charged [" + paymentAmount + " NIS] for order [" + key + "]");
										try {
											console.log(JSON.stringify(body));
										} catch (e) {
											
										}
										
										payload = {
												'pendingPayment' : true,
												'failedToCharge' : true,
												'failedToChargeDate' : admin.database.ServerValue.TIMESTAMP,
												'failedToChargeReason' : error //TODO: change to actual errors from external API
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
