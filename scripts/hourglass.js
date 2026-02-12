import { hideFormElements, playEndSound, restartCssAnimation } from "./tools.js";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

export class Hourglass extends HandlebarsApplicationMixin(ApplicationV2) {

    _disable_popout_module = true;

    static timers = [];

    constructor(options = {}) {
        // Ensure id is a string for ApplicationV2
        if (options.id !== undefined) {
            options.id = String(options.id);
        }
        super(options);

        this._id = options.id;
        this._remainingTimeId = `hourglass-remaining-time-${this._id}`;
        this._canvasId = `hourglass-canvas-${this._id}`;
        this._windowId = `hourglass-${options.id}`;
        this._hourglassTopId = `hourglass-top-${this._id}`;
        this._hourglassBottomId = `hourglass-bottom-${this._id}`;
        this._durationIncrementDecrease = `hourglass-decrease-${this._id}`;
        this._durationIncrementIncrease = `hourglass-increase-${this._id}`;
        this._pauseId = `hourglass-pause-${this._id}`;
        this._restartId = `hourglass-restart-${this._id}`;
        this._hourglassDripId = `hourglass-drip-${this._id}`;
        
        this._title = options.title;
        this._style = options.style;
        this._timeAsText = options.timeAsText;
        this._sandColour = options.sandColour;
        this._endMessage = options.endMessage;
        this._endSound = options.endSound;
        this._endSoundPath = options.endSoundPath;
        this._closeAtEnd = options.closeAtEnd;
        this._textScale = 1;

        this._paused = false;

        this._timerInterval;

        switch(options.size) {
            case "tiny":
                {
                    this._height = 170;
                    this._width = 100;
                    this._scale = 0.5;
                    break;
                }
            case "small":
                {
                    this._height = 340;
                    this._width = 200;
                    this._scale = 0.6;
                    break;
                }
            case "medium":
                {
                    this._height = 460;
                    this._width = 270;
                    this._scale = 0.8;
                    break;
                }
            case "large":
                {
                    this._height = 600;
                    this._width = 350;
                    this._scale = 1;
                    break;
                }
            default: 
                {
                    this._height = 600;
                    this._width = 350;
                    this._scale = 1;
                    break;
                }
        }

        this._durationType = options.durationType;
        this._durationIncrements = options.durationIncrements;
        this._duration = options.durationSeconds + (options.durationMinutes * 60);

        this.closeApplication;
    }

    static DEFAULT_OPTIONS = {
        classes: ['hourglass'],
        window: {
            title: '',
            minimizable: false,
            resizable: false
        },
        position: {
            width: 'auto',
            height: 'auto'
        }
    };

    static PARTS = {
        window: {
            template: './modules/hourglass/templates/hourglass.html'
        }
    };

    get title() {
        return this._title;
    }

