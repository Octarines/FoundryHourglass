import { hideFormElements, playEndSound } from "./tools.js";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

export class FlipDown extends HandlebarsApplicationMixin(ApplicationV2) {

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
    this._durationIncrementDecrease = `hourglass-decrease-${this._id}`;
    this._durationIncrementIncrease = `hourglass-increase-${this._id}`;
    this._pauseId = `hourglass-pause-${this._id}`;
    this._restartId = `hourglass-restart-${this._id}`;
    
    this._title = options.title;
    this._style = options.style;
    this._endMessage = options.endMessage;
    this._endSound = options.endSound;
    this._endSoundPath = options.endSoundPath;
    this._closeAtEnd = options.closeAtEnd;

    this._durationType = options.durationType;
    this._duration = options.durationSeconds + (options.durationMinutes * 60);
    this._durationIncrements = options.durationIncrements;
    this._timerInterval;
    
    this.rotors = [];
    this.rotorLeafFront = [];
    this.rotorLeafRear = [];
    this.rotorTops = [];
    this.rotorBottoms = [];
    
    this.rotorValues = [];
    this.previousRotorValues = [];

    this._textScale = 1;

    this._paused = false;

    switch(options.size) {
      case "tiny":
        {
          this._height = 100;
          this._width = 160;
          this._scale = 0.08;
          this._messageScale = 0.5;
          break;
        }
      case "small":
        {
          this._height = 150;
          this._width = 280;
          this._scale = 0.3;
          this._messageScale = 0.6;
          break;
        }
      case "medium":
        {
          this._height = 225;
          this._width = 480;
          this._scale = 0.7;
          this._messageScale = 0.8;
          break;
        }
      case "large":
        {
          this._height = 300;
          this._width = 640;
          this._scale = 0.9;
          this._messageScale = 1;
          break;
        }
      default: 
        {
          this._height = 300;
          this._width = 640;
          this._scale = 1;
          this._messageScale = 1;
          break;
        }
    }    
  }

  static DEFAULT_OPTIONS = {
    classes: ['flipdownbody'],
    window: {
      title: '',
      minimizable: false
    },
    position: {
      width: 'auto',
      height: 'auto'
    }
  };

  static PARTS = {
    window: {
      template: './modules/hourglass/templates/flipdown.html'
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
      canvasId: `hourglass-canvas-${this._id}`,
      remainingTimeId: `hourglass-remaining-time-${this._id}`,
      durationIncrementDecrease: this._durationIncrementDecrease,
      durationIncrementIncrease: this._durationIncrementIncrease,
      pauseId: this._pauseId,
      restartId: this._restartId
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    this.flipdownElement = this.element.querySelector(`#${this._canvasId}`);

    this.initialiseTimer();
  }

  initialiseTimer () {
    // Set CSS variables on the application element
    if (this.element) {
      this.element.style.setProperty('--scale', this._scale);
      this.element.style.setProperty('--messageScale', this._messageScale);
      this.element.style.setProperty('--styleUrl', `url(../images/${this._style}.png)`);
    }

    this.createRotors();

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

      this.updateClockValues(this._duration, false);
      this.updateClockValues(this._duration, true);
      this.pauseTimer(this._paused);
    } else {
      hideFormElements(true, [this._pauseId, this._restartId]);
      this.updateClockValues(this._durationIncrements);

      this.updateClockValues(this._durationIncrements, true, true);

      if(game.user.isGM) {
          const decreaseBtn = this.element.querySelector(`#${this._durationIncrementDecrease}`);
          const increaseBtn = this.element.querySelector(`#${this._durationIncrementIncrease}`);
          if (decreaseBtn) decreaseBtn.onclick = () => { this.incrementClients(-1); };
          if (increaseBtn) increaseBtn.onclick = () => { this.incrementClients(1); };
      } else {
          hideFormElements(true, [this._durationIncrementDecrease, this._durationIncrementIncrease]);
      }          
    }
  }

  startTimerCountdown() {
    this._timerInterval = setInterval(() => {
      this._elapsedTime++;

      const remainingTime = this._duration - this._elapsedTime;

      this.updateClockValues(remainingTime, false);

      if(remainingTime <= 0) {
        clearInterval(this._timerInterval);
      }      
    }, 1000);
  }

  updateIncrement (value) {
    this._elapsedTime += value;
    const expired = this._durationIncrements <= this._elapsedTime;

    const increaseBtn = this.element.querySelector(`#${this._durationIncrementIncrease}`);
    if (increaseBtn) increaseBtn.disabled = expired;

    const remainingIncrements = this._durationIncrements - this._elapsedTime;
  
    this.updateClockValues(remainingIncrements, false, true);
  }

  pauseTimer(paused) {
    this._paused = paused;

    const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);    
    if(!!remainingTimeElement) {
      remainingTimeElement.innerText = this._paused ? "(Paused)" : "";

      const buttonIcon = this._paused ? 'play' : 'pause';
      const buttonText = this._paused ? 'Resume' : 'Pause';

      const pauseBtn = this.element.querySelector(`#${this._pauseId}`);
      if (pauseBtn) pauseBtn.innerHTML = `<i class="fas fa-${buttonIcon}" style="margin-right: 0.2em;"></i> ${buttonText}`;      
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
          timerType: 'flipdown'
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

    this.updateClockValues(this._duration, false);
    this.updateClockValues(this._duration, true);

    const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
    if (remainingTimeElement) remainingTimeElement.innerText = this._paused ? "(Paused)" : "";
    
    this.pauseTimer(this._paused);      
  }

  restartClients() {
      const restartOptions = {
          id: this._id,
          timerType: 'flipdown'
      };

      game.socket.emit('module.hourglass', { type:'restart', options: restartOptions });

      Hooks.call('restartHourglass', restartOptions);
  }

  closeClients() {
    const closeOptions = {
        id: this._id,
        timerType: 'flipdown'
    };

    game.socket.emit('module.hourglass', { type:'close', options: closeOptions });

    Hooks.call('closeHourglass', closeOptions);
  }

  incrementClients(value) {
    const incrementOptions = {
        id: this._id,
        increment: value,
        timerType: 'flipdown'
    };

    game.socket.emit('module.hourglass', { type:'increment', options: incrementOptions });

    Hooks.call('incrementHourglass', incrementOptions);
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
  
  updateClockValues(remainingTime, initialise, manual = false) {

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

    if (initialise || manual) {
      rotorTopFlip.call(this);
      rotorLeafRearFlip.call(this, remainingTime, !manual);      
    } else {
      setTimeout(rotorTopFlip.bind(this), 500);
      setTimeout(rotorLeafRearFlip.bind(this, remainingTime, !manual), 500);
    }

    this.previousRotorValues = this.rotorValues;
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

function rotorTopFlip() {
  this.rotorTop.forEach((el, i) => {
    if (el.textContent != this.rotorValues[i]) {
      el.textContent = this.rotorValues[i];
    }
  });
}

function rotorLeafRearFlip(remainingTime, animate) {
  this.rotorLeafRear.forEach((el, i) => {
    if (el.textContent != this.rotorValues[i]) {
      el.textContent = this.rotorValues[i];
      el.parentElement.classList.add("flipped");
      
      if(animate) {
        var flip = setInterval(() => {
          if(remainingTime > 0)
          {
            if(animate) {
              el.parentElement.classList.remove("flipped");
            }          
          } else {
            setEndMessage.call(this, remainingTime <= 0);
          }
            
          clearInterval(flip);
        }, 500);
      } else {
        setEndMessage.call(this, remainingTime <= 0);
      }      
    }
  });
}

function setEndMessage(showMessage) {
  const remainingTimeElement = this.element.querySelector(`#${this._remainingTimeId}`);
  
  if(!!this._endMessage && !!remainingTimeElement && showMessage) {
    remainingTimeElement.innerText = this._endMessage;
  } else if (!!remainingTimeElement) {
    remainingTimeElement.innerText = "";
  }
  
  if(showMessage) {
    playEndSound(this._endSound, this._endSoundPath, true);
    hideFormElements(true, [this._pauseId]);

    if(this._closeAtEnd) {
      this.closeTimer();
    }
  }  
}

function appendChildren(parent, children) {
  children.forEach(function (el) {
    parent.appendChild(el);
  });
}