import { useSyncExternalStore } from "react";

const DESKTOP_MQ = "(min-width: 901px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function getServerSnapshot() {
  return false;
}

/** True at the same breakpoint as `.mega-menu--desktop` / `.sections-btn` CSS. */
export function useMinWidth901() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
