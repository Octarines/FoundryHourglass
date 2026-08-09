import { addHourglassControl } from './controls.js'
import { initialiseHourglassMacros } from './macros.js'
import { Hourglass } from "./hourglass.js";
import { FlipDown } from "./flipdown.js";

const MODULE_ID = 'hourglass';
const ACTIVE_TIMERS_SETTING = 'activeTimers';
const PRESETS_SETTING = 'presets';

const getTimerCollection = (timerType) => {
  return timerType === 'flipdown' ? FlipDown.timers : Hourglass.timers;
}

const findTimerInstance = (timerType, id) => {
  const stringId = String(id);
  return getTimerCollection(timerType).find(x => String(x.id) === stringId)?.timer;
}

const loadActiveTimers = () => {
  try {
    const json = game.settings.get(MODULE_ID, ACTIVE_TIMERS_SETTING);
    return json ? JSON.parse(json) : [];
  } catch (err) {
    console.warn('Hourglass | Failed to load active timers from settings.', err);
    return [];
  }
}

const saveActiveTimers = async (timers) => {
  if (!game.user.isGM) {
    return;
  }

  await game.settings.set(MODULE_ID, ACTIVE_TIMERS_SETTING, JSON.stringify(timers));
}

const getDurationSeconds = (options) => {
  const seconds = Number(options.durationSeconds ?? 0);
  const minutes = Number(options.durationMinutes ?? 0);
  return seconds + (minutes * 60);
}

const applyPauseTransition = (state, isPaused, now = Date.now()) => {
  if ((state.options.durationType ?? 'timed') === 'manual') {
    return state;
  }

  const wasPaused = !!state.paused;
  let accumulatedPausedMs = Number(state.accumulatedPausedMs ?? 0);
  let pausedAt = state.pausedAt ?? null;

  if (!wasPaused && isPaused) {
    pausedAt = now;
  } else if (wasPaused && !isPaused && !!state.pausedAt) {
    accumulatedPausedMs += Math.max(0, now - Number(state.pausedAt));
    pausedAt = null;
  }

  return {
    ...state,
    paused: isPaused,
    pausedAt,
    accumulatedPausedMs
  };
}

const buildTimerState = (options) => {
  const paused = typeof options.paused === 'boolean' ? options.paused : (options.syncWithFoundryPause ? game.paused : false);

  return {
    id: String(options.id),
    timerType: options.timerType ?? 'hourglass',
    options: foundry.utils.deepClone(options),
    createdAt: Date.now(),
    paused,
    pausedAt: paused ? Date.now() : null,
    accumulatedPausedMs: 0,
    elapsedManual: 0
  };
}

const updateTimerState = async (id, timerType, updater) => {
  const stringId = String(id);
  const activeTimers = loadActiveTimers();
  const index = activeTimers.findIndex(x => x.id === stringId && x.timerType === timerType);

  if (index < 0) {
    return;
  }

  const updatedState = updater(activeTimers[index]);
  if (!updatedState) {
    activeTimers.splice(index, 1);
  } else {
    activeTimers[index] = updatedState;
  }

  await saveActiveTimers(activeTimers);
}

const upsertTimerState = async (timerState) => {
  const activeTimers = loadActiveTimers();
  const index = activeTimers.findIndex(x => x.id === timerState.id && x.timerType === timerState.timerType);

  if (index < 0) {
    activeTimers.push(timerState);
  } else {
    activeTimers[index] = timerState;
  }

  await saveActiveTimers(activeTimers);
}

const removeTimerState = async (id, timerType) => {
  const stringId = String(id);
  const filtered = loadActiveTimers().filter(x => !(x.id === stringId && x.timerType === timerType));
  await saveActiveTimers(filtered);
}

const getRestoredTimerOptions = (timerState) => {
  const restoredOptions = foundry.utils.deepClone(timerState.options);
  restoredOptions.id = String(timerState.id);

  if (restoredOptions.durationType === 'manual') {
    return {
      options: {
        ...restoredOptions,
        elapsedManual: Number(timerState.elapsedManual ?? 0),
        _restored: true
      },
      manualIncrement: 0
    };
  }

  const now = Date.now();
  const duration = getDurationSeconds(restoredOptions);
  const activePauseMs = timerState.paused && timerState.pausedAt ? now - Number(timerState.pausedAt) : 0;
  const elapsedMs = Math.max(0, now - Number(timerState.createdAt ?? now) - Number(timerState.accumulatedPausedMs ?? 0) - activePauseMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, duration - elapsedSeconds);

  if (remainingSeconds <= 0) {
    if (restoredOptions.closeAtEnd) {
      return null;
    }

    restoredOptions.remainingSeconds = 0;
    restoredOptions.paused = false;
    restoredOptions._restored = true;
    restoredOptions._restoredExpired = true;

    return {
      options: restoredOptions,
      manualIncrement: 0
    };
  }

  restoredOptions.remainingSeconds = remainingSeconds;
  restoredOptions.paused = !!timerState.paused;
  restoredOptions._restored = true;

  return {
    options: restoredOptions,
    manualIncrement: 0
  };
}

const restoreActiveTimers = async () => {
  const activeTimers = loadActiveTimers();

  if (!activeTimers.length) {
    return;
  }

  const validTimers = [];

  for (const timerState of activeTimers) {
    const timerType = timerState.timerType ?? 'hourglass';
    if (!!findTimerInstance(timerType, timerState.id)) {
      validTimers.push(timerState);
      continue;
    }

    const restored = getRestoredTimerOptions(timerState);
    if (!restored) {
      continue;
    }

    Hooks.call('showHourglass', restored.options);

    if (restored.manualIncrement) {
      Hooks.call('incrementHourglass', {
        id: String(timerState.id),
        increment: restored.manualIncrement,
        timerType
      });
    }

    validTimers.push(timerState);
  }

  if (validTimers.length !== activeTimers.length) {
    await saveActiveTimers(validTimers);
  }
}

Hooks.on("init", async () => {
  addHourglassControl();
  initialiseHourglassMacros();
});

Hooks.on("setup", async() => {
  await game.settings.register(MODULE_ID, PRESETS_SETTING, {
    name: 'presets',
    hint: 'A list of preset hourglass options.',
    scope: 'world',
    config: false,
    type: String,
    filePicker: false,
  });

  await game.settings.register(MODULE_ID, ACTIVE_TIMERS_SETTING, {
    name: 'activeTimers',
    hint: 'Persisted active timer state for reconnect and refresh recovery.',
    scope: 'world',
    config: false,
    type: String,
    default: '[]'
  });
});

Hooks.once("ready", async () => {
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
      case 'restart':
        Hooks.call('restartHourglass', options.options); 
        break;
      case 'close':
        Hooks.call('closeHourglass', options.options);
        break;
    }
  });

  await restoreActiveTimers();
});

Hooks.on("showHourglass", async (options) => {
  if (!!findTimerInstance(options.timerType, options.id)) {
    return;
  }

  const isRestored = !!options._restored;

  switch(options.timerType) {
    case 'flipdown':
      const flipdownTimer = new FlipDown(options);
      await flipdownTimer.render({ force: true });
      FlipDown.timers.push({ id: options.id, timer: flipdownTimer });
      break;
    default:
      const hourglassTimer = new Hourglass(options);
      await hourglassTimer.render({ force: true });
      Hourglass.timers.push({ id: options.id, timer: hourglassTimer });
  }

  if (!isRestored) {
    await upsertTimerState(buildTimerState(options));
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

  await updateTimerState(options.id, options.timerType, (state) => {
    if ((state.options.durationType ?? 'timed') !== 'manual') {
      return state;
    }

    const maxIncrements = Number(state.options.durationIncrements ?? 0);
    const current = Number(state.elapsedManual ?? 0);
    const next = Math.min(maxIncrements, Math.max(0, current + Number(options.increment ?? 0)));
    return {
      ...state,
      elapsedManual: next
    };
  });
})

Hooks.on("pauseHourglass", async (options) => {
  switch(options.timerType) {
    case 'flipdown':
      FlipDown.timers.find(x => x.id === options.id)?.timer?.pauseTimer(options.pause);
      break;
    default:
      Hourglass.timers.find(x => x.id === options.id)?.timer?.pauseTimer(options.pause);
  }

  await updateTimerState(options.id, options.timerType, (state) => applyPauseTransition(state, !!options.pause));
})

Hooks.on("restartHourglass", async (options) => {
  let timer;

  switch(options.timerType) {
    case 'flipdown':
      timer = FlipDown.timers.find(x => x.id === options.id)?.timer;
      break;
    default:
      timer = Hourglass.timers.find(x => x.id === options.id)?.timer;
      break;
  }

  if(!!timer) {
    if(timer.rendered) {
      timer.restartTimer();
    } else {
      timer.render();
    }
  }

  await updateTimerState(options.id, options.timerType, (state) => {
    const timerInstance = findTimerInstance(options.timerType, options.id);
    const paused = !!timerInstance?._paused;

    return {
      ...state,
      createdAt: Date.now(),
      paused,
      pausedAt: paused ? Date.now() : null,
      accumulatedPausedMs: 0,
      elapsedManual: 0
    };
  });
})

Hooks.on("closeHourglass", async (options) => {
  switch(options.timerType) {
    case 'flipdown':
      FlipDown.timers.find(x => x.id === options.id)?.timer?.closeTimer();
      break;
    default:
      Hourglass.timers.find(x => x.id === options.id)?.timer?.closeTimer();
  }

  await removeTimerState(options.id, options.timerType);
})

Hooks.on("pauseGame", async () => {
  Hourglass.timers.forEach(entry => {
    if(!!entry?.id && entry.id.length > 0) {
      entry?.timer?.syncTimerPause();
    }
  });

  FlipDown.timers.forEach(entry => {
    if(!!entry?.id && entry.id.length > 0) {
      entry?.timer?.syncTimerPause();
    }
  });

  if (!game.user.isGM) {
    return;
  }

  const now = Date.now();
  const paused = !!game.paused;
  const activeTimers = loadActiveTimers();
  let changed = false;

  const updatedTimers = activeTimers.map((state) => {
    if (!state?.options?.syncWithFoundryPause) {
      return state;
    }

    const nextState = applyPauseTransition(state, paused, now);
    const stateChanged =
      nextState.paused !== state.paused ||
      nextState.pausedAt !== state.pausedAt ||
      nextState.accumulatedPausedMs !== state.accumulatedPausedMs;

    if (stateChanged) {
      changed = true;
    }

    return nextState;
  });

  if (changed) {
    await saveActiveTimers(updatedTimers);
  }
});