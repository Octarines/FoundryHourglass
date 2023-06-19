import { addHourglassControl } from './controls.js'
import { Hourglass } from "./hourglass.js";
import { FlipDown } from "./flipdown.js";

Hooks.on("init", async () => {
  addHourglassControl(controls);
});

Hooks.on("setup", async() => {
  await game.settings.register('hourglass', 'presets', {
    name: 'presets',
    hint: 'A list of preset hourglass options.',
    scope: 'world',
    config: false,
    type: String,
    filePicker: false,
  });
});

Hooks.once("ready", () => {
  game.socket.on('module.hourglass', ( options ) => {
    switch(options.type) {
      case 'show':
        Hooks.call('showHourglass', options.options);
        break;
      case 'increment':
        Hooks.call('incrementHourglass', options.options);
        break;
      case 'pause':
        Hooks.call('pauseHourglass', options.options);
        break;
    }
  });
});

Hooks.on("showHourglass", async (options) => {
  switch(options.timerType) {
    case 'flipdown':
      FlipDown.timers.push({ id: options.id, timer: new FlipDown(options).render(true) });
      break;
    default:
      Hourglass.timers.push({ id: options.id, timer: new Hourglass(options).render(true) });
  }
})

Hooks.on("incrementHourglass", async (options) => {
  switch(options.timerType) {
    case 'flipdown':
      FlipDown.timers.find(x => x.id === options.id)?.timer?.updateIncrement(options.increment);
      break;
    default:
      Hourglass.timers.find(x => x.id === options.id)?.timer?.updateIncrement(options.increment);
  }
})

Hooks.on("pauseHourglass", async (options) => {
  switch(options.timerType) {
    case 'flipdown':
      FlipDown.timers.find(x => x.id === options.id)?.timer?.pauseTimer(options.pause);
      break;
    default:
      Hourglass.timers.find(x => x.id === options.id)?.timer?.pauseTimer(options.pause);
  }
})
