import { addHourglassControl } from './controls.js'
import { Hourglass } from "./hourglass.js";

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
    Hooks.call('showHourglass', options);
  });
});

Hooks.on("showHourglass", async (options) => {
  const hourglass = new Hourglass(options).render(true);
})