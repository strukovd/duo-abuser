class Abuser {
	//TODO: сделать открытие новой вкладки в том же окне что и предыдущая
    static delay = 500;
    static launched = false;
    static lessonUrl = "https://www.duolingo.com/lesson/unit/2/level/10";
    static winCounter = 0;
    static loseCounter = 0;
    static resetTimer = 10000; // Если задача не завершилась за 10 сек, начать все сначала
    static allowedStrings = ['ewqeq', 'ewrer', 'qwwewed', 'ewrewwe', 'wqee', 'wqweeqw', 'weweq', 'qwrew', 'wwqewqe', 'ewwqe', 'wqeqwe', 'ewweqw', 'ewqweq', 'ewqewq', 'ewqew'];
    static answersMap = {
        "кофе": "coffee",
        "пожалуйста": "please",
        "Чай, пожалуйста.": "Tea, please.",
        "Кофе, пожалуйста.": "Coffee, please.",
        "чай и кофе": "tea and coffee",
        "Кофе и чай, пожалуйста.": "Coffee and tea, please.",
        "Кофе?": "Coffee?",
        "Кофе": "Coffee?",
        "кофе и чай": "coffee and tea",
        "Приятно познакомиться, Максим.": "Nice to meet you, Maksim.",
        "Приятно познакомиться, София.": "Nice to meet you, Sofia.",
		"Приятно познакомиться.": "Nice to meet you."
    };
    static tasks = [];
    // static roundMiddleware = [];
    static lastTaskInfo = {};
    static winMode = true;
    static workerId = null;
    static worker = null;


    static run() {
        this.workerId = setInterval(
            this.handleTask.bind(this),
            this.delay
        )
    }

    static handleTask() {
        if( this.tasks.length === 0 ) {
            return;
        }
        else {
            const currentTask = this.tasks[0];

            // Если тек. задача новая, записываем ее в реестр
            if( this.lastTaskInfo.task !== currentTask ) {
                this.lastTaskInfo.task = currentTask;
                this.lastTaskInfo.timeStart = new Date().getTime();
            }
            else { // Иначе. Выполняется предыдущая задача
                const diffTimeSec = ( (new Date().getTime()) - this.lastTaskInfo.timeStart ) / 1000;
                if(diffTimeSec > this.resetTimer) { // Если выполняется больше resetTimer сек.
                    this.abort();
                }
            }

            const taskIsCompleted = currentTask();
            if(taskIsCompleted) {
                this.tasks.shift();
            }
        }
    }


    static async abort() {
		console.warn(`Duo-abuser aborted!`);
        clearInterval(this.workerId);
        await chrome.runtime.sendMessage({}); // Запускаем заново
    }


    static launchGame() {
        console.log(`Вызван метод launchGame`);
        this.winCounter = 0;

        console.log(`---> Добавляю три таски (старт и регистрация действий игры)`);
        this.tasks.push(()=>this.TASK_waitForLoadPage()); // Ждет когда страница загрузиться
        this.tasks.push(()=>this.TASK_clickNextButton("Далее")); // Нажимает кнопку далее
        this.tasks.push(()=>this.TASK_registerGameTasks()); // Регистрирует действия игры

        this.run();
    }


    static TASK_registerGameTasks() {
        console.log(`Вызван метод registerGameTasks`);

        // this.tasks = [];
        console.log(`---> Добавляю 6 задач, для игры в след. раунд`);
        this.tasks.push(()=>this.TASK_waitForTextarea());
        this.tasks.push(()=>this.TASK_setAnswer());
        this.tasks.push(()=>this.TASK_clickNextButton("Проверить"));
        this.tasks.push(()=>this.TASK_checkAnswerStatus());
        this.tasks.push(()=>this.TASK_clickNextButton("Далее"));
        this.tasks.push(()=>this.TASK_checkIsGameEnded());

        return true;
    }




    /**
     * Нажимает на кнопку
     * @param {*} title подпись на кнопке
     */
    static TASK_clickNextButton(title) {
        console.log(`Вызван метод clickNextButton`);
        console.log(`Параметры: title: ${title}`);

        // Ищем кнопку
        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) return false;
        const buttonClassList = Array.from(button.classList).join(' ');

        // Перебирает надписи на кпопке (если вдруг несколько span)
        for (const span of button.querySelectorAll(`span`)) {
            // Если надпись кнопки совпадает с искомой
            if (span && span.textContent === title) {
                console.log(`---> Нашел нужную кнопку, с надписью: "${title}", жму её`);

                button.dispatchEvent(new Event('click', { bubbles: true }));

                // Вынимаем тек. задачу, подкладываем проверку, и возвращаем тек. задачу в очередь
                console.log(`---> Подкладываю задачу проверки нажатия isButtonSuccessfulPushed`);
                const currentTask = this.tasks.shift();
                this.tasks.unshift( ()=>this.isButtonSuccessfulPushed(title, buttonClassList) );
                this.tasks.unshift(currentTask);
                return true;
            }
        }

        return false;
    }

    /**
     * Убеждается что кнопка была нажата, регистрируется внутри clickNextButton
     * @param {*} title имя кнопки (если имя другое, значит это уже не та кнопка)
     */
    static isButtonSuccessfulPushed(title, prevButtonClassList) {
        console.log(`Вызван метод isButtonSuccessful`);
        console.log(`Параметры: title: ${title}`);

        // Ищем кнопку
        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) {
            console.log(`---> Кнопка не найдена! Видимо переход уже произошел.`);
            return true;
        }
        else {
            // Если кнопка есть и у нее такие же классы
            const curButtonClassList = Array.from(button.classList).join(' ');
            if(curButtonClassList === prevButtonClassList) {
                // И такая же надпись, вероятно нажатие не сработало
                console.log(`---> Кнопка (с теми же классами) найдена!`);
                console.log(`---> Классы: ${curButtonClassList}`);
                for (const span of button.querySelectorAll(`span`)) {
                    if (span && span.textContent === title) {
                        console.log(`---> Кнопка имеет ту же надпись. Вероятно нажатие не сработало, жму еще раз!`);

                        /*
                        Иногда фронт Duo багует, и кнопка Далее скрывается, но не удаляется,
                        из-за этого скрипт думает что кнока далее не нажалась и не завершает задачу,
                        при это появляется экран завершения с кнопкой для выхода,
                        внутри которой span с надписью "В другой раз", по нему и будем ориентироваться.
                        След. блок проверяет наличие кнопки выхода, когда было уже 3 проигрыша и настал мод проигрыша.
                        */
                        if(Abuser.loseCounter === 3 && !Abuser.winMode) {
                            const quitButton = document.querySelector(`[data-test="quit-button"]`);
                            if( quitButton.querySelector(`span`) ) {
                                console.log(`---> Произошел баг экрана, завершаем игру!`);
                                return true;
                            }
                        }

                        button.dispatchEvent(new Event('click', { bubbles: true }));
                        return false;
                    }
                }
            }
            else {
                console.log(`---> Кнопка имеет другие классы, видимо это уже другая кнопка`);
                console.log(`---> Классы: ${curButtonClassList}`);
            }

            return true;
        }
    }

    /**
     * Ждет пока не появиться textarea
     */
    static TASK_waitForTextarea() {
        console.log(`Вызван метод waitForTextarea`);

        const textarea = document.querySelector(`[data-test="challenge-translate-input"]`);
        if (textarea) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Читает вопрос, ищет ответ, ставит ответ в текстовое поле
     */
    static TASK_setAnswer() {
        console.log(`Вызван метод setAnswer`);

        try {
            const question = Array.from( document.querySelectorAll(`[data-test=hint-token]`) ).map( (val )=> val.textContent ).join('')
            const textarea = document.querySelector(`[data-test="challenge-translate-input"]`);
            if( !question || !textarea ) throw new Error("Что-то пошло не так..");

            let answer;

            // Если включен режим победы
            if(this.winMode) {
                // Ищем ответ
                answer = this.answersMap[question];
                // Если ответ не найден
                if(answer === undefined) {
                    console.log(`---> Ответ на вопрос: "${question}" не найден!`);
                    answer = 'asddsa';
                }
            }
            else { // Если режим намеренного слива (проигрыша)
                const randomDigit = Math.floor(Math.random() * 14);
                answer = this.allowedStrings[randomDigit]; // Берем ошибочную строку под ответ
            }

            console.log(`---> Вставляю ответ: ${answer}`);
            textarea.textContent = answer;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }



    /**
     * Проверяет тек. страницу success или failed и засчитывает очко
     */
    static TASK_checkAnswerStatus() {
        console.log(`Вызван метод countTheRound`);
        // Этот метод вызывается на промежуточном экране, для определения того, был ли ответ верным

        try {
            const successClass = "_3e9O1";
            const failureClass = "_3vF5k";
            const footer = document.querySelector(`[id^='session'][id$='PlayerFooter']`);
            if(!footer) {
                throw new Error("Что-то пошло не так..");
            }
            else {
                if( footer.classList.contains( successClass ) ) {
                    this.winCounter++;
                    console.log(`Правильный ответ! Текущая сумма ответов: ${this.winCounter}`);
                }
                else {
                    this.loseCounter++;
                }
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }


    /**
     * Ждет загрузки страницы
     */
    static TASK_waitForLoadPage() {
        console.log(`Вызван метод waitForLoadPage`);

        if (document.readyState !== "complete") {
            return false;
        }

        return true;
    }


    /**
     * Меняет стутс игры если баллы получены
     */
    static TASK_checkIsGameEnded() {
        console.log(`Вызван метод TASK_checkIsGameEnded`);

        if(!this.winMode && this.loseCounter === 3) {
            // 3 проигрыша
            // Нажать далее (при получении 20 баллов)

            console.log(`---> Достигнуто 3 проигрыша (при проигрышном режиме), добавляю задачи: [нажать Далее] и [Аборт]`);
            const currentTask = this.tasks.shift();
            this.tasks = [];
            this.tasks.push(currentTask);
            this.tasks.push( ()=>this.TASK_clickNextButton("Далее") );
            this.tasks.push( ()=>{this.abort(); return true;} );
        }
        else {
            // Проверка того что текущее окно не получение 20 баллов
            // класс фиолетовой кнопки: .tEvKV

            console.log(`---> 3 проигрыша не достигнуто (при ${this.winMode?"выйгрышном":"проигрышном"} режиме)`);
            if( document.querySelector(`.tEvKV`) ) {
                console.log(`---> Обноружно окно получения 20ти баллов, включаю проигрышный режим`);

                this.winMode = false;
                // Нажать далее (при получении 20 баллов)
                console.log(`---> Добавляю задачу [нажать Далее]`);
                const currentTask = this.tasks.shift();
                this.tasks.unshift( ()=>this.TASK_clickNextButton("Далее") );
                this.tasks.unshift(currentTask);
            }

            this.TASK_registerGameTasks();
        }

        return true;
    }

    static setNativeValue(element, value) {
        console.log(`Вызван метод setNativeValue`);
        console.log('element');
        console.log(element);

        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

        if (valueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
    }
}


function init() {
    Abuser.launchGame();
}


if (document.readyState !== "complete") {
	console.warn("not loaded");
    window.addEventListener('load', init);
}
else {
	console.warn("loaded");
	init();
}

