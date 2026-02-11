import { HourglassGui } from './hourglass-gui.js';

function addSceneControlButton(menuStructure, category, button) {
    let menuCategory;
    if (game.release.generation <= 12) {
        menuCategory = menuStructure.find(c => c.layer === category);
        if (menuCategory) {
            if (button.onChange) {
                button.onClick = button.onChange;
                delete button.onChange;
            }
            menuCategory.tools.push(button);
        }
    } else {
        menuCategory = menuStructure[category];
        if (menuCategory) {
            menuCategory.tools[button.name] = button;
        }
    }
}

export const addHourglassControl = () => {

    Hooks.on("getSceneControlButtons", (controls) => {
        addSceneControlButton(controls, "tokens", {
            name: 'hourglass',
            title: 'Hourglass',
            icon: 'far fa-hourglass',
            button: true,
            onChange: () => new HourglassGui().render(true),
            visible: game.user.isGM
        });
    });
}