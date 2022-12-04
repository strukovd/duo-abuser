
// использовать генераторы - yield ??
// Потом ввести 3 неправильных ответа
function toLoseGame() {
	const textarea = document.querySelector(`[data-test="challenge-translate-input"]`);
	setNativeValue(textarea, 'i need cofe');
	setTimeout(()=>{}, 500);
	setTimeout(()=>{
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}, 500);
	setTimeout(()=>{
		document.querySelector(`[data-test="player-next"]`).dispatchEvent(new Event('click', { bubbles: true }));
	}, 500);

	setNativeValue(textarea, 'Cofe');
	setTimeout(()=>{
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}, 500);
	setTimeout(()=>{
		document.querySelector(`[data-test="player-next"]`).dispatchEvent(new Event('click', { bubbles: true }));
	}, 500);

	setNativeValue(textarea, 'Cofe');
	setTimeout(()=>{
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}, 500);
	setTimeout(()=>{
		document.querySelector(`[data-test="player-next"]`).dispatchEvent(new Event('click', { bubbles: true }));
	}, 500);
}