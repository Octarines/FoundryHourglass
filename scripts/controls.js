import { HourglassGui } from './hourglass-gui.js';

export const addHourglassControl = () => {

    Hooks.on("getSceneControlButtons", (controls) => {

        let button = {
            name: 'hourglass',
            title: 'Hourglass',
            icon: 'far fa-hourglass',
            button: true,
            onChange: () => new HourglassGui().render({ force: true }),
            visible: game.user.isGM
        }

        let menuCategory = controls["tokens"];
        if (menuCategory) {
            menuCategory.tools[button.name] = button;
        }
    });
}