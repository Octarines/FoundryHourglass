import { HourglassGui } from "./hourglass-gui.js";
import { Hourglass } from "./hourglass.js";
import { FlipDown } from "./flipdown.js";


export const initialiseHourglassMacros = () => {
  Hooks.on("ready", async () => {
    if(game.user.isGM) {
      game.modules.get('hourglass').api = {
        showTimerPreset,
        showTimer,
        closeAllTimers
        };
    }
  });
}

export const showTimer = (durationSeconds) => {
  var defaultOptions = HourglassGui.hourGlassDefaultOptions;
  defaultOptions.durationSeconds = durationSeconds;

  defaultOptions.id = Math.floor(Math.random() * 9999);
  game.socket.emit('module.hourglass', { type:'show', options: defaultOptions });
  Hooks.call('showHourglass', defaultOptions);
}

export const showTimerPreset = (presetTitle, duration = null) => {
    try {
      var presetJson = game.settings.get('hourglass','presets');
  
      if(!!presetJson) {
        const presets = JSON.parse(presetJson);
        const selectedOption = presets.find(x => x.title == presetTitle);
  
        selectedOption.id = Math.floor(Math.random() * 9999);

        if(!!duration && selectedOption.durationType == 'manual') {
          selectedOption.durationIncrements = duration;
        } else if(!!duration && selectedOption.durationType == 'timed') {
          selectedOption.durationSeconds = duration;
        } else {
          selectedOption.durationIncrements = Number(selectedOption.durationIncrements);
          selectedOption.durationSeconds = Number(selectedOption.durationSeconds);
          selectedOption.durationMinutes = Number(selectedOption.durationMinutes);   
        }
  
        if(!!selectedOption) {
          game.socket.emit('module.hourglass', { type:'show', options: selectedOption });
          Hooks.call('showHourglass', selectedOption);
        } else {
          console.log('No preset found with the title: ' + presetTitle);
        }
      } else {
        console.log('No existing hourglass presets found.')
      }
    }
    catch(ex) {
      console.log('Error displaying selected Hourglass Preset.', ex);
    }
}

export const closeAllTimers = () => {

  var runningTimers = FlipDown.timers.map(x => { 
    return { id: x.id, timerType: 'flipdown' }
  }).concat(Hourglass.timers.map(x => { 
    return { id: x.id, timerType: 'hourglass' }
  }));

  runningTimers.forEach(x => {
    game.socket.emit('module.hourglass', { type:'close', options: x });
    Hooks.call('closeHourglass', x);
  });
}