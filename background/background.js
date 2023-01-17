
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) { // Обработчик сообщений
	const lessonUrl = "https://www.duolingo.com/lesson/unit/2/level/10";
	let currentTab;
	let duoTab;

	if(sender.tab) {
		currentTab = sender.tab;
	}
	else { // sender.tab отсутствует, если вызвано вручную (из popup)
		const currentTabArr = await chrome.tabs.query({ currentWindow: true, active: true });
		if(!currentTabArr || currentTabArr.length === 0) {
			throw new Error(`Текущая вкладка не найдена!`);
		}
		else {
			currentTab = currentTabArr[0]
		}
	}

	if( /duolingo\.com/.test(currentTab.url) ) { // Если эта вкладка сайт duo, загружаем урок прямо в ней
		duoTab = await chrome.tabs.update( currentTab.id, { url: lessonUrl } );
	}
	else {
		// Инчае. Тек. вкладка не явл. duo, открываем новую вкладку
		duoTab = await chrome.tabs.create({active: true, url: lessonUrl});
	}


	// С задержкой загружаем скрипт в игровую вкладку
	setTimeout(async ()=>{
		await chrome.scripting.executeScript({
			target: { tabId: duoTab.id },
			files: ["background/injected-duo-script.js"]
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
