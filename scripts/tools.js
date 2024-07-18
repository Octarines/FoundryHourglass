export const uuidv4 = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export const setSelectedValue = (selectControlId, value) => {
    const selectControl = document.getElementById(selectControlId);

    for (var i = 0; i < selectControl.options.length; ++i) {
      if (selectControl.options[i].value === value) {
        selectControl.options[i].selected = true;
      }
    }
}

export const hideFormElements = (hideElements, formElementIds) => {
  formElementIds.forEach(elementId => {
    const formElement = document.getElementById(elementId);

    if(!!formElement) {
      formElement.style.display = hideElements ? "none" : "grid";
    }    
  });
}

export const playEndSound = (endSound, endSoundPath, global) => {
  if(game.user.isGM) {
    if(!!endSound && !!endSound.length) {
                    
      const soundPath = endSound === 'custom' ? endSoundPath : `./modules/hourglass/sounds/${endSound}.mp3`;
      
      foundry.audio.AudioHelper.play({
        src: soundPath,
        volume: 1.0,
        autoplay: true,
        loop: false},
        global)
        .then(result => {
          if(result.failed) {
            ui.notifications.warn(`Valid audio file could not be found at path ${soundPath}`);
          }
        });
    }
  }
}

export const restartCssAnimation = (elementId, cssClass) => {
  const element = document.getElementById(elementId);
  element.classList.remove(cssClass);
  void element.offsetWidth;
  element.classList.add(cssClass);
}