    get id() {
        return `hourglass-${this._id}`;
    }

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);

        if (!!this.id) {
            options.id = this.id;
        } 

        options.window ??= {};
        if (!!this.title) {
            options.window.title = this.title;
        }

        options.position ??= {};
        options.position.width = this._width;
        options.position.height = this._height;
    }
    
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        return {
            ...context,
            duration: this._timeAsText ? this.formatTimeForDisplay(this._duration) : '',
            sandColour: '#EDD0AA',
            remainingTimeId: this._remainingTimeId,
            canvasId: this._canvasId,
            hourglassTopId: this._hourglassTopId,
            hourglassBottomId: this._hourglassBottomId,
            durationIncrementDecrease: this._durationIncrementDecrease,
            durationIncrementIncrease: this._durationIncrementIncrease,
            pauseId: this._pauseId,
            restartId: this._restartId,
            hourglassDripId: this._hourglassDripId
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.initialiseTimer();
    }

    initialiseTimer () {
        let canvasElement = this.element.querySelector(`#${this._canvasId}`);
        if (canvasElement) {
            canvasElement.style.setProperty('--sand-duration', this._duration + "s");
            canvasElement.style.setProperty('--sand-color', this._sandColour);
            canvasElement.style.setProperty('--scale', this._scale);
            canvasElement.style.setProperty('--styleUrl', `url(../images/${this._style}.png)`);
        }

        this._elapsedTime = 0;

        if(this._durationType !== "manual") {
            hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease]);

            if(game.user.isGM) {
                const pauseBtn = this.element.querySelector(`#${this._pauseId}`);
                const restartBtn = this.element.querySelector(`#${this._restartId}`);
                if (pauseBtn) pauseBtn.onclick = () => { this.pauseClients(); };
                if (restartBtn) restartBtn.onclick = () => { this.restartClients(); };
            } else {
                hideFormElements(true, [this._pauseId, this._restartId]);
            } 

            this.pauseTimer(this._paused);
        } else {
            var styleElem = document.head.appendChild(document.createElement("style"));
            styleElem.innerHTML = `#${this._hourglassTopId}:before {animation: none;} #${this._hourglassBottomId}:before {animation: none;}`;
            hideFormElements(true, [this._hourglassDripId, this._pauseId, this._restartId]);

            if(game.user.isGM) {
                const decreaseBtn = this.element.querySelector(`#${this._durationIncrementDecrease}`);
                const increaseBtn = this.element.querySelector(`#${this._durationIncrementIncrease}`);
                if (decreaseBtn) decreaseBtn.onclick = () => { this.incrementClients(-1); };
                if (increaseBtn) increaseBtn.onclick = () => { this.incrementClients(1); };
                if (decreaseBtn) decreaseBtn.disabled = true;
            } else {
                hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease, this._pauseId, this._restartId]);
            }            

            if(this._timeAsText) {
                const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
                if (remainingTimeElement) remainingTimeElement.innerText = this._durationIncrements;
            }            
        }
    }

    updateIncrement (value) {
        this._elapsedTime += value;

        const remainingIncrements = this._durationIncrements - this._elapsedTime;
        const expired = this._durationIncrements <= this._elapsedTime;
        const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);

        if(this._timeAsText) {
            const displayTime = remainingIncrements;

            // Check the window is still open
            if(!!remainingTimeElement){
                remainingTimeElement.innerText = displayTime;
            }
        } else {
            if(!!remainingTimeElement){
                remainingTimeElement.innerText = "";
            }
        }

        if(expired) {
            if(!!this._endMessage && !!remainingTimeElement) {
                remainingTimeElement.innerText = this._endMessage;
            }

            playEndSound(this._endSound, this._endSoundPath, true);
        }

        const increaseBtn = this.element.querySelector(`#${this._durationIncrementIncrease}`);
        const decreaseBtn = this.element.querySelector(`#${this._durationIncrementDecrease}`);
        if (increaseBtn) increaseBtn.disabled = expired;
        if (decreaseBtn) decreaseBtn.disabled = this._elapsedTime == 0;

        const sandTranslation = ( remainingIncrements / this._durationIncrements ) * 100;

        let canvasElement = this.element.querySelector(`#${this._canvasId}`);
        if (canvasElement) {
            canvasElement.style.setProperty('--translate-top-sand', 100 - sandTranslation + "%");
            canvasElement.style.setProperty('--translate-bottom-sand', sandTranslation + "%");
        }
    }

    pauseTimer(paused) {
        this._paused = paused;
        
        let canvasElement = this.element.querySelector(`#${this._canvasId}`);

        if(!!canvasElement) {
            canvasElement.style.setProperty('--animationPlayState', this._paused ? 'paused' : 'running');

            const buttonIcon = this._paused ? 'play' : 'pause';
            const buttonText = this._paused ? 'Resume' : 'Pause';
    
            const pauseBtn = this.element.querySelector(`#${this._pauseId}`);
            if (pauseBtn) pauseBtn.innerHTML = `<i class="fas fa-${buttonIcon}" style="margin-right: 0.2em;"></i> ${buttonText}`;
        
            if(this._timeAsText) {
                this.displayRemainingTime();
            } else {
                const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
                if (remainingTimeElement) remainingTimeElement.innerText = this._paused ? "(Paused)" : "";
            }
        }        
        
        if(this._paused) {
            clearInterval(this._timerInterval);
        } else {
            this.startTimerCountdown();
        }
    }

    pauseClients() {
        this._paused = !this._paused;

        const pauseOptions = {
            id: this._id,
            pause: this._paused,
            timerType: 'hourglass'
        };

        game.socket.emit('module.hourglass', { type:'pause', options: pauseOptions });

        Hooks.call('pauseHourglass', pauseOptions);
    }

    restartTimer() {
        if(game.user.isGM) {
            hideFormElements(false, [this._pauseId]);
        }
        
        clearInterval(this._timerInterval);

        this._elapsedTime = 0;

        if(this._timeAsText) {
            this.displayRemainingTime();
        } else {
            const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
            if (remainingTimeElement) remainingTimeElement.innerText = this._paused ? "(Paused)" : "";
        }

        restartCssAnimation(this._hourglassTopId, "top");
        restartCssAnimation(this._hourglassBottomId, "bottom");
        restartCssAnimation(this._hourglassDripId, "drip");
        
        this.pauseTimer(this._paused);     
    }

    restartClients() {
        const restartOptions = {
            id: this._id,
            timerType: 'hourglass'
        };

        game.socket.emit('module.hourglass', { type:'restart', options: restartOptions });

        Hooks.call('restartHourglass', restartOptions);
    }

    closeClients() {
        const closeOptions = {
            id: this._id,
            timerType: 'hourglass'
        };

        game.socket.emit('module.hourglass', { type:'close', options: closeOptions });

        Hooks.call('closeHourglass', closeOptions);
    }

    incrementClients(value) {
        const incrementOptions = {
            id: this._id,
            increment: value,
            timerType: 'hourglass'
        };

        game.socket.emit('module.hourglass', { type:'increment', options: incrementOptions });

        Hooks.call('incrementHourglass', incrementOptions);
    }

    startTimerCountdown() {
        this._timerInterval = setInterval(() => {
            this._elapsedTime++;

            const expired = this._duration <= this._elapsedTime;

            if(this._timeAsText) {
                this.displayRemainingTime();
            }

            if(expired) {
                clearInterval(this._timerInterval);

                const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
                if(!!this._endMessage && !!remainingTimeElement) {
                    remainingTimeElement.innerText = this._endMessage;
                    playEndSound(this._endSound, this._endSoundPath, true);
                }

                hideFormElements(true, [this._pauseId]);

                if(this._closeAtEnd) {
                    this.closeTimer();
                }
            }
        }, 1000);
    }

    displayRemainingTime() {
        const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
        const remainingTime = this._duration - this._elapsedTime;

        let displayTime = this.formatTimeForDisplay(remainingTime);

        if(this._paused) {
            displayTime += " (Paused)";
        }

        // Check the window is still open
        if(!!remainingTimeElement){
            remainingTimeElement.innerText = displayTime;     
        } else {
            clearInterval(this._timerInterval);
        }
    }

    formatTimeForDisplay(time) {        
        let displayTime;

        if(time < 60) {
            displayTime = time;
        } else if (time < 3600) {
            const remainingTimeObject = new Date(time * 1000);
            displayTime = remainingTimeObject.toLocaleTimeString(navigator.language, {
                minute: '2-digit',
                second: '2-digit'
            });
        } else {            
            const hours = Math.floor(time / 3600);
            const minutesSeconds = time - (hours * 3600);
            const remainingTimeObject = new Date(minutesSeconds * 1000);
            const minutesSecondsText = remainingTimeObject.toLocaleTimeString(navigator.language, {
                minute: '2-digit',
                second: '2-digit'
            });
            displayTime = `${hours}:${minutesSecondsText}`;
        }

        return displayTime;
    }    

    // override built in "close" method to allow proliferation of close behaviour to player clients
    close(){
        if(game.user.isGM) {
            this.closeClients();
        } else {
            this.closeTimer();
        }
    }

    closeTimer() {
        clearInterval(this._timerInterval);
        super.close(this);
    }
}