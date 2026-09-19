(function (root) {
  'use strict';
  const initial = [
    { offsets: [-80, 80] },
    { offsets: [80, -60, 20] },
    { turns: [1, 3, 2] },
    { offsets: [-100, 80], input: [] },
    { order: [2, 0, 3, 1] },
    { folds: [false, false] },
    { corners: [false, false, false, false] }
  ];
  const copy = x => JSON.parse(JSON.stringify(x));
  const routes = [[0, 2], [2, 1], [1, 3], [3, 0]];
  function isSolved(i, p) {
    if (i === 0) return p.offsets.every(x => x === 0);
    if (i === 1) return p.offsets.every(x => x === p.offsets[0]);
    if (i === 2) return p.turns.every(x => x === 0);
    if (i === 3) return p.offsets.every(x => x === 0) && p.input.join(',') === '0,1,2';
    if (i === 4) return routes[p.order[0]][0] === 0 && routes[p.order[3]][1] === 0 && p.order.slice(0, 3).every((x, k) => routes[x][1] === routes[p.order[k + 1]][0]);
    if (i === 5) return p.folds.every(Boolean);
    return p.corners.every(Boolean);
  }
  function fresh() { return { version: 1, started: false, scene: 'room', puzzles: copy(initial), solved: Array(7).fill(false), hints: Array(7).fill(0), muted: false }; }
  function validArray(a, n, test) { return Array.isArray(a) && a.length === n && a.every(test); }
  const grid = (limit, step) => n => Number.isInteger(n) && Math.abs(n) <= limit && n % step === 0;
  function restore(raw) {
    const fallback = fresh();
    if (!raw || raw.version !== 1 || !validArray(raw.puzzles, 7, p => p && typeof p === 'object')) return fallback;
    const p = raw.puzzles;
    if (!validArray(p[0].offsets, 2, grid(120, 40)) || !validArray(p[1].offsets, 3, grid(100, 20)) || !validArray(p[2].turns, 3, n => Number.isInteger(n) && n >= 0 && n < 4) || !validArray(p[3].offsets, 2, (n, i) => grid(i ? 80 : 100, i ? 40 : 50)(n)) || !Array.isArray(p[3].input) || p[3].input.length > 3 || !p[3].input.every(n => Number.isInteger(n) && n >= 0 && n < 6) || !validArray(p[4].order, 4, n => Number.isInteger(n) && n >= 0 && n < 4) || new Set(p[4].order).size !== 4 || !validArray(p[5].folds, 2, n => typeof n === 'boolean') || !validArray(p[6].corners, 4, n => typeof n === 'boolean')) return fallback;
    fallback.puzzles = copy(p);
    fallback.solved = p.map((x, i) => isSolved(i, x) && (i === 0 || p.slice(0, i).every((a, k) => isSolved(k, a))));
    fallback.hints = validArray(raw.hints, 7, n => Number.isInteger(n) && n >= 0 && n <= 3) ? raw.hints.slice() : fallback.hints;
    fallback.started = raw.started === true;
    fallback.muted = raw.muted === true;
    fallback.scene = raw.scene === 'ending' && fallback.solved[6] ? 'ending' : Number.isInteger(raw.scene) && raw.scene >= 0 && raw.scene < 6 && (raw.scene === 0 || fallback.solved[raw.scene - 1]) ? raw.scene : 'room';
    return fallback;
  }
  const api = { initial, routes, copy, fresh, restore, isSolved };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FoldLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
