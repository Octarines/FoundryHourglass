import { uuidv4, setSelectedValue, hideFormElements, playEndSound } from "./tools.js";

export class HourglassGui extends FormApplication {
  constructor() {
    super();

    // default minimise/restore functionality currently breaks the hourglass instance window so has been disabled for now
    this._onToggleMinimize = async function(ev) {
      ev.preventDefault();
    };

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
    closeAtEnd: false
  };

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['hourglass-gui'],
      popOut: true,
      template: './modules/hourglass/templates/hourglass-gui.html',
      id: 'hourglass-gui-application',
      title: 'Hourglass',
    });
  }

  getData() {
    return {
      defaultOptions: HourglassGui.hourGlassDefaultOptions,
      presets: this.presets
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    this.initialisePresets();
    
    this.initialiseColourPicker();

    this.initialiseTypes();

    this.initialiseSoundPicker();

    // slight hack for checkbox and select dropdown initial value binding
    document.getElementById("hourglassTimeAsText").checked = HourglassGui.hourGlassDefaultOptions.timeAsText;
    document.getElementById("hourglassCloseAtEnd").checked = HourglassGui.hourGlassDefaultOptions.closeAtEnd;

    setSelectedValue("hourglassSize", HourglassGui.hourGlassDefaultOptions.size);
    setSelectedValue("endSound", HourglassGui.hourGlassDefaultOptions.endSound);
    setSelectedValue("durationType", HourglassGui.hourGlassDefaultOptions.durationType);
    setSelectedValue("styleSelect", HourglassGui.hourGlassDefaultOptions.style);

    document.getElementById('hourglass-gui-application').style.height = "auto";
  }

  _updateObject = async (_, formData) => {
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
      sandColour,
      endMessage,
      timerType,
      endSound,
      endSoundPath } = formData;

    const hourglassOptions = {
      id: Math.floor(Math.random() * 9999),
      durationType: durationType,
      durationSeconds: durationSeconds,
      durationMinutes: durationMinutes,
      durationIncrements: durationIncrements,
      title: title,
      style: style,
      size: size,
      timeAsText: timeAsText,
      closeAtEnd: closeAtEnd,
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
    document.getElementById('hourglassColour').addEventListener('input', function() {
      hourglassColourText.value = this.value;
    });

    document.getElementById('hourglassColourText').addEventListener('input', function() {
      hourglassColour.value = this.value;
    });
  }

  initialiseTypes() {
    const typeSelect = document.getElementById("timerType");
    typeSelect.onchange = () => this.refreshTypeOptions();

    setSelectedValue("timerType", HourglassGui.hourGlassDefaultOptions.timerType);

    const durationSelect = document.getElementById("durationType");
    durationSelect.onchange = () => this.refreshTypeOptions();

    setSelectedValue("durationType", HourglassGui.hourGlassDefaultOptions.durationType);

    this.refreshTypeOptions();
  }

  initialiseSoundPicker() {
    const soundPickerText = document.getElementById("endSoundPath");
    const soundPickerButton = document.getElementById("endSoundPathButton");

    soundPickerButton.onclick = () => {
      new FilePicker({
        type: "audio",
        current: soundPickerText.value,
        field: soundPickerText,
        callback: () => this.refreshEndSoundOptions()
      }).browse();
    };

    const soundPreviewButton = document.getElementById("endSoundPreview");
    soundPreviewButton.onclick = () => {
      const endSound = document.getElementById("endSound").value;
      const endSoundPath = document.getElementById("endSoundPath").value;

      playEndSound(endSound, endSoundPath, false);
    }

    const endSoundSelect = document.getElementById("endSound");
    endSoundSelect.onchange = () =>  this.refreshEndSoundOptions();

    setSelectedValue("endSound", HourglassGui.hourGlassDefaultOptions.endSound);
    this.refreshEndSoundOptions();
  }

  initialisePresets() {
    const presetsSelect = document.getElementById("hourglassPresets");
    const presetCreate = document.getElementById("hourglassNewPreset");
    const presetUpdate = document.getElementById("hourglassUpdatePreset");
    const presetDelete = document.getElementById("hourglassDeletePreset");

    this.populatePresetOptions();
    
    presetsSelect.onchange = () => this.onSelectedPresetChanged();
    presetCreate.onclick = () => this.savePreset(uuidv4());
    presetUpdate.onclick = () => this.updatePreset();
    presetDelete.onclick = () => this.deletePreset();

    this.refreshPresetButtons();
  }
  
  onSelectedPresetChanged () {
    const selectedValue = document.getElementById("hourglassPresets").value;

    const selectedOptions = this.presets.find(x => x.id == selectedValue);

    if(!!selectedOptions) {
      document.getElementById("hourglassTitle").value = selectedOptions.title;
      document.getElementById("hourglassDurationMinutes").value = selectedOptions.durationMinutes;
      document.getElementById("hourglassDurationSeconds").value = selectedOptions.durationSeconds;
      document.getElementById("hourglassDurationMinutes").value = selectedOptions.durationMinutes;
      document.getElementById("hourglassDurationIncrements").value = selectedOptions.durationIncrements;
      document.getElementById("hourglassColourText").value = selectedOptions.sandColour;
      document.getElementById("hourglassColour").value = selectedOptions.sandColour;
      document.getElementById("hourglassTimeAsText").checked = selectedOptions.timeAsText;
      document.getElementById("hourglassEndMessage").value = selectedOptions.endMessage;
      document.getElementById("endSoundPath").value = selectedOptions.endSoundPath ?? "";
      setSelectedValue("timerType", selectedOptions.timerType);

      //ensure presents saved before addition of new features default to a value that matches their previous behaviour
      setSelectedValue("durationType", selectedOptions.durationType === undefined ? "timed" : selectedOptions.durationType);
      setSelectedValue("hourglassSize", selectedOptions.size === undefined ? "large" : selectedOptions.size);
      setSelectedValue("endSound", selectedOptions.endSound === undefined ? "" : selectedOptions.endSound);
      document.getElementById("hourglassCloseAtEnd").checked = selectedOptions.closeAtEnd ?? false;
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
    const selectedValue = document.getElementById("hourglassPresets").value;
    const selectedPreset = this.presets.find(x => x.id == selectedValue);

    if(!!selectedPreset) {
      this.presets = this.presets.filter(x => x.id != selectedValue);
      this.savePreset(selectedPreset.id);
    }
  }

  savePreset(presetId) {
    const hourglassOptions = { 
      id: presetId,
      timerType: document.getElementById("timerType").value,
      title: document.getElementById("hourglassTitle").value,
      style: document.getElementById("styleSelect").value,
      size: document.getElementById("hourglassSize").value,
      durationType: document.getElementById("durationType").value,
      durationSeconds: document.getElementById("hourglassDurationSeconds").value,
      durationMinutes: document.getElementById("hourglassDurationMinutes").value,
      durationIncrements: document.getElementById("hourglassDurationIncrements").value,
      sandColour: document.getElementById("hourglassColourText").value,
      timeAsText: document.getElementById("hourglassTimeAsText").checked,
      closeAtEnd: document.getElementById("hourglassCloseAtEnd").checked,
      endMessage: document.getElementById("hourglassEndMessage").value,
      endSound: document.getElementById("endSound").value,
      endSoundPath: document.getElementById("endSoundPath").value
    };

    this.presets.push(hourglassOptions);

    game.settings.set('hourglass','presets', JSON.stringify(this.presets));

    this.populatePresetOptions();

    setSelectedValue("hourglassPresets", hourglassOptions.id);

    this.refreshPresetButtons();
  }

  deletePreset() {
    const selectedValue = document.getElementById("hourglassPresets").value;
    const selectedPreset = this.presets.find(x => x.id == selectedValue);

    if(!!selectedPreset) {
      this.presets = this.presets.filter(x => x.id != selectedValue);

      game.settings.set('hourglass','presets', JSON.stringify(this.presets));

      this.populatePresetOptions();
      this.refreshPresetButtons();
    }
  }

  populatePresetOptions() {
    const presetsSelect = document.getElementById("hourglassPresets");

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
    if(!!!document.getElementById("hourglassPresets").value) {
      document.getElementById("hourglassUpdatePreset").classList.add("hourglass-gui__form__button__disabled");
      document.getElementById("hourglassDeletePreset").classList.add("hourglass-gui__form__button__disabled");
    } else {
      document.getElementById("hourglassUpdatePreset").classList.remove("hourglass-gui__form__button__disabled");
      document.getElementById("hourglassDeletePreset").classList.remove("hourglass-gui__form__button__disabled");
    }
  }

  refreshTypeOptions() {
    const typeSelect = document.getElementById("timerType");
    const durationSelect = document.getElementById("durationType");

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
    } else {
      hideFormElements(true, ["hourglassDurationSecondsContainer", "hourglassDurationMinutesContainer", "hourglassTimeAsTextLabel"]);
      hideFormElements(false, ["hourglassDurationIncrementsContainer", "hourglassIncrementsAsTextLabel"]);
    }
  }

  setStyleOptions(options) {
    const styleSelect = document.getElementById("styleSelect");

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
    const endSound = document.getElementById("endSound").value;
    const endSoundPath = document.getElementById("endSoundPath").value;

    if(endSound === 'custom') {
      hideFormElements(false, ["endSoundPathContainer"]);
    } else {
      hideFormElements(true, ["endSoundPathContainer"]);
    }

    if(endSound === '' || (endSound === 'custom' && !!!endSoundPath && !!!endSoundPath.length)) {
      document.getElementById("endSoundPreview").classList.add("hourglass-gui__form__button__disabled");
    } else {
      document.getElementById("endSoundPreview").classList.remove("hourglass-gui__form__button__disabled");
    }
  }
}