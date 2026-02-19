import { uuidv4, setSelectedValue, hideFormElements, playEndSound } from "./tools.js";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

export class HourglassGui extends HandlebarsApplicationMixin(ApplicationV2) {
  _disable_popout_module = true;

  get id() {
    return "hourglass-gui";
  }

  constructor(options = {}) {
    super(options);

    let presetJson;

    try {
      presetJson = game.settings.get('hourglass','presets');
    }
    catch(ex) {
      console.log('No existing hourglass presets found.')
    }

    if(!!presetJson) {
      this.presets = JSON.parse(presetJson);
    } else {
      this.presets = [];
    }
  }

  static hourGlassDefaultOptions = {
    id: "7689a471-bc02-4151-8ce9-68ff30737e8c",
    timerType: "hourglass",
    durationType: "timed",
    durationSeconds: 30,
    durationMinutes: 0,
    durationIncrements: 4,
    sandColour: "#EDD0AA",
    title: "Hourglass",
    style: "Hourglass_Empty",
    size: "large",
    timeAsText: true,
    endMessage: "",
    endSound: "",
    endSoundPath: "",
    closeAtEnd: false,
    syncWithFoundryPause: false
  };

  static DEFAULT_OPTIONS = {
    id: 'hourglass-gui-application',
    classes: ['hourglass-gui'],
    window: {
      title: 'Hourglass',
      minimizable: false
    },
    position: {
      width: 'auto',
      height: 'auto'
    }
  };

  static PARTS = {
    window: {
      template: './modules/hourglass/templates/hourglass-gui.html'
    }
  };

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    if (!!this.id) {
      options.id = this.id;
    }

    options.window ??= {};
    if (!!this.title) {
      options.window.title = "Hourglass";
    }

    options.position ??= {};
    options.position.width ??= 520;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return {
      ...context,
      defaultOptions: HourglassGui.hourGlassDefaultOptions,
      presets: this.presets
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);

