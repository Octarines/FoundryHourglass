import { hideFormElements, playEndSound } from "./tools.js";

export class Hourglass extends Application {

    _disable_popout_module = true;

    static timers = [];

    constructor(options) {

        super(
            {
                id:`hourglass-${options.id}`,
                title: options.title,
                classes:['hourglass'],
                popOut: true,
                template: './modules/hourglass/templates/hourglass.html'
            }
        );


        // default minimise/restore functionality currently breaks the hourglass instance window so has been disabled for now
        this._onToggleMinimize = async function(ev) {
            ev.preventDefault();
        };


        this._id = options.id;
        this._remainingTimeId = `hourglass-remaining-time-${this._id}`;
        this._canvasId = `hourglass-canvas-${this._id}`;
        this._windowId = `hourglass-${options.id}`;
        this._hourglassTopId = `hourglass-top-${this._id}`;
        this._hourglassBottomId = `hourglass-bottom-${this._id}`;
        this._durationIncrementDecrease = `hourglass-decrease-${this._id}`;
        this._durationIncrementIncrease = `hourglass-increase-${this._id}`;
        this._durationReset = `duration-reset-${this._id}`;
        this._pauseId = `hourglass-pause-${this._id}`;
        this._hourglassDripId = `hourglass-drip-${this._id}`;

        this._title = options.title;
        this._style = options.style;
        this._timeAsText = options.timeAsText;
        this._sandColour = options.sandColour;
        this._endMessage = options.endMessage;
        this._endSound = options.endSound;
        this._endSoundPath = options.endSoundPath;
        this._textScale = 1;

        this._paused = false;

        switch(options.size) {
            case "tiny":
                {
                    this._height = "170px";
                    this._width = "100px";
                    this._scale = 0.5;
                    break;
                }
            case "small":
                {
                    this._height = "340px";
                    this._width = "200px";
                    this._scale = 0.6;
                    break;
                }
            case "medium":
                {
                    this._height = "460px";
                    this._width = "270px";
                    this._scale = 0.8;
                    break;
                }
            case "large":
                {
                    this._height = "600px";
                    this._width = "350px";
                    this._scale = 1;
                    break;
                }
            default:
                {
                    this._height = "600px";
                    this._width = "350px";
                    this._scale = 1;
                    break;
                }
        }

        this._durationType = options.durationType;
        this._durationIncrements = options.durationIncrements;
        this._duration = options.durationSeconds + (options.durationMinutes * 60);
    }

