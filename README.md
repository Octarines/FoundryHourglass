# Foundry Hourglass

![Latest Release Download Count](https://img.shields.io/badge/dynamic/json?label=Downloads%20(Latest)&query=assets%5B0%5D.download_count&url=https%3A%2F%2Fapi.github.com%2Frepos%2FOctarines%2FFoundryHourglass%2Freleases%2Flatest)
![Latest Release Download Count](https://img.shields.io/github/downloads/octarines/foundryhourglass/total?color=purple&label=Downloads%20%28Total%29)
![Hourglass Latest Version](https://img.shields.io/github/v/release/octarines/foundryhourglass?color=yellow&label=Latest%20Version)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fhourglass&colorB=4aa94a)
![Foundry Verified Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FOctarines%2FFoundryHourglass%2Fmain%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange)

Configurable animated graphical timers & round trackers for foundry VTT that can be shown by the GM to all players.

![Hourglass Timer][1]
![Flipdown Timer][6]

## Hourglass Options

To create a new hourglass, a Game Master may select the hourglass icon under the _Token Controls_. 

![Hourglass Menu][8]

This will open the options window for you to configure your hourglass.

![Hourglass Window][2]

+ **Timer Type** - The type of animated graphic to show to players. Options currently include "Hourglass" & "Flipdown Clock".
+ **Title** - The display name of the timer that will appear at the top left.
+ **Style** - The visual style of the timer graphic to be displayed.
+ **Size** - The display size of the timer window: Tiny, Small, Medium & Large.
+ **Duration Type** - Whether the timer should be an automatic (timed) or manual "on click" countdown.
+ **Duration (Seconds/Minutes)** - The time taken for the hourglass to complete.
+ **Sand Colour** - The hex value for the colour of the sand in the hourglass. Can be typed manually or selected using the colour picker.
+ **Display time as text?** - Indicates whether you wish to display the remaining time as a text overlay on the hourglass.
+ **End message** - Text to be displayed as an overlay on the hourglass after the duration has passed.
+ **End sound** - Sound to be played to all players after the duration has passed (more details below).
+ **Close after duration?** - Indicates whether you wish the timer window to automatically close (for all users) after the duration has passed.

## Usage

The _start hourglass_ button, once pressed, will cause a new hourglass window to appear on the screen of all players currently in the game session using the chosen options:

![Hourglass Timer Purple][3]

Once the duration has elapsed, the remaining time will dissapear and be replaced by the _end message_ (if one has been entered):

![Hourglass Timer Message][4]

An _end sound_ will also be played to all players (if one has been selected).

Players can move the hourglass around the screen while it is counting down. They do also have the option of closing it, though they should only do this once the duration has elapsed.

Once an hourglass has been created, the module will retain the "last used" settings for the duration of the session. This means that you can create subsequent hourglasses using the same settings without having to re-enter them.

Multiple hourglasses can be opened by a GM at one time, should you wish to track multiple events simultaneously.

## Manual "on click" control
Timers can be set to "manual" control by setting the Duration type to "Manual (user click)" in the hourglass options.

![Hourglass Timer Manual][7]

The manual timers feature a forward and backward button that, when clicked, will decrease and increase the remaining increments respectively. This could potentially be used by GMs to include manually controlled/incremented events or round tracking within their games. Both forward and back buttons are only visible to users with the GM role.

## Styles
As well as changing the sand colour, each timer has a range of different visual styles to choose from.

<table>
<tr>
<td>
<img src="https://raw.githubusercontent.com/Octarines/FoundryHourglass/main/demo/hourglass-custom-round.PNG"
     alt="Hourglass Timer Round Stone"/>
</td>
<td>
<img src="https://raw.githubusercontent.com/Octarines/FoundryHourglass/main/demo/hourglass-custom-square.PNG"
     alt="Hourglass Timer Round Stone"/>
</td>
</tr>
</table>
Each style has all of the same functionality and customisation options as the default.

A heartfelt thankyou to artist [Zael](https://foundryvtt.com/community/zael) for creating some fantastic alternative timer styles with a range of themes.

## Presets

Game Masters have the ability to save Hourglass Options as _Presets_. This will allow frequently used configurations to be quickly recalled and displayed.

![Hourglass Window Preset][5]

+ **Select Preset** - Presents a dropdown list of all previously saved Hourglasses. A GM can select a preset from this list to populate all options fields with data saved for that preset.
+ **Save New** - Will persist all currently entered options as a new Preset with a name matching the Title field.
+ **Update Selected** - Will update an existing selected Preset with currently entered options. If the title field has been changed, the name of the preset will also be updated. If no _Preset is selected from the dropdown, this button will be disabled_.
+ **Delete Selected** - Will delete an existing selected preset. _If no Preset is selected from the dropdown, this button will be disabled_.

## End Sound
Games masters can choose to play a sound at the end of the timer duration by selecting it from the "End Sound" dropdown in the options window.

![Hourglass Window Sounds][9]

Once selected, the sound can be previewed (in the GM's client only) by pressing the "Play" button on the right of the dropdown.

There are a range of pre-loaded sounds to choose from.
The GM may alternatively choose to add their own sound from a file by selecting "Select from audio file...". Once selected, the GM can use the file picker to select a previously uploaded audio file or upload a new one.

When an End Sound is selected, this sound will play in all clients where the timer window appears once the timer duration has elapsed. 

## Timer Controls
Once a timer has been created, the countdown & animation can be paused or restarted by use of the "Timer Controls" in the top right of the timer window.
The "Timer Control" buttons are only visible for users with GM role.

### Pausing
Pressing the "pause" button will have the effect of pausing the countdown for all players.

![Hourglass Timer Pause][10]

This will cause the animation to stop playing and for the words "(Paused)" to appear in the text area of the window. In the case where "Display time as text" has been selected, the "(Paused)" indicator will be appended to the remaining time.

![Hourglass Timer Resume][11]

To resume the countdown, the GM can simply press the "Resume" button (which has replaced the "Pause" button) in the top right of the window.

### Restarting
Pressing the "restart" button will have the effect of restarting the countdown and animation for all players. 

![Hourglass Timer Resume][12]

The timer can be restarted at any time, including after the duration is expired & when paused.

If a player has closed their timer window, the restart will also have the added effect of redisplaying it for them.

## Closing the Timer
Closing a timer window as a user with GM role will also close that timer for all other players. 

Pressing the "close" button as a non-GM user will still only close the window for yourself.

## Macro Support
From version 1.9 the ability to show and start Hourglass timer windows from macros has been introduced. 

To access the new hourglass API, enter the following line as a **Script**:

`game.modules.get('hourglass').api`

The following methods are available:

+ **`showTimer(duration: number)`** - Displays and starts a default hourglass with the entered duration.
+ **`showTimerPreset(presetTitle: string, duration: number = null)`** - Displays and starts a previously saved preset timer with the matching title property. The duration for the preset timer can be overridden by entering a duration (in seconds) into the second optional parameter. For countdown timers, this property is set as the "duration seconds". For manual timers, this property is set as the "increments".
+ **`closeAllTimers()`** - Closes all open timers for all players.

As the Hourglass module is limited to use by GM and Assistant GM users, non-GM players will not have access to call these API methods.

### Example Usage:

![Hourglass Timer Resume][13]

## Popout!
The Popout! module is disabled for Hourglass Timer windows due to compatibility issues.

[1]: demo/hourglass-default.PNG
[2]: demo/hourglass-options.PNG
[3]: demo/hourglass-custom.PNG
[4]: demo/hourglass-custom-endmessage.PNG
[5]: demo/hourglass-options-presets.PNG
[6]: demo/flipdown.PNG
[7]: demo/hourglass-manual.PNG
[8]: demo/hourglass-menu.jpg
[9]: demo/hourglass-options-sound.PNG
[10]: demo/hourglass-pause.png
[11]: demo/hourglass-paused.png
[12]: demo/hourglass-restart.png
[13]: demo/hourglass-macro-examples.png