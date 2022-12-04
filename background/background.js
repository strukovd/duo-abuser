
chrome.runtime.onMessage.addListener(async function(request, sender) {
	const lessonUrl = "https://www.duolingo.com/lesson/unit/2/level/10";
	const currentTab = await chrome.tabs.query({ currentWindow: true, active: true });
	// chrome.notifications.create('notification', request.options, function() { });

	let duoTab;
	if( !/duolingo\.com/.test(currentTab.url) ) {
		duoTab = await chrome.tabs.create({active: true, url: lessonUrl});
	}
	else {
		duoTab = currentTab;
		chrome.tabs.update( duoTab.id, { url: lessonUrl } );
	}


	setTimeout(async ()=>{
		await chrome.scripting.executeScript({
			target: { tabId: duoTab.id },
			files: ["background/duo-script.js"]
		});
	}, 2000);
});


function getTabID() {
	return new Promise((resolve, reject) => {
		try {
			chrome.tabs.query({
				active: true, currentWindow: true
			}, function (tabs) {
				resolve(tabs[0].id);
			});
		}
		catch (e) {
			reject(e);
		}
	});
}
