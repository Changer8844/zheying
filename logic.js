(function (root) {
  'use strict';
  const E = typeof module !== 'undefined' && module.exports ? require('./expansion-logic.js') : root.FoldExpansion;
  const initial = [
    { offsets: [-80, 80] },
    { offsets: [80, -60, 20] },
    { turns: [1, 3, 2] },
    { offsets: [-100, 80], input: [] },
    { order: [2, 0, 3, 1] },
    { folds: [false, false] },
    { corners: [false, false, false, false] },
    ...E.copy(E.initial)
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
    if (i === 6) return p.corners.every(Boolean);
    return E.isSolved(i, p);
  }
  function fresh() { return { version: 2, started: false, scene: 'room', roomView: 0, puzzles: copy(initial), solved: Array(14).fill(false), hints: Array(14).fill(0), undo: Array.from({length:14},()=>[]), muted: false, musicVolume: .4, effectsVolume: .75 }; }
  function validArray(a, n, test) { return Array.isArray(a) && a.length === n && a.every(test); }
  const grid = (limit, step) => n => Number.isInteger(n) && Math.abs(n) <= limit && n % step === 0;
  function restore(raw) {
    const fallback = fresh();
    if (!raw || ![1,2].includes(raw.version) || !validArray(raw.puzzles, raw.version === 1 ? 7 : 14, p => p && typeof p === 'object')) return fallback;
    const p = raw.puzzles;
    if (!validArray(p[0].offsets, 2, grid(120, 40)) || !validArray(p[1].offsets, 3, grid(100, 20)) || !validArray(p[2].turns, 3, n => Number.isInteger(n) && n >= 0 && n < 4) || !validArray(p[3].offsets, 2, (n, i) => grid(i ? 80 : 100, i ? 40 : 50)(n)) || !Array.isArray(p[3].input) || p[3].input.length > 3 || !p[3].input.every(n => Number.isInteger(n) && n >= 0 && n < 6) || !validArray(p[4].order, 4, n => Number.isInteger(n) && n >= 0 && n < 4) || new Set(p[4].order).size !== 4 || !validArray(p[5].folds, 2, n => typeof n === 'boolean') || !validArray(p[6].corners, 4, n => typeof n === 'boolean')) return fallback;
    if (raw.version === 2 && !p.slice(7).every((value,k)=>E.valid(k+7,value))) return fallback;
    fallback.puzzles = copy(raw.version === 1 ? [...p,...E.initial] : p);
    let unlocked = true;
    fallback.solved = fallback.puzzles.map((x,i)=>{unlocked=unlocked&&isSolved(i,x);return unlocked;});
    if (validArray(raw.hints, raw.version === 1 ? 7 : 14, n => Number.isInteger(n) && n >= 0 && n <= 3)) fallback.hints = raw.hints.concat(raw.version === 1 ? Array(7).fill(0) : []);
    if (raw.version === 2 && Array.isArray(raw.undo)) for(let i=7;i<14;i++) {
      if (!fallback.solved[i] && Array.isArray(raw.undo[i]) && raw.undo[i].length <= 80 && raw.undo[i].every(v=>E.valid(i,v))) fallback.undo[i]=copy(raw.undo[i]);
    }
    fallback.started = raw.started === true;
    fallback.muted = raw.muted === true;
    for(const key of ['musicVolume','effectsVolume']) if(typeof raw[key]==='number'&&Number.isFinite(raw[key])&&raw[key]>=0&&raw[key]<=1)fallback[key]=raw[key];
    fallback.roomView = fallback.solved[6] && (raw.version === 1 || raw.roomView === 1) ? 1 : 0;
    fallback.scene = raw.scene === 'ending' && fallback.solved[13] ? 'ending' : Number.isInteger(raw.scene) && raw.scene !== 6 && raw.scene >= 0 && raw.scene < 14 && (raw.scene === 0 || fallback.solved[raw.scene - 1]) ? raw.scene : 'room';
    return fallback;
  }
  const api = { initial, routes, copy, fresh, restore, isSolved };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FoldLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
