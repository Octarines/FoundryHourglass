# FoundryHourglass

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads%20(Latest)&query=assets%5B0%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FOctarines%2FFoundryHourglass%2Freleases%2Flatest)
![Latest Release Download Count](https://img.shields.io/github/downloads/octarines/foundryhourglass/total?color=blue&label=Downloads%20%28Total%29)
![Hourglass Latest Version](https://img.shields.io/github/v/release/octarines/foundryhourglass?color=yellow&label=Latest%20Version)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fhourglass&colorB=4aa94a)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FOctarines%2FFoundryHourglass%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)

Configurable animated graphical timers & round trackers for foundry VTT that can be shown by the GM to all players.

![Hourglass Window][1]
![Hourglass Window][6]

## Hourglass Options

To create a new hourglass, a Game Master may select the hourglass icon under the _Basic Controls_. This will open the options window for you to configure your hourglass.

![Hourglass Window][2]

+ **Timer Type** - The type of animated graphic to show to players. Options currently include "Hourglass" & "Flipdown Clock".
+ **Title** - The display name of the hourglass that will appear at the top left.
+ **Duration Type** - Whether the timer should be an automatic (timed) or manual "on click" countdown.
+ **Duration (Seconds/Minutes)** - The time taken for the hourglass to complete.
+ **Sand Colour** - The hex value for the colour of the sand in the hourglass. Can be typed manually or selected using the colour picker.
+ **Display time as text?** - Indicates whether you wish to display the remaining time as a text overlay on the hourglass.
+ **End message** - Text to be displayed as an overlay on the hourglass after the duration has passed.

## Usage

The _start hourglass_ button, once pressed, will cause a new hourglass window to appear on the screen of all players currently in the game session using the chosen options:

![Hourglass Window][3]

Once the duration has elapsed, the remaining time will dissapear and be replaced by the _end message_ (if one has been entered):

![Hourglass Window][4]

Players can move the hourglass around the screen while it is counting down. They do also have the option of closing it, though they should only do this once the duration has elapsed.

Once an hourglass has been created, the module will retain the "last used" settings for the duration of the session. This means that you can create subsequent hourglasses using the same settings without having to re-enter them.

Multiple hourglasses can be opened by a GM at one time, should you wish to track multiple events simultaneously.

## Manual "on click" control
Timers can now be set to "manual" control by setting the Duration type to "Manual (user click) in the hourglass options.

![Hourglass Window][7]

The manual timers feature a forward and backward button that, when clicked, will decrease and increase the remaining increments respectively. This could potentially be used by GMs to include manually controlled/incremented event or round tracking within their games.

## Presets

Game Masters now have the ability to save Hourglass Options as _Presets_. This will allow frequently used configurations to be quickly recalled and displayed.

![Hourglass Window][5]

+ **Select Preset** - Presents a dropdown list of all previously saved Hourglasses. A GM can select a preset from this list to populate all options fields with data saved for that preset.
+ **Save New** - Will persist all currently entered options as a new Preset with a name matching the Title field.
+ **Update Selected** - Will update an existing selected Preset with currently entered options. If the title field has been changed, the name of the preset will also be updated. If no _Preset is selected from the dropdown, this button will be disabled_.
+ **Delete Selected** - Will delete an existing selected preset. _If no Preset is selected from the dropdown, this button will be disabled_.


[1]: demo/hourglass-default.PNG
[2]: demo/hourglass-options.PNG
[3]: demo/hourglass-custom.PNG
[4]: demo/hourglass-custom-endmessage.PNG
[5]: demo/hourglass-options-presets.PNG
[6]: demo/flipdown.PNG
[7]: demo/hourglass-manual.PNG