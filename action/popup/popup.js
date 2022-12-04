window.onload = init;


function init() {
	document.querySelector(`#run-button`).addEventListener(`click`, run);
	// document.querySelector(`#btn-test`).addEventListener(`click`, test);
}

// async function test() {
// 	const currentTab = await chrome.tabs.query({ currentWindow: true, active: true });
// 	await chrome.runtime.sendMessage({test: true, tabId: currentTab[0].id});
// }


async function run(e) {
	const lessonUrl = "https://www.duolingo.com/lesson/unit/2/level/10";
	const message = {};
	const currentTab = await chrome.tabs.query({ currentWindow: true, active: true });
	if( !/duolingo\.com/.test(currentTab[0].url) ) {
		const newTab = await chrome.tabs.create({active: true, url: lessonUrl});
		message[`currentTab`] = newTab;
	}
	else {
		chrome.tabs.update( currentTab[0].id, { url: lessonUrl } );
		message[`currentTab`] = currentTab[0];
	}

	await chrome.runtime.sendMessage(message);
}