export class Hourglass extends Application {

    constructor(options) {

        const id = Math.floor(Math.random() * 9999);

        super(
            {
                id:`hourglass-${id}`,
                title: options.title,
                classes:['hourglass'],
                popOut: true,
                template: './modules/hourglass/templates/hourglass.html'
            }
        );

        this._id = id;
        this._remainingTimeId = `hourglass-remaining-time-${this._id}`;
        this._canvasId = `hourglass-canvas-${this._id}`;
        
        this._title = options.title;
        this._timeAsText = options.timeAsText;
        this._sandColour = options.sandColour;
        this._endMessage = options.endMessage;

        this._duration = options.durationSeconds + (options.durationMinutes * 60);
    }
    
    getData() { 
        return {
          duration: this._timeAsText ? this.formatTimeForDisplay(this._duration) : '',
          sandColour: '#EDD0AA',
          remainingTimeId: `hourglass-remaining-time-${this._id}`,
          canvasId: `hourglass-canvas-${this._id}`
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.startTimer();
    }

    startTimer () {
        let canvasElement = document.getElementById(this._canvasId);
        canvasElement.style.setProperty('--sand-duration', this._duration + "s");
        canvasElement.style.setProperty('--sand-color', this._sandColour);

        this._elapsedTime = 0;

        this.showText();
    }

    showText() {
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