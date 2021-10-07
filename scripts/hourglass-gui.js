export class HourglassGui extends FormApplication {
  constructor() {
    super();
  }

  static hourGlassDefaultOptions = {
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
    return HourglassGui.hourGlassDefaultOptions;
  }

  activateListeners(html) {
    super.activateListeners(html);

    var hourglassColourText = document.getElementById('hourglassColourText');
    var hourglassColour = document.getElementById('hourglassColour');

    hourglassColour.addEventListener('input', function() {
      hourglassColourText.value = this.value;
    });

    hourglassColourText.addEventListener('input', function() {
      hourglassColour.value = this.value;
    });
  }

  static isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
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
      closeOnEnd,
      endMessage } = formData;

    const hourglassOptions = { 
      durationSeconds: durationSeconds,
      durationMinutes: durationMinutes,
      title: title,
      timeAsText: timeAsText,
      sandColour: sandColour,
      closeOnEnd: closeOnEnd,
      endMessage: endMessage
    };

    HourglassGui.hourGlassDefaultOptions = hourglassOptions;

    game.socket.emit('module.hourglass', hourglassOptions);

    Hooks.call('showHourglass', hourglassOptions);
  }
}