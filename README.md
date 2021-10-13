# FoundryHourglass

A configurable animated graphical timer (hourglass) for foundry VTT that can be shown by the GM to all players.

![Hourglass Window][1]

## Hourglass Options

To create a new hourglass, a Game Master may select the hourglass icon under the _Basic Controls_. This will open the options window for you to configure your hourglass.

![Hourglass Window][2]

+ **Title** - The display name of the hourglass that will appear at the top left.
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


[1]: demo/hourglass-default.PNG
[2]: demo/hourglass-options.PNG
[3]: demo/hourglass-custom.PNG
[4]: demo/hourglass-custom-endmessage.PNG