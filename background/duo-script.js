if (document.readyState !== "complete") {
    window.addEventListener('load', init);
}
else {
    init();
}


function init() {
    Abuser.launchGame();
}


class Abuser {
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
        "Приятно познакомиться, София.": "Nice to meet you, Sofia."
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
        clearInterval(this.workerId);
        await chrome.runtime.sendMessage({}); // Запускаем заново
    }


    static launchGame() {
        console.log(`Вызван метод launchGame`);
        this.winCounter = 0;

        this.tasks.push(()=>this.TASK_waitForLoadPage()); // Ждет когда страница загрузиться
        this.tasks.push(()=>this.TASK_clickNextButton("Далее")); // Нажимает кнопку далее
        this.tasks.push(()=>this.TASK_registerGameTasks()); // Регистрирует действия игры

        this.run();
    }


    static TASK_registerGameTasks() {
        console.log(`Вызван метод registerGameTasks`);

        // this.tasks = [];
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

        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) return false;
        const buttonClassList = Array.from(button.classList).join(' ');

        for (const span of button.querySelectorAll(`span`)) {
            if (span && span.textContent === title) {
                button.dispatchEvent(new Event('click', { bubbles: true }));

                // Вынимаем тек. задачу, подкладываем проверку, и возвращаем тек. задачу в очередь
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

        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) return true;
        else {
            // Если кнопка есть и у нее такие же классы
            const curButtonClassList = Array.from(button.classList).join(' ');
            if(curButtonClassList === prevButtonClassList) {
                // И такая же надпись, вероятно нажатие не сработало
                for (const span of button.querySelectorAll(`span`)) {
                    if (span && span.textContent === title) {
                        button.dispatchEvent(new Event('click', { bubbles: true }));
                        return false;
                    }
                }
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
            let answer;

            if(this.winMode) {
                answer = this.answersMap[question];
                if(answer === undefined) {
                    answer = 'asddsa';
                }
            }
            else {
                const randomDigit = Math.floor(Math.random() * 14);
                answer = this.allowedStrings[randomDigit];
            }

            if( !question || !textarea ) throw new Error("Что-то пошло не так..");

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

        if(!this.winMode && this.loseCounter === 3) {
            // 3 проигрыша
            // Нажать далее (при получении 20 баллов)
            const currentTask = this.tasks.shift();
            this.tasks = [];
            this.tasks.push(currentTask);
            this.tasks.push( ()=>this.TASK_clickNextButton("Далее") );
            this.tasks.push( ()=>{this.abort(); return true;} );
        }
        else {
            // Проверка того что текущее окно не получение 20 баллов
            // класс фиолетовой кнопки: .tEvKV
            if( document.querySelector(`.tEvKV`) ) {
                this.winMode = false;
                // Нажать далее (при получении 20 баллов)
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


