import { describe, expect, it } from 'vitest';
import { pickNext, type Direction } from './spatial-nav';

/** A fake focusable at a grid position; el identity is what we assert on. */
function cell(id: string, x: number, y: number, w = 100, h = 60) {
  const rect = {
    left: x,
    top: y,
    right: x + w,
    bottom: y + h,
    width: w,
    height: h,
    x,
    y,
  } as DOMRect;
  return { el: { id } as unknown as HTMLElement, rect };
}

const from = cell('center', 200, 200).rect;

function idOf(dir: Direction, candidates: ReturnType<typeof cell>[]) {
  return pickNext(from, candidates, dir)?.id ?? null;
}

describe('pickNext', () => {
  const right = cell('right', 400, 200);
  const left = cell('left', 0, 200);
  const up = cell('up', 200, 0);
  const down = cell('down', 200, 400);

  it('moves to the neighbour in the pressed direction', () => {
    const all = [right, left, up, down];
    expect(idOf('right', all)).toBe('right');
    expect(idOf('left', all)).toBe('left');
    expect(idOf('up', all)).toBe('up');
    expect(idOf('down', all)).toBe('down');
  });

  it('prefers the closest aligned candidate over a farther or skewed one', () => {
    const near = cell('near', 340, 205);
    const far = cell('far', 700, 200);
    const skewed = cell('skewed', 360, 380);
    expect(idOf('right', [far, near, skewed])).toBe('near');
  });

  it('ignores candidates behind the focused element', () => {
    // Only a left-side candidate exists; pressing right finds nothing.
    expect(idOf('right', [left])).toBeNull();
  });

  it('returns null when there are no candidates', () => {
    expect(idOf('down', [])).toBeNull();
  });
});
