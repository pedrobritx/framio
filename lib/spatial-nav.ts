/**
 * D-pad / arrow-key spatial navigation — for TV remotes, and a bonus for
 * desktop keyboards.
 *
 * A single document-level keydown handler moves focus to the nearest focusable
 * in the pressed direction, using classic LRUD geometry. It stays out of the
 * way of text inputs, sliders, and anything marked `[data-no-spatial]` (the
 * crop stage), and scopes itself to an open dialog when focus is inside one.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

interface Candidate {
  el: HTMLElement;
  rect: DOMRect;
}

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex="0"],input,select,textarea';

/**
 * Pick the best focus target in `dir` from `from` among `candidates`.
 * Pure and geometry-only, so it can be unit-tested without a DOM.
 */
export function pickNext(
  from: DOMRect,
  candidates: Candidate[],
  dir: Direction,
): HTMLElement | null {
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;

  let best: { el: HTMLElement; score: number } | null = null;
  for (const c of candidates) {
    const cx = c.rect.left + c.rect.width / 2;
    const cy = c.rect.top + c.rect.height / 2;
    const dx = cx - fromCx;
    const dy = cy - fromCy;

    // Must lie in the pressed direction (with a small tolerance so nearly
    // aligned neighbours still count).
    const primary =
      dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
    if (primary <= 1) continue;
    const orthogonal =
      dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);

    // Favor small forward distance, penalise sideways drift heavily.
    const score = primary + orthogonal * 2;
    if (!best || score < best.score) best = { el: c.el, score };
  }
  return best?.el ?? null;
}

function isVisible(el: HTMLElement): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  // Skip anything scrolled far out of the viewport on the cross axis.
  return rect.bottom > -1 && rect.top < window.innerHeight + 1;
}

function collectCandidates(exclude: HTMLElement): Candidate[] {
  // Scope to an open dialog if focus is trapped in one.
  const scope =
    exclude.closest('[role="dialog"]') ?? (document.getElementById('main') || document);
  const nodes = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE));
  const out: Candidate[] = [];
  for (const el of nodes) {
    if (el === exclude) continue;
    if (el.closest('[data-no-spatial]')) continue;
    if (!isVisible(el)) continue;
    out.push({ el, rect: el.getBoundingClientRect() });
  }
  return out;
}

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (el.closest('[data-no-spatial]')) return true;
  return false;
}

/** Install the handler. Returns a cleanup function. */
export function initSpatialNav(): () => void {
  function onKeyDown(e: KeyboardEvent) {
    const dir = KEY_TO_DIR[e.key];
    if (!dir || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;

    const active = document.activeElement as HTMLElement | null;
    if (isTypingTarget(active)) return;

    // Nothing focused yet: first arrow enters the content.
    if (!active || active === document.body) {
      const first = collectCandidates(document.body)[0];
      if (first) {
        e.preventDefault();
        focusWith(first.el);
      }
      return;
    }

    const next = pickNext(active.getBoundingClientRect(), collectCandidates(active), dir);
    if (next) {
      e.preventDefault();
      focusWith(next);
    }
  }

  function focusWith(el: HTMLElement) {
    el.setAttribute('data-spatial-focus', '');
    el.addEventListener(
      'blur',
      () => el.removeAttribute('data-spatial-focus'),
      { once: true },
    );
    el.focus();
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}
