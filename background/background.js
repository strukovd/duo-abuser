
chrome.runtime.onMessage.addListener(function(request, sender) {
	console.log(request);
	// chrome.notifications.create('notification', request.options, function() { });

	let duoTab;
	if(request.newTab) {
		duoTab = request.newTab;
	}
	else {
		duoTab = request.currentTab;
	}

	setTimeout(async ()=>{
		await chrome.scripting.executeScript({
			target: { tabId: duoTab.id },
			files: ["background/duo-script.js"]
		});
	}, 2000);


	
	
});
