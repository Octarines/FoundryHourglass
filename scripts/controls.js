import { HourglassGui } from './hourglass-gui.js';

export const addHourglassControl = () => {

    Hooks.on("getSceneControlButtons", (controls) => {
        controls[0].tools.push({
        name: 'hourglass',
        title: 'Hourglass',
        icon: 'far fa-hourglass',
        button: true,
        onClick: () => new HourglassGui().render(true),
        visible: game.user.isGM
        })
    });
}