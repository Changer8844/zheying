const assert = require('node:assert/strict');
const L = require('../logic.js');
const E = require('../expansion-logic.js');
const win = [{offsets:[0,0]},{offsets:[0,0,0]},{turns:[0,0,0]},{offsets:[0,0],input:[0,1,2]},{order:[0,1,2,3]},{folds:[true,true]},{corners:[true,true,true,true]},...E.copy(E.solutions)];
L.initial.forEach((p,i)=>assert.equal(L.isSolved(i,p),false,`initial puzzle ${i+1}`));
win.forEach((p,i)=>assert.equal(L.isSolved(i,p),true,`solution ${i+1}`));
assert.equal(L.isSolved(1,{offsets:[40,40,40]}),true,'equivalent aligned bird is accepted');
assert.equal(L.isSolved(1,{offsets:[0,0,20]}),false,'broken bird is rejected');
assert.equal(L.isSolved(0,{offsets:[40,40]}),false,'circle must meet visible window marks');
assert.equal(L.isSolved(3,{offsets:[0,40],input:[0,1,2]}),false,'correct symbols alone cannot bypass paper alignment');
assert.equal(L.isSolved(3,{offsets:[0,0],input:[1,0,2]}),false,'incorrect symbol sequence rejected');
const perms = xs => xs.length ? xs.flatMap((x,i)=>perms(xs.filter((_,k)=>k!==i)).map(p=>[x,...p])) : [[]];
assert.equal(perms([0,1,2,3]).filter(order=>L.isSolved(4,{order})).length,1,'exactly one connected shadow route');
let mirror=0;for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)mirror+=L.isSolved(2,{turns:[a,b,c]});
assert.equal(mirror,1,'exactly one connected set of wings');
for(const invalid of [null,{},42,{version:9}, {...L.fresh(),puzzles:[]}])assert.deepEqual(L.restore(invalid),L.fresh());
const complete = L.fresh();complete.started=true;complete.puzzles=win;complete.solved.fill(true);complete.scene='ending';
assert.deepEqual(L.restore(complete),complete,'completed game survives restore');
const corrupt=L.fresh();corrupt.puzzles[4].order=[0,0,1,2];assert.deepEqual(L.restore(corrupt),L.fresh());
const bypass=L.fresh();bypass.solved.fill(true);bypass.scene=5;assert.equal(L.restore(bypass).scene,'room');assert.equal(L.restore(bypass).solved.some(Boolean),false);
console.log('PASS: initial/winning/wrong states, all 24 shadow permutations, all 64 mirror rotations, equivalent solutions and save validation.');

const legacy={version:1,started:true,scene:'ending',puzzles:win.slice(0,7),solved:Array(7).fill(true),hints:[1,2,3,0,1,2,3],muted:true};
const migrated=L.restore(legacy);
assert.equal(migrated.version,2);assert.equal(migrated.scene,'room');assert.equal(migrated.roomView,1);
assert.equal(migrated.solved.filter(Boolean).length,7);assert.equal(migrated.muted,true);
assert.deepEqual(migrated.hints.slice(0,7),legacy.hints);assert.deepEqual(migrated.puzzles.slice(7),E.initial);
const partial=E.copy(legacy);partial.scene=3;partial.puzzles=win.slice(0,3).concat(L.initial.slice(3,7));
assert.equal(L.restore(partial).scene,3);assert.equal(L.restore(partial).roomView,0);
const mid=E.copy(migrated);mid.puzzles[12]={sequence:['left','bottom'],back:true};mid.musicVolume=0;mid.effectsVolume=.91;
assert.deepEqual(L.restore(mid).puzzles[12],mid.puzzles[12]);assert.equal(L.restore(mid).effectsVolume,.91);assert.equal(L.restore(mid).musicVolume,0);
mid.musicVolume=NaN;mid.effectsVolume=5;assert.equal(L.restore(mid).effectsVolume,.75);
for(let i=7;i<14;i++) {const bad=E.copy(migrated);bad.puzzles[i]={};assert.deepEqual(L.restore(bad),L.fresh());}
const corruptFold=E.copy(migrated);corruptFold.puzzles[12].sequence=['left','left','left'];assert.deepEqual(L.restore(corruptFold),L.fresh());
assert.deepEqual(E.apply(12,{sequence:[],back:true},'fold','left'),{sequence:[],back:true},'back view is inspection only');
assert.equal(E.apply(13,E.initial[6],'window',0,-1).window,0,'window stops at its left edge');
assert.equal(E.foldPaper(['left'])[0][0].length,2);
assert.deepEqual(E.foldPaper(['left'])[0][0].map(t=>[t.id,t.fx,t.back]),[[2,false,false],[1,true,true]]);
assert.equal(E.foldPaper(['left','top','right','bottom'])[0][0].length,16);
assert.equal(E.apply(10,E.initial[3],'place',0,0),E.initial[3],'occupied shadow cell is rejected');