    getData() {
        return {
          duration: this._timeAsText ? this.formatTimeForDisplay(this._duration) : '',
          sandColour: '#EDD0AA',
          remainingTimeId: this._remainingTimeId,
          canvasId: this._canvasId,
          hourglassTopId: this._hourglassTopId,
          hourglassBottomId: this._hourglassBottomId,
          durationIncrementDecrease: this._durationIncrementDecrease,
          durationIncrementIncrease: this._durationIncrementIncrease,
          pauseId: this._pauseId,
          hourglassDripId: this._hourglassDripId
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.initialiseTimer();
    }

    initialiseTimer () {
        let windowElement = document.getElementById(this._windowId);
        windowElement.style.setProperty('height', this._height);
        windowElement.style.setProperty('width', this._width);

        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--sand-duration', this._duration + "s");
        canvasElement.style.setProperty('--sand-color', this._sandColour);
        canvasElement.style.setProperty('--scale', this._scale);
        canvasElement.style.setProperty('--styleUrl', `url(../images/${this._style}.png)`)

        this._elapsedTime = 0;

        const resetButton = document.getElementById(this._durationReset);
        resetButton.onclick = () => {
            this.resetTimer();
        };

        if(this._durationType !== "manual") {
            hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease]);

            if(game.user.isGM) {
                document.getElementById(this._pauseId).onclick = () => {
                    this.pauseClients();
                };
            } else {
                hideFormElements(true, [this._pauseId]);
            }

            this.showTimeAsText();
        } else {
            var styleElem = document.head.appendChild(document.createElement("style"));
            styleElem.innerHTML = `#${this._hourglassTopId}:before {animation: none;} #${this._hourglassBottomId}:before {animation: none;}`;
            hideFormElements(true, [this._hourglassDripId, this._pauseId]);

            if(game.user.isGM) {
                document.getElementById(this._durationIncrementDecrease).onclick = () => {
                    this.incrementClients(-1);
                };
                document.getElementById(this._durationIncrementIncrease).onclick = () => {
                    this.incrementClients(1);
                };
                document.getElementById(this._durationIncrementDecrease).disabled = true;
            } else {
                hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease, this._pauseId]);
            }

            if(this._timeAsText) {
                const remainingTimeElement = document.getElementById(this._remainingTimeId);
                remainingTimeElement.innerText = this._durationIncrements;
            }
        }
    }

    updateIncrement (value) {
        this._elapsedTime += value;

        const remainingIncrements = this._durationIncrements - this._elapsedTime;
        const expired = this._durationIncrements <= this._elapsedTime;
        const remainingTimeElement = document.getElementById(this._remainingTimeId);

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

        document.getElementById(this._durationIncrementIncrease).disabled = expired;
        document.getElementById(this._durationIncrementDecrease).disabled = this._elapsedTime == 0;

        const sandTranslation = ( remainingIncrements / this._durationIncrements ) * 100;

        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--translate-top-sand', 100 - sandTranslation + "%");
        canvasElement.style.setProperty('--translate-bottom-sand', sandTranslation + "%");
    }

    pauseTimer(pause) {
        this._paused = pause;

        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--animationPlayState', this._paused ? 'paused' : 'running');

        const buttonIcon = this._paused ? 'play' : 'pause';
        const buttonText = this._paused ? 'Resume' : 'Pause';

        document.getElementById(this._pauseId).innerHTML = `<i class="fas fa-${buttonIcon}" style="margin-right: 0.2em;"></i> ${buttonText}`;

        const remainingTimeElement = document.getElementById(this._remainingTimeId);

        if(pause) {
            remainingTimeElement.innerText += " (Paused)";
        } else {
            remainingTimeElement.innerText = "";
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

    incrementClients(value) {
        const incrementOptions = {
            id: this._id,
            increment: value,
            timerType: 'hourglass'
        };

        game.socket.emit('module.hourglass', { type:'increment', options: incrementOptions });

        Hooks.call('incrementHourglass', incrementOptions);
    }

    showTimeAsText() {
        const timerInterval = setInterval(() => {
            if(!this._paused) {
                this._elapsedTime++;

                const expired = this._duration <= this._elapsedTime;

                const remainingTimeElement = document.getElementById(this._remainingTimeId);

                if(this._timeAsText) {
                    const remainingTime = this._duration - this._elapsedTime;

                    const displayTime = this.formatTimeForDisplay(remainingTime);

                    // Check the window is still open
                    if(!!remainingTimeElement){
                        remainingTimeElement.innerText = displayTime;
                    } else {
                        clearInterval(timerInterval);
                    }
                }

                if(expired) {
                    clearInterval(timerInterval);

                    if(!!this._endMessage && !!remainingTimeElement) {
                        remainingTimeElement.innerText = this._endMessage;
                    }

                    hideFormElements(true, [this._pauseId]);

                    playEndSound(this._endSound, this._endSoundPath, true);
                }
            }
        }, 1000);
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

  resetTimer() {
    console.log(`Resetting timer!`)
    this._elapsedTime = 0;

    // const remainingTimeElement = document.getElementById(this._remainingTimeId);
    // remainingTimeElement.innerText = "";

    // document.getElementById(this._durationIncrementDecrease).disabled = true;
    // document.getElementById(this._durationIncrementIncrease).disabled = false;

    let canvasElement = document.getElementById(this._canvasId);
    canvasElement.style.setProperty('--translate-top-sand', "0%");
    canvasElement.style.setProperty('--translate-bottom-sand', "100%");
  }
}
