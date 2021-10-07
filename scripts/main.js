import { addHourglassControl } from './controls.js'
import { Hourglass } from "./hourglass.js";

Hooks.on("init", async () => {
  addHourglassControl(controls);
});

Hooks.once("ready", () => {
  game.socket.on('module.hourglass', ( options ) => {
    Hooks.call('showHourglass', options);
  });
});

Hooks.on("showHourglass", async (options) => {
  const hourglass = new Hourglass(options).render(true);
})