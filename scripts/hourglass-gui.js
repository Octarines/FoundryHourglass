import { uuidv4 } from "./tools.js";

export class HourglassGui extends FormApplication {
  constructor() {
    super();

    const presetJson = game.settings.get('hourglass','presets');

    if(!!presetJson) {
      this.presets = JSON.parse(presetJson);
    } else {
      this.presets = [];
    }
  }

  static hourGlassDefaultOptions = {
    id: "7689a471-bc02-4151-8ce9-68ff30737e8c",
    durationSeconds: 30,
    durationMinutes: 0,
    sandColour: "#EDD0AA",
    title: "Hourglass",
    timeAsText: true,
    endMessage: ""
  };

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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

    // slight hack for checkbox initial value binding
    document.getElementById("hourglassTimeAsText").checked = HourglassGui.hourGlassDefaultOptions.timeAsText;
  }

  _updateObject = async (_, formData) => {
    if (formData.durationSeconds <= 0 && formData.durationMinutes <= 0)
      return ui.notifications.warn("Please insert a duration greater than 0!");

    const { 
      durationSeconds, 
      durationMinutes, 
      title, 
      timeAsText,
      sandColour,
      endMessage } = formData;

    const hourglassOptions = {
      durationSeconds: durationSeconds,
      durationMinutes: durationMinutes,
      title: title,
      timeAsText: timeAsText,
      sandColour: sandColour,
      endMessage: endMessage
    };

    HourglassGui.hourGlassDefaultOptions = hourglassOptions;

    game.socket.emit('module.hourglass', hourglassOptions);

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
      document.getElementById("hourglassDurationSeconds").value = selectedOptions.durationSeconds;
      document.getElementById("hourglassDurationMinutes").value = selectedOptions.durationMinutes;
      document.getElementById("hourglassColourText").value = selectedOptions.sandColour;
      document.getElementById("hourglassColour").value = selectedOptions.sandColour;
      document.getElementById("hourglassTimeAsText").checked = selectedOptions.timeAsText;
      document.getElementById("hourglassEndMessage").value = selectedOptions.endMessage;
    }

    this.refreshPresetButtons();
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
      title: document.getElementById("hourglassTitle").value,
      durationSeconds: document.getElementById("hourglassDurationSeconds").value,
      durationMinutes: document.getElementById("hourglassDurationMinutes").value,
      sandColour: document.getElementById("hourglassColourText").value,
      timeAsText: document.getElementById("hourglassTimeAsText").checked,
      endMessage: document.getElementById("hourglassEndMessage").value
    };

    this.presets.push(hourglassOptions);

    game.settings.set('hourglass','presets', JSON.stringify(this.presets));

    this.populatePresetOptions();

    const presetsList = document.getElementById("hourglassPresets");

    for (var i = 0; i < presetsList.options.length; ++i) {
      if (presetsList.options[i].value === hourglassOptions.id) {
        presetsList.options[i].selected = true;
      }
    }

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
}