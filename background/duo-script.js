if (document.readyState !== "complete") {
    window.addEventListener('load', init);
}
else {
    init();
}


function init() {
    Abuser.launch();
}


class Abuser {
    static iterationDelay = 1000;
    static launched = false;
    static lessonUrl = "https://www.duolingo.com/lesson/unit/2/level/10";
    static winCounter = 0;
    static resetTimer = 10000; // Если задача не завершилась за 10 сек, начать все сначала
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
    static launchAlgorithm = [];
    static roundAlgorithm = [];
    static roundMiddleware = [];
    static prevRound = {};
    static winMode = true;
    static worker = null;

    static launch() {
        console.log(`Вызван метод launch`);
        this.winCounter = 0;

        this.launchAlgorithm.push(()=>this.waitForReadyPage());
        this.launchAlgorithm.push(()=>this.clickNextButton("Далее"));
        this.launchAlgorithm.push(()=>this.registerRoundTasks());

        this.makeLaunchTask();
    }

    static makeLaunchTask() {
        console.log(`Вызван метод makeLaunchTask`);
        if( this.launchAlgorithm.length == 0 ) return;

        if( this.launchAlgorithm[0]() ) {
            this.launchAlgorithm.shift();
        }

        setTimeout(this.makeLaunchTask.bind(this), this.iterationDelay);
    }


    static registerRoundTasks() {
        console.log(`Вызван метод registerRoundTasks`);
        this.roundMiddleware = [];
        this.roundMiddleware.push(()=>this.waitForReadyPage()); // TODO: не используется

        this.roundAlgorithm = [];
        this.roundAlgorithm.push(()=>this.waitForTextarea());
        this.roundAlgorithm.push(()=>this.setAnswer());
        this.roundAlgorithm.push(()=>this.clickNextButton("Проверить"));
        this.roundAlgorithm.push(()=>this.countTheRound());
        this.roundAlgorithm.push(()=>this.clickNextButton("Далее"));
        this.roundAlgorithm.push(()=>this.checkGameStatus());

        setTimeout(this.runRoundTask.bind(this), this.iterationDelay);
        return true;
    }


    static runRoundTask() {
        console.log(`Вызван метод runRoundTask`);
        if( this.roundAlgorithm.length == 0 ) return;

        const curTask = this.roundAlgorithm[0];
        if( this.prevRound.task !== curTask ) {
            this.prevRound.task = curTask;
            this.prevRound.timeStart = new Date().getTime();
        }
        else {
            const diffTimeSec = ( (new Date().getTime()) - this.prevRound.timeStart ) / 1000;
            if(diffTimeSec > 15) { // Если выполняется больше 15 сек.

            }
        }

        const isTaskCompleted = curTask();
        if( isTaskCompleted ) {
            this.roundAlgorithm.shift();
        }

        setTimeout(this.runRoundTask.bind(this), this.iterationDelay);
    }


    static clickNextButton(title) {
        console.log(`Вызван метод clickNextButton`);

        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) return false;

        for (const span of button.querySelectorAll(`span`)) {
            if (span && span.textContent === title) {
                button.dispatchEvent(new Event('click', { bubbles: true }));

                // Вынимаем тек. задачу, подкладываем проверку, и возвращаем тек. задачу в очередь
                const currentTask = this.roundAlgorithm.shift();
                this.roundAlgorithm.unshift( ()=>this.isButtonSuccessfulPushed(title) );
                this.roundAlgorithm.unshift(currentTask);
                return true;
            }
        }

        return false;
    }

    static isButtonSuccessfulPushed(title) {
        console.log(`Вызван метод isButtonSuccessful`);

        const button = document.querySelector(`[data-test="player-next"]`);
        if(!button) return true;
        else {
            for (const span of button.querySelectorAll(`span`)) {
                if (span && span.textContent === title) {
                    button.dispatchEvent(new Event('click', { bubbles: true }));
                    return false;
                }
            }

            return true;
        }
    }

    static waitForTextarea(title) {
        console.log(`Вызван метод waitForTextarea`);
        const textarea = document.querySelector(`[data-test="challenge-translate-input"]`);
        if (textarea) {
            return true;
        }
        else {
            return false;
        }
    }

    static setAnswer() {
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
                answer = "cofe";
            }

            if( !question || !textarea ) throw new Error("Что-то пошло не так..");

            // this.setNativeValue(textarea, answer);
            textarea.textContent = answer;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    static countTheRound() {
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
                return true;
            }
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    static waitForReadyPage() {
        console.log(`Вызван метод waitForReadyPage`);
        if(window.location.href !== this.lessonUrl) {
            window.location.href = this.lessonUrl;
            return false;
        }

        if (document.readyState !== "complete") {
            return false;
        }

        return true;
    }

    static checkGameStatus() {
        // Проверка того что текущее окно не получение 20 баллов
        // класс фиолетовой кнопки: .tEvKV
        if( document.querySelector(`.tEvKV`) ) {
            this.winMode = false;
        }

        this.registerRoundTasks();
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
