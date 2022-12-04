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
	await chrome.runtime.sendMessage({});
}