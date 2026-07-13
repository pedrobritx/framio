'use client';

/**
 * A single polite live region for the whole app. Any module can call
 * `announce()` to speak a status to screen readers (favorite added, export
 * progress, playback paused); the <Announcer> mounted in the layout renders
 * the message. Messages fired before the region mounts are held and drained
 * on subscribe, so nothing is lost during hydration.
 */

let current = '';
let pending: string | null = null;
const listeners = new Set<() => void>();

/** Announce a short status message to assistive technology. */
export function announce(message: string) {
  // Re-emit even when the text repeats: toggle a zero-width marker so the
  // live region always registers a change.
  current = current === message ? `${message}​` : message;
  if (listeners.size === 0) {
    pending = current;
    return;
  }
  for (const l of listeners) l();
}

export function subscribeAnnouncer(cb: () => void): () => void {
  listeners.add(cb);
  if (pending !== null) {
    current = pending;
    pending = null;
    cb();
  }
  return () => {
    listeners.delete(cb);
  };
}

export function getAnnouncement(): string {
  return current;
}
