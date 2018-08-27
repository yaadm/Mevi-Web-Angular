export function callAndroid(uid){
    // console.log('Called callAndroid function with uid: ' + uid);
	
	try {
		AndroidFunction.showToast(uid);
	} catch (e) {
		// console.log('AndroidFunction.showToast(..) error: ' + e);
	}
}
export function onNewFCMTokenFromAndroid(token){
    console.log('Called onNewFCMTokenFromAndroid function with token: ' + token);
    
    //TODO: register user with FCM TOKEN.
    try {
    	window['angularComponentRef'].zone.run(() => {window['angularComponentRef'].component.callFromOutside(token);})
	} catch (e) {
		// console.log('zone function error: ' + e);
	}
}