const counts={branches:0,flowers:0,pages:0,shadows:0,frontOnly:0,wheels:0,folds:0,walls:0,windOnly:0};
// Exhaustive tile search, pruning only mismatched visible edges.
function visitTiles(order,turns,used) {
  const s=order.length;if(s===6){if(E.branchFits({order,turns}))counts.branches++;return;}
  for(let id=0;id<6;id++)if(!(used&(1<<id)))for(let turn=0;turn<4;turn++) {
    const ports=E.tilePorts(id,turn),x=s%3,y=Math.floor(s/3);let okay=true;
    for(let e=0;e<4;e++) {
      const nx=x+[0,1,0,-1][e],ny=y+[-1,0,1,0][e];
      if(nx<0||nx>2||ny<0||ny>1){if(ports[e]!==E.branches[s][e])okay=false;}
      else if(ny*3+nx<s){const other=ny*3+nx,v=E.tilePorts(order[other],turns[order[other]])[(e+2)%4],a=ports[e];if(a===null?v!==null:v===null||Math.abs(a+v)>.001)okay=false;}
    }
    if(okay){const next=turns.slice();next[id]=turn;visitTiles([...order,id],next,used|(1<<id));}
  }
}
visitTiles([],Array(6).fill(0),0);
for(let angle=0;angle<3;angle++)for(let code=0;code<1728;code++) {
  let n=code;const p={angle,turns:[],slides:[]};for(let i=0;i<3;i++){const pose=n%12;n=Math.floor(n/12);p.turns.push(pose%4);p.slides.push(Math.floor(pose/4));}
  if(E.isSolved(8,p))counts.flowers++;
}
for(const order of perms([0,1,2,3]))for(let mask=0;mask<16;mask++)if(E.isSolved(9,{order,flips:[0,1,2,3].map(k=>!!(mask&(1<<k)))}))counts.pages++;
for(let a=0;a<9;a++)for(let b=0;b<9;b++)for(let c=0;c<9;c++)for(let d=0;d<9;d++) {
  if(new Set([a,b,c,d]).size<4)continue;const p={positions:[a,b,c,d]},front=E.equal(E.shadowMask(p),E.targets.front),side=E.equal(E.shadowMask(p,true),E.targets.side);
  if(front&&side)counts.shadows++;if(front&&!side)counts.frontOnly++;
}
for(let a=0;a<12;a++)for(let b=0;b<12;b++)for(let c=0;c<12;c++)if(E.isSolved(11,{rings:[a,b,c]}))counts.wheels++;
let foldPaths=0;function folds(seq) {if(seq.length===4){foldPaths++;if(E.isSolved(12,{sequence:seq,back:false}))counts.folds++;return;}for(const dir of ['left','right','top','bottom'])if(E.foldPaper([...seq,dir]))folds([...seq,dir]);}folds([]);
for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)for(let d=0;d<3;d++)for(let w=0;w<4;w++) {const p={walls:[a,b,c,d],window:w};if(E.isSolved(13,p))counts.walls++;else if(E.windFits(p))counts.windOnly++;}
for(const name of ['branches','flowers','pages','shadows','wheels','folds','walls'])assert.ok(counts[name]>=1,name+' is solvable');
assert.ok(counts.frontOnly>0,'a single correct projection cannot win');assert.ok(counts.windOnly>0,'wind alone cannot win');
assert.equal(foldPaths,96,'all physically valid four-fold histories considered');
assert.equal(counts.branches,1);assert.equal(counts.flowers,1);assert.equal(counts.pages,1);assert.equal(counts.shadows,1);assert.equal(counts.wheels,1);assert.equal(counts.walls,1);
console.log('PASS: v1 migration, v2 validation, volume preferences, physical fold stacks and exhaustive medium puzzle checks.',JSON.stringify({counts,foldPaths}));
