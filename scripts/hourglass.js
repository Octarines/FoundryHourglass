import { hideFormElements } from "./tools.js";

export class Hourglass extends Application {

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

        this._id = options.id;
        this._remainingTimeId = `hourglass-remaining-time-${this._id}`;
        this._canvasId = `hourglass-canvas-${this._id}`;
        this._hourglassTopId = `hourglass-top-${this._id}`;
        this._hourglassBottomId = `hourglass-bottom-${this._id}`;
        this._durationIncrementDecrease = `hourglass-decrease-${this._id}`;
        this._durationIncrementIncrease = `hourglass-increase-${this._id}`;
        this._hourglassDripId = `hourglass-drip-${this._id}`;
        
        this._title = options.title;
        this._timeAsText = options.timeAsText;
        this._sandColour = options.sandColour;
        this._endMessage = options.endMessage;

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
          hourglassDripId: this._hourglassDripId
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.initialiseTimer();
    }

    initialiseTimer () {
        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--sand-duration', this._duration + "s");
        canvasElement.style.setProperty('--sand-color', this._sandColour);

        this._elapsedTime = 0;

        if(this._durationType !== "manual") {
            hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease]);
            this.showTimeAsText();
        } else {
            var styleElem = document.head.appendChild(document.createElement("style"));
            styleElem.innerHTML = `#${this._hourglassTopId}:before {animation: none;} #${this._hourglassBottomId}:before {animation: none;}`;
            hideFormElements(true, [this._hourglassDripId]);

            if(game.user.isGM) {
                document.getElementById(this._durationIncrementDecrease).onclick = () => {
                    this.updateClients(-1)
                };
                document.getElementById(this._durationIncrementIncrease).onclick = () => {
                    this.updateClients(1)
                };
    
                document.getElementById(this._durationIncrementDecrease).disabled = true;
            } else {
                hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease]);
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
        }

        document.getElementById(this._durationIncrementIncrease).disabled = expired;
        document.getElementById(this._durationIncrementDecrease).disabled = this._elapsedTime == 0;

        const sandTranslation = ( remainingIncrements / this._durationIncrements ) * 100;

        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--translate-top-sand', 100 - sandTranslation + "%");
        canvasElement.style.setProperty('--translate-bottom-sand', sandTranslation + "%");
    }

    updateClients (value) {
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
}