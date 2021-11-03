

export class FlipDown extends Application {

  constructor(options) {
    const id = Math.floor(Math.random() * 9999);

    super(
      {
        id:`hourglass-${id}`,
        title: options.title,
        classes:['flipdownbody'],
        popOut: true,
        template: './modules/hourglass/templates/flipdown.html'
      }
    );

    this._id = id;
    this._remainingTimeId = `hourglass-remaining-time-${this._id}`;
    this._canvasId = `hourglass-canvas-${this._id}`;
    
    this._title = options.title;
    this._endMessage = options.endMessage;

    this._duration = options.durationSeconds + (options.durationMinutes * 60);
    
    this.rotors = [];
    this.rotorLeafFront = [];
    this.rotorLeafRear = [];
    this.rotorTops = [];
    this.rotorBottoms = [];
    
    this.rotorValues = [];
    this.previousRotorValues = [];

    
  }
  
  getData() { 
      return {
        canvasId: `hourglass-canvas-${this._id}`,
        remainingTimeId: `hourglass-remaining-time-${this._id}`,
      };
  }

  activateListeners(html) {
    super.activateListeners(html);

    this.flipdownElement = document.getElementById(this._canvasId);

    this.startTimer();
  }

  startTimer() {

    this.createRotors();

    this.updateClockValues(this._duration);

    this.updateClockValues(this._duration, true);

    this._elapsedTime = 0;

    const timerInterval = setInterval(() => {
      this._elapsedTime++;

      const remainingTime = this._duration - this._elapsedTime;

      this.updateClockValues(remainingTime);

      if(remainingTime <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  createRotors() {
    this.flipdownElement.appendChild(this.createRotorGroup("Hours"));
    this.flipdownElement.appendChild(this.createRotorGroup("Minutes"));
    this.flipdownElement.appendChild(this.createRotorGroup("Seconds"));

    this.rotorLeafFront = Array.prototype.slice.call(this.flipdownElement.getElementsByClassName("rotor-leaf-front"));
    this.rotorLeafRear = Array.prototype.slice.call(this.flipdownElement.getElementsByClassName("rotor-leaf-rear"));
    this.rotorTop = Array.prototype.slice.call(this.flipdownElement.getElementsByClassName("rotor-top"));
    this.rotorBottom = Array.prototype.slice.call(this.flipdownElement.getElementsByClassName("rotor-bottom"));
  }

  createRotorGroup(rotorHeading) {
    var rotorGroup = document.createElement("div");
    rotorGroup.className = "rotor-group";

    var dayRotorGroupHeading = document.createElement("div");
    dayRotorGroupHeading.className = "rotor-group-heading";
    dayRotorGroupHeading.setAttribute("data-before", rotorHeading);
    rotorGroup.appendChild(dayRotorGroupHeading);
    
    appendChildren(rotorGroup, [this.createRotor(), this.createRotor()]);
    return rotorGroup;
  }
  
  createRotor() {
    var rotor = document.createElement("div");
    var rotorLeaf = document.createElement("div");
    var rotorLeafRear = document.createElement("figure");
    var rotorLeafFront = document.createElement("figure");
    var rotorTop = document.createElement("div");
    var rotorBottom = document.createElement("div");
    rotor.className = "rotor";
    rotorLeaf.className = "rotor-leaf";
    rotorLeafRear.className = "rotor-leaf-rear";
    rotorLeafFront.className = "rotor-leaf-front";
    rotorTop.className = "rotor-top";
    rotorBottom.className = "rotor-bottom";
    rotorLeafRear.textContent = 0;
    rotorTop.textContent = 0;
    rotorBottom.textContent = 0;
    appendChildren(rotor, [rotorLeaf, rotorTop, rotorBottom]);
    appendChildren(rotorLeaf, [rotorLeafRear, rotorLeafFront]);
    return rotor;
  }
  
  updateClockValues(remainingTime, init = false) {

    if (remainingTime < 3600) {
      const remainingTimeObject = new Date(remainingTime * 1000);
      const seconds = String(remainingTimeObject.getSeconds()).padStart(2, "0");
      const minutes = String(remainingTimeObject.getMinutes()).padStart(2, "0");
      this.rotorValues = `00${minutes}${seconds}`.split("");
    } else {            
      const hours = String(Math.floor(remainingTime / 3600)).padStart(2, "0");
      const minutesSeconds = remainingTime - (hours * 3600);
      const remainingTimeObject = new Date(minutesSeconds * 1000);
      const seconds = String(remainingTimeObject.getSeconds()).padStart(2, "0");
      const minutes = String(remainingTimeObject.getMinutes()).padStart(2, "0");
      this.rotorValues = `${hours}${minutes}${seconds}`.split("");
    }

    this.rotorLeafFront.forEach( (el, i) => {
      el.textContent = this.previousRotorValues[i];
    });
    this.rotorBottom.forEach((el, i) => {
      el.textContent = this.previousRotorValues[i];
    });

    function rotorTopFlip() {
      this.rotorTop.forEach((el, i) => {
        if (el.textContent != this.rotorValues[i]) {
          el.textContent = this.rotorValues[i];
        }
      });
    }

    function rotorLeafRearFlip(remainingTime) {
      this.rotorLeafRear.forEach((el, i) => {
        if (el.textContent != this.rotorValues[i]) {
          el.textContent = this.rotorValues[i];
          el.parentElement.classList.add("flipped");
          var flip = setInterval(() => {
            if(remainingTime > 0)
            {
              el.parentElement.classList.remove("flipped");
            } else {
              const remainingTimeElement = document.getElementById(this._remainingTimeId);

              if(!!this._endMessage && !!remainingTimeElement) {
                remainingTimeElement.innerText = this._endMessage;
              }
            }
              
            clearInterval(flip);
          }, 500);
        }
      });
    }

    if (!init) {
      setTimeout(rotorTopFlip.bind(this), 500);
      setTimeout(rotorLeafRearFlip.bind(this, remainingTime), 500);
    } else {
      rotorTopFlip.call(this);
      rotorLeafRearFlip.call(this, remainingTime);
    }

    this.previousRotorValues = this.rotorValues;
  }
}

function appendChildren(parent, children) {
  children.forEach(function (el) {
    parent.appendChild(el);
  });
}