    // Find the form element and attach submit handler
    const form = this.element.querySelector('form');
    if (!!form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        this._onSubmitForm({}, event);
      });
    }

    this.initialisePresets();
    
    this.initialiseColourPicker();

    this.initialiseTypes();

    this.initialiseSoundPicker();

    // slight hack for checkbox and select dropdown initial value binding
    this.element.querySelector("#hourglassTimeAsText").checked = HourglassGui.hourGlassDefaultOptions.timeAsText;
    this.element.querySelector("#hourglassCloseAtEnd").checked = HourglassGui.hourGlassDefaultOptions.closeAtEnd;
    this.element.querySelector("#hourglassSyncWithFoundryPause").checked = HourglassGui.hourGlassDefaultOptions.syncWithFoundryPause;

    setSelectedValue("hourglassSize", HourglassGui.hourGlassDefaultOptions.size);
    setSelectedValue("endSound", HourglassGui.hourGlassDefaultOptions.endSound);
    setSelectedValue("durationType", HourglassGui.hourGlassDefaultOptions.durationType);
    setSelectedValue("styleSelect", HourglassGui.hourGlassDefaultOptions.style);

    this.element.style.height = "auto";
  }

  async _onSubmitForm(formConfig, event) {
    const formData = new foundry.applications.ux.FormDataExtended(event.target).object;
    if(formData.durationType === "timed") {
      if (formData.durationSeconds <= 0 && formData.durationMinutes <= 0)
        return ui.notifications.warn("Please insert a duration greater than 0!");

      const totalTime = formData.durationSeconds + (formData.durationMinutes * 60);

      if(totalTime >= 360000)
        return ui.notifications.warn("Total entered time cannot be higher than 100 hours!");

    } else if(formData.durationType === "manual") {
      if (formData.durationIncrements <= 0)
        return ui.notifications.warn("Please insert a number of increments greater than 0!");
    }

    const { 
      durationType,
      durationSeconds,
      durationMinutes,
      durationIncrements,
      title,
      style,
      size,
      timeAsText,
      closeAtEnd,
      syncWithFoundryPause,
      sandColour,
      endMessage,
      timerType,
      endSound,
      endSoundPath } = formData;

    const hourglassOptions = {
      id: String(Math.floor(Math.random() * 9999)),
      durationType: durationType,
      durationSeconds: durationSeconds,
      durationMinutes: durationMinutes,
      durationIncrements: durationIncrements,
      title: title,
      style: style,
      size: size,
      timeAsText: timeAsText,
      closeAtEnd: closeAtEnd,
      syncWithFoundryPause: syncWithFoundryPause,
      sandColour: sandColour,
      endMessage: endMessage,
      timerType: timerType,
      endSound: endSound,
      endSoundPath: endSoundPath
    };

    HourglassGui.hourGlassDefaultOptions = hourglassOptions;

    game.socket.emit('module.hourglass', { type:'show', options: hourglassOptions });

    Hooks.call('showHourglass', hourglassOptions);
  }

  initialiseColourPicker() {
    const hourglassColour = this.element.querySelector('#hourglassColour');
    const hourglassColourText = this.element.querySelector('#hourglassColourText');
    
    hourglassColour.addEventListener('input', function() {
      hourglassColourText.value = this.value;
    });

    hourglassColourText.addEventListener('input', function() {
      hourglassColour.value = this.value;
    });
  }

  initialiseTypes() {
    const typeSelect = this.element.querySelector("#timerType");
    typeSelect.onchange = () => this.refreshTypeOptions();

    setSelectedValue("timerType", HourglassGui.hourGlassDefaultOptions.timerType);

    const durationSelect = this.element.querySelector("#durationType");
    durationSelect.onchange = () => this.refreshTypeOptions();

    setSelectedValue("durationType", HourglassGui.hourGlassDefaultOptions.durationType);

    this.refreshTypeOptions();
  }

  initialiseSoundPicker() {
    const soundPickerText = this.element.querySelector("#endSoundPath");
    const soundPickerButton = this.element.querySelector("#endSoundPathButton");

    soundPickerButton.onclick = () => {
      new FilePicker({
        type: "audio",
        current: soundPickerText.value,
        field: soundPickerText,
        callback: () => this.refreshEndSoundOptions()
      }).browse();
    };

    const soundPreviewButton = this.element.querySelector("#endSoundPreview");
    soundPreviewButton.onclick = () => {
      const endSound = this.element.querySelector("#endSound").value;
      const endSoundPath = this.element.querySelector("#endSoundPath").value;

      playEndSound(endSound, endSoundPath, false);
    }

    const endSoundSelect = this.element.querySelector("#endSound");
    endSoundSelect.onchange = () =>  this.refreshEndSoundOptions();

    setSelectedValue("endSound", HourglassGui.hourGlassDefaultOptions.endSound);
    this.refreshEndSoundOptions();
  }

  initialisePresets() {
    const presetsSelect = this.element.querySelector("#hourglassPresets");
    const presetCreate = this.element.querySelector("#hourglassNewPreset");
    const presetUpdate = this.element.querySelector("#hourglassUpdatePreset");
    const presetDelete = this.element.querySelector("#hourglassDeletePreset");

    this.populatePresetOptions();
    
    presetsSelect.onchange = () => this.onSelectedPresetChanged();
    presetCreate.onclick = () => this.savePreset(uuidv4());
    presetUpdate.onclick = () => this.updatePreset();
    presetDelete.onclick = () => this.deletePreset();

    this.refreshPresetButtons();
  }
  
  onSelectedPresetChanged () {
    const selectedValue = this.element.querySelector("#hourglassPresets").value;

    const selectedOptions = this.presets.find(x => x.id == selectedValue);

    if(!!selectedOptions) {
      this.element.querySelector("#hourglassTitle").value = selectedOptions.title;
      this.element.querySelector("#hourglassDurationMinutes").value = selectedOptions.durationMinutes;
      this.element.querySelector("#hourglassDurationSeconds").value = selectedOptions.durationSeconds;
      this.element.querySelector("#hourglassDurationMinutes").value = selectedOptions.durationMinutes;
      this.element.querySelector("#hourglassDurationIncrements").value = selectedOptions.durationIncrements;
      this.element.querySelector("#hourglassColourText").value = selectedOptions.sandColour;
      this.element.querySelector("#hourglassColour").value = selectedOptions.sandColour;
      this.element.querySelector("#hourglassTimeAsText").checked = selectedOptions.timeAsText;
      this.element.querySelector("#hourglassEndMessage").value = selectedOptions.endMessage;
      this.element.querySelector("#endSoundPath").value = selectedOptions.endSoundPath ?? "";
      setSelectedValue("timerType", selectedOptions.timerType);

      //ensure presents saved before addition of new features default to a value that matches their previous behaviour
      setSelectedValue("durationType", selectedOptions.durationType === undefined ? "timed" : selectedOptions.durationType);
      setSelectedValue("hourglassSize", selectedOptions.size === undefined ? "large" : selectedOptions.size);
      setSelectedValue("endSound", selectedOptions.endSound === undefined ? "" : selectedOptions.endSound);
      this.element.querySelector("#hourglassCloseAtEnd").checked = selectedOptions.closeAtEnd ?? false;
      this.element.querySelector("#hourglassSyncWithFoundryPause").checked = selectedOptions.syncWithFoundryPause ?? false;
    }

    this.refreshPresetButtons();
    this.refreshTypeOptions();

    if(!!selectedOptions) {
      //since the available styles is dependent on the timer type, we need to set this value AFTER the type options have been populated
      const defaultStyle = selectedOptions.timerType == "hourglass" ? "Hourglass_Empty" : "Flipdown";
      setSelectedValue("styleSelect", selectedOptions.style === undefined ? defaultStyle : selectedOptions.style);
    }

    this.refreshEndSoundOptions();
  }

  updatePreset() {
    const selectedValue = this.element.querySelector("#hourglassPresets").value;
    const selectedPreset = this.presets.find(x => x.id == selectedValue);

    if(!!selectedPreset) {
      this.presets = this.presets.filter(x => x.id != selectedValue);
      this.savePreset(selectedPreset.id);
    }
  }

  savePreset(presetId) {
    const hourglassOptions = { 
      id: presetId,
      timerType: this.element.querySelector("#timerType").value,
      title: this.element.querySelector("#hourglassTitle").value,
      style: this.element.querySelector("#styleSelect").value,
      size: this.element.querySelector("#hourglassSize").value,
      durationType: this.element.querySelector("#durationType").value,
      durationSeconds: this.element.querySelector("#hourglassDurationSeconds").value,
      durationMinutes: this.element.querySelector("#hourglassDurationMinutes").value,
      durationIncrements: this.element.querySelector("#hourglassDurationIncrements").value,
      sandColour: this.element.querySelector("#hourglassColourText").value,
      timeAsText: this.element.querySelector("#hourglassTimeAsText").checked,
      closeAtEnd: this.element.querySelector("#hourglassCloseAtEnd").checked,
      syncWithFoundryPause: this.element.querySelector("#hourglassSyncWithFoundryPause").checked,
      endMessage: this.element.querySelector("#hourglassEndMessage").value,
      endSound: this.element.querySelector("#endSound").value,
      endSoundPath: this.element.querySelector("#endSoundPath").value
    };

    this.presets.push(hourglassOptions);

    game.settings.set('hourglass','presets', JSON.stringify(this.presets));

    this.populatePresetOptions();

    setSelectedValue("hourglassPresets", hourglassOptions.id);

    this.refreshPresetButtons();
  }

  deletePreset() {
    const selectedValue = this.element.querySelector("#hourglassPresets").value;
    const selectedPreset = this.presets.find(x => x.id == selectedValue);

    if(!!selectedPreset) {
      this.presets = this.presets.filter(x => x.id != selectedValue);

      game.settings.set('hourglass','presets', JSON.stringify(this.presets));

      this.populatePresetOptions();
      this.refreshPresetButtons();
    }
  }

  populatePresetOptions() {
    const presetsSelect = this.element.querySelector("#hourglassPresets");

    const listLength = presetsSelect.options.length - 1;

    for(let i = listLength; i > 0; i--) {
      presetsSelect.remove(i);
    }

    const sortedPresets = this.presets.sort((a, b) => a.title.localeCompare(b.title));

    for (let i = 0; i < sortedPresets.length; i++) {
      let option = document.createElement("option");
      option.text = sortedPresets[i].title;
      option.value = sortedPresets[i].id;      
      presetsSelect.appendChild(option);
    }
  }

  refreshPresetButtons() {
    if(!!!this.element.querySelector("#hourglassPresets").value) {
      this.element.querySelector("#hourglassUpdatePreset").classList.add("hourglass-gui__form__button__disabled");
      this.element.querySelector("#hourglassDeletePreset").classList.add("hourglass-gui__form__button__disabled");
    } else {
      this.element.querySelector("#hourglassUpdatePreset").classList.remove("hourglass-gui__form__button__disabled");
      this.element.querySelector("#hourglassDeletePreset").classList.remove("hourglass-gui__form__button__disabled");
    }
  }

  refreshTypeOptions() {
    const typeSelect = this.element.querySelector("#timerType");
    const durationSelect = this.element.querySelector("#durationType");

    if(typeSelect.value === "flipdown") {
      hideFormElements(true, ["hourglassColourContainer", "hourglassTimeAsTextContainer"]);
      this.setStyleOptions([{
        text: "Brass",
        value: "Flipdown"
      },{
        text: "Plastic",
        value: "Flipdown_Plastic"
      }]);

      //default selected value seems to be first alphabetically so setting this "original" styles
      setSelectedValue("styleSelect", "Flipdown");
    } else {
      hideFormElements(false, ["hourglassColourContainer", "hourglassTimeAsTextContainer"]);
      this.setStyleOptions([{
        text: "Wooden",
        value: "Hourglass_Empty"
      },{
        text: "Plastic",
        value: "Hourglass_Empty_Plastic"
      },{
        text: "Stone (Round)",
        value: "Hourglass_Empty_Stone_Round"
      },{
        text: "Stone (Square)",
        value: "Hourglass_Empty_Stone_Square"
      }]);

      //default selected value seems to be first alphabetically so setting this "original" styles
      setSelectedValue("styleSelect", "Hourglass_Empty");
    }

    if(durationSelect.value === "timed") {
      hideFormElements(false, ["hourglassDurationSecondsContainer", "hourglassDurationMinutesContainer", "hourglassTimeAsTextLabel"]);
      hideFormElements(true, ["hourglassDurationIncrementsContainer", "hourglassIncrementsAsTextLabel"]);
      hideFormElements(false, ["hourglassSyncWithFoundryPauseContainer"]);
    } else {
      hideFormElements(true, ["hourglassDurationSecondsContainer", "hourglassDurationMinutesContainer", "hourglassTimeAsTextLabel"]);
      hideFormElements(false, ["hourglassDurationIncrementsContainer", "hourglassIncrementsAsTextLabel"]);
      hideFormElements(true, ["hourglassSyncWithFoundryPauseContainer"]);
    }
  }

  setStyleOptions(options) {
    const styleSelect = this.element.querySelector("#styleSelect");

    for(let i = styleSelect.options.length; i >= 0; i--) {
      styleSelect.remove(i);
    }

    const sortedOptions = options.sort((a, b) => a.text.localeCompare(b.text));

    for(let i = 0; i < sortedOptions.length; i++) {
        const option = sortedOptions[i];
        let optionElement = document.createElement("option");
        optionElement.textContent = option.text;
        optionElement.value = option.value;
        styleSelect.appendChild(optionElement);
    }
  }

  refreshEndSoundOptions() {
    const endSound = this.element.querySelector("#endSound").value;
    const endSoundPath = this.element.querySelector("#endSoundPath").value;

    if(endSound === 'custom') {
      hideFormElements(false, ["endSoundPathContainer"]);
    } else {
      hideFormElements(true, ["endSoundPathContainer"]);
    }

    if(endSound === '' || (endSound === 'custom' && !!!endSoundPath && !!!endSoundPath.length)) {
      this.element.querySelector("#endSoundPreview").classList.add("hourglass-gui__form__button__disabled");
    } else {
      this.element.querySelector("#endSoundPreview").classList.remove("hourglass-gui__form__button__disabled");
    }
  }
}