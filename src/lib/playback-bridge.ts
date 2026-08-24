type Listener = () => void;

let isPlaying = false;
let toggleHandler: (() => void) | null = null;
const listeners = new Set<Listener>();

export function registerPlaybackBridge(handlers: {
  toggle: () => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  toggleHandler = handlers.toggle;
  return () => {
    if (toggleHandler === handlers.toggle) {
      toggleHandler = null;
    }
  };
}

export function setPlaybackPlaying(playing: boolean) {
  if (isPlaying === playing) return;
  isPlaying = playing;
  listeners.forEach((listener) => listener());
}

export function getPlaybackPlaying() {
  return isPlaying;
}

export function subscribePlaybackPlaying(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function togglePlayback() {
  toggleHandler?.();
}
