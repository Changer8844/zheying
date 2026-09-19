/* The paper, its projections and its answers share these geometry models. */
(function (root) {
  'use strict';
  const copy = x => JSON.parse(JSON.stringify(x));
  const mod = (x, n) => (x % n + n) % n;
  const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const initial = [
    { order: [4,2,0,5,1,3], turns: [1,2,3,1,3,2] },
    { angle: 0, turns: [1,3,2], slides: [0,2,0] },
    { order: [0,1,2,3], flips: [false,false,false,false] },
    { positions: [4,0,8,2] },
    { rings: [0,0,0] },
    { sequence: [], back: false },
    { walls: [0,2,1,0], window: 0 }
  ];
  const solutions = [
    { order: [0,1,2,3,4,5], turns: [0,0,0,0,0,0] },
    { angle: 2, turns: [0,0,0], slides: [1,1,1] },
    { order: [2,0,3,1], flips: [false,true,false,true] },
    { positions: [0,5,6,8] },
    { rings: [2,7,4] },
    { sequence: ['left','bottom','right','top'], back: false },
    { walls: [2,1,0,2], window: 2 }
  ];
  function inside(poly, x, y) {
    let yes = false;
    for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
      const a=poly[i],b=poly[j];
      if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) yes=!yes;
    }
    return yes;
  }
  function nearEdge(poly, x, y, distance) {
    return poly.some((a,i) => {
      const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
      return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=distance;
    });
  }
  function sample(size, extent, test) {
    return Uint8Array.from({length:size*size},(_,i)=>test(((i%size+.5)/size*2-1)*extent,((Math.floor(i/size)+.5)/size*2-1)*extent)?1:0);
  }
  function rotatePoint([x,y], turns) { for(let k=0;k<mod(turns,4);k++) [x,y]=[-y,x]; return [x,y]; }

  // Clockwise edge offsets: N (t,-1), E (1,t), S (-t,1), W (-1,-t).
  const branches = [
    [-.45,.2,-.35,null], [null,-.35,.45,-.2], [.3,-.45,-.2,.35],
    [.35,null,.15,.45], [-.45,null,-.35,null], [.2,.35,.45,null]
  ];
  const tileNames = ['月牙','细叶','菱形','涟漪','小圆','四芒'];
  function tilePorts(id, turn) { const a=Array(4).fill(null); branches[id].forEach((v,k)=>a[mod(k+turn,4)]=v); return a; }
  function branchFits(p) {
    const ports=p.order.map(id=>tilePorts(id,p.turns[id]));
    for(let s=0;s<6;s++) for(let e=0;e<4;e++) {
      const x=s%3,y=Math.floor(s/3),nx=x+[0,1,0,-1][e],ny=y+[-1,0,1,0][e];
      const a=ports[s][e];
      if(nx<0||nx>2||ny<0||ny>1) { if(a!==branches[s][e]) return false; }
      else { const b=ports[ny*3+nx][(e+2)%4]; if(a===null?b!==null:b===null||Math.abs(a+b)>.001) return false; }
    }
    const seen=new Set([3]), todo=[3];
    while(todo.length) { const s=todo.pop(); ports[s].forEach((v,e)=>{const x=s%3+[0,1,0,-1][e],y=Math.floor(s/3)+[-1,0,1,0][e],n=y*3+x;if(v!==null&&x>=0&&x<3&&y>=0&&y<2&&!seen.has(n)){seen.add(n);todo.push(n);}}); }
    return seen.size===6;
  }

  const petals = [
    [[42,-7],[99,-16],[116,0],[100,8],[58,8]],
    [[83,-18],[141,-44],[166,-36],[144,-10],[112,7]],
    [[107,6],[152,4],[187,0],[151,34],[121,35],[88,16]]
  ];
  function petal(id, turn, slide) {
    const cx=[79,124,138][id],cy=[0,-18,18][id];
    return petals[id].map(([x,y])=>{const q=rotatePoint([x-cx,y-cy],turn);return[q[0]+cx+(slide-1)*22,q[1]+cy];});
  }
  const flowerCache=new Map();
  function flowerPart(id, angle, turn, slide) {
    const key=[id,angle,turn,slide].join(); if(flowerCache.has(key))return flowerCache.get(key);
    const alpha=[30,45,60][angle]*Math.PI/180,poly=petal(id,turn,slide),count=Math.round(2*Math.PI/alpha);
    const mask=sample(55,210,(x,y)=>{
      const r=Math.hypot(x,y),theta=Math.atan2(y,x),sector=mod(Math.floor((theta+alpha/2)/alpha),count);
      let a=mod(theta+alpha/2,alpha)-alpha/2;if(sector%2)a=-a;
      return inside(poly,r*Math.cos(a),r*Math.sin(a));
    });flowerCache.set(key,mask);return mask;
  }
  function flowerMask(p) {
    const parts=[0,1,2].map(i=>flowerPart(i,p.angle,p.turns[i],p.slides[i]));
    return parts[0].map((v,k)=>v||parts[1][k]||parts[2][k]);
  }

  // Paper follows the ink contour with a white margin. The remaining area is cut out.
  const pagePolys = [
    [[[-91,47],[-45,7],[6,-12],[59,4],[92,-9],[73,17],[39,31],[-17,35],[-60,66],[-48,33]]],
    [[[-30,18],[4,-83],[49,-36],[27,26]],[[30,23],[66,44],[43,49],[3,27]]],
    [[[-102,59],[89,-40],[94,-32],[-98,69]],[[-33,30],[-68,-4],[-62,-9],[-21,24]],[[32,-13],[37,-62],[44,-60],[41,-16]]],
    [[[-82,-75],[-73,-79],[78,80],[69,85]],[[-18,-16],[10,-68],[17,-64],[-9,-6]],[[28,36],[86,21],[89,29],[38,44]]]
  ];
  const pageNames=['鸟身','羽翼','斜枝','长枝'];
  function pagePixel(id, flip, x, y) {
    if(flip)x=-x;
    if(pagePolys[id].some(poly=>inside(poly,x,y)))return 2;
    return pagePolys[id].some(poly=>nearEdge(poly,x,y,7))?1:0;
  }
  function pageMask(p) {
    return sample(63,110,(x,y)=>{let color=1;p.order.forEach(id=>{const c=pagePixel(id,p.flips[id],x,y);if(c)color=c;});return color===2;});
  }

  const frontProfiles = [
    [[-.25,0],[.22,0],[.22,1.35],[-.25,1.35]],
    [[-.22,0],[.25,0],[.25,1.85],[-.22,1.85]],
    [[-.25,1.25],[-.18,2.1],[.2,2.66],[.7,2.96],[1.05,3],[1.05,2.62],[.72,2.58],[.4,2.36],[.2,1.96],[.22,1.25]],
    [[-1.05,3],[-.7,2.96],[-.2,2.66],[.18,2.1],[.25,1.8],[-.22,1.8],[-.4,2.36],[-.72,2.58],[-1.05,2.62]]
  ];
  const sideProfiles = [
    [[-.4,0],[.4,0],[.4,1.35],[-.4,1.35]],
    [[-.4,0],[.4,0],[.4,1.85],[-.4,1.85]],
    [[-.4,1.25],[.4,1.25],[.4,3],[-.4,3]],
    [[-.4,1.8],[.4,1.8],[.4,3],[-.4,3]]
  ];
  function shadowMask(p, side=false) {
    const polys=(side?sideProfiles:frontProfiles).map((poly,id)=>{const offset=side?Math.floor(p.positions[id]/3)-1:p.positions[id]%3-1;return poly.map(([x,z])=>[x+offset,z]);});
    return sample(53,2,(x,y)=>polys.some(poly=>inside(poly,x,y+1.5)));
  }

  function aperture(type,x,y) {
    if(x*x+y*y>.92*.92)return false;
    if(type===0)return true;
    if(type===1)return (x-.42)**2+(y+.2)**2>.79*.79;
    if(type===2)return (x+.34)**2+y*y<.82*.82;
    if(type===3)return (x-.34)**2+y*y<.82*.82;
    if(type===4)return x+y<.12;
    if(type===5)return y>.08;
    if(type===6)return Math.abs(x)<.31||Math.abs(y)<.22;
    return x-y>.15;
  }
  const wheelPatterns=[
    [4,7,5,6,4,7,2,5,6,4,0,5],
    [5,3,4,7,5,1,6,7,4,0,5,6],
    [0,5,6,4,0,7,5,6,1,4,7,5]
  ];
  // Window positions are 0,4,8. Rotations select physical apertures on each disc.
  wheelPatterns[0][10]=0;wheelPatterns[0][2]=0;wheelPatterns[0][6]=2;
  wheelPatterns[1][5]=1;wheelPatterns[1][9]=0;wheelPatterns[1][1]=3;
  const apertureMasks=Array.from({length:8},(_,i)=>sample(23,1,(x,y)=>aperture(i,x,y)));
  function wheelTypes(p,w) {return p.rings.map((r,i)=>wheelPatterns[i][mod(w*4-r,12)]);}
  function wheelMask(p,w) {const a=wheelTypes(p,w).map(t=>apertureMasks[t]);return a[0].map((v,i)=>v&&a[1][i]&&a[2][i]);}

  function foldPaper(sequence) {
    let grid=Array.from({length:4},(_,y)=>Array.from({length:4},(_,x)=>[{id:y*4+x,fx:false,fy:false,back:false}]));
    for(const dir of sequence) {
      const horizontal=dir==='left'||dir==='right',h=grid.length,w=grid[0].length;
      if(!['left','right','top','bottom'].includes(dir)||(horizontal?w:h)<2)return null;
      const nh=horizontal?h:h/2,nw=horizontal?w/2:w;
      const next=Array.from({length:nh},()=>Array.from({length:nw},()=>[]));
      for(let y=0;y<nh;y++)for(let x=0;x<nw;x++) {
        let stay,moving;
        if(dir==='left'){stay=grid[y][x+nw];moving=grid[y][nw-1-x];}
        if(dir==='right'){stay=grid[y][x];moving=grid[y][w-1-x];}
        if(dir==='top'){stay=grid[y+nh][x];moving=grid[nh-1-y][x];}
        if(dir==='bottom'){stay=grid[y][x];moving=grid[h-1-y][x];}
        next[y][x]=[...stay,...moving.slice().reverse().map(v=>({...v,fx:horizontal?!v.fx:v.fx,fy:horizontal?v.fy:!v.fy,back:!v.back}))];
      }grid=next;
    }return grid;
  }
  const paperSize=11;
  const windowPrint=Array.from({length:121},(_,i)=>{
    const x=i%11,y=Math.floor(i/11),arch=Math.round(1+(Math.abs(x-5)/4)**2*3);
    return (x>=1&&x<=9&&y===arch)||(y>=4&&y<=9&&(x===1||x===9))||(y===9&&x>=1&&x<=9)||(x===5&&y>=1&&y<=9)||(y===5&&x>=1&&x<=9)?1:0;
  });
  const paperTiles=Array.from({length:16},(_,id)=>({
    hole:Array.from({length:121},(_,i)=>{const x=i%11,y=Math.floor(i/11);return x>0&&x<10&&y>0&&y<10&&((x-(3+id%3))**2+(y-(3+Math.floor(id/4)%3))**2<9||(id%2?x>7&&y<6:y>7&&x<6));}),
    front:Array.from({length:121},(_,i)=>{const x=i%11,y=Math.floor(i/11),[rx,ry]=rotatePoint([x-5,y-5],id%4);return windowPrint[(ry+5)*11+rx+5]&&((id%2?x:y)<6)?1:0;}),
    back:Array.from({length:121},(_,i)=>{const x=i%11,y=Math.floor(i/11),[rx,ry]=rotatePoint([x-5,y-5],(id+1)%4);return windowPrint[(ry+5)*11+rx+5]&&((id%2?y:x)>3)?1:0;})
  }));
  const finalStack=foldPaper(solutions[5].sequence)[0][0];
  finalStack.slice(-4).reverse().forEach((layer,q)=>{
    const tile=paperTiles[layer.id];
    for(let y=0;y<11;y++)for(let x=0;x<11;x++) {
      const ox=layer.fx?10-x:x,oy=layer.fy?10-y:y,idx=oy*11+ox;
      const border=x===0||y===0||x===10||y===10,quadrant=(y>=5?2:0)+(x>=5?1:0);
      tile.hole[idx]=!border&&quadrant!==q;
      tile[layer.back?'back':'front'][idx]=windowPrint[y*11+x];
    }
  });
  function paperPixels(stack, back=false) {
    const layers=back?stack:stack.slice().reverse();
    return Array.from({length:121},(_,i)=>{
      const x=i%11,y=Math.floor(i/11);
      for(const l of layers) {
        const ox=(l.fx!==back)?10-x:x,oy=l.fy?10-y:y,k=oy*11+ox,t=paperTiles[l.id];
        if(!t.hole[k])return t[(l.back!==back)?'back':'front'][k];
      }return -1;
    });
  }

  const bird=[[-83,-22],[-10,3],[52,-80],[37,5],[101,-18],[59,41],[4,45],[-29,75],[-17,29]];
  const wallRects=[[-210,-150,0,0],[0,-150,210,0],[-210,0,0,150],[0,0,210,150]];
  const wallScales=[1,.72,.34];
  function wallTransform(i,value,[x,y]) {
    const rect=wallRects[i],hingeX=i%2?210:-210,hingeY=i<2?-150:150,ratio=wallScales[value]/wallScales[solutions[6].walls[i]];
    return i%2?[x,hingeY+(y-hingeY)*ratio]:[hingeX+(x-hingeX)*ratio,y];
  }
  function wallInverse(i,value,[x,y]) {
    const hingeX=i%2?210:-210,hingeY=i<2?-150:150,ratio=wallScales[value]/wallScales[solutions[6].walls[i]];
    return i%2?[x,hingeY+(y-hingeY)/ratio]:[hingeX+(x-hingeX)/ratio,y];
  }
  const windRoutes=[[[0,2],[1,1],[0,1]],[[2,1],[1,2],[2,2]],[[2,1],[1,2],[2,0]],[[2,0],[1,1],[1,0]]];
  function windFits(p) {const r=p.walls.map((s,i)=>windRoutes[i][s]);return r[0][0]===0&&r[3][1]===0&&r.slice(0,3).every((a,i)=>a[1]===r[i+1][0]);}
  function wallMask(p) {
    return sample(61,235,(x,y)=>{
      x+=(p.window-2)*22;
      return wallRects.some(([x0,y0,x1,y1],i)=>{
        const [a,b]=wallInverse(i,p.walls[i],[x,y]);
        return a>=x0&&a<=x1&&b>=y0&&b<=y1&&!inside(bird,a/1.65,b/1.65);
      });
    });
  }
  const targets={flower:flowerMask(solutions[1]),pages:pageMask(solutions[2]),front:shadowMask(solutions[3]),side:shadowMask(solutions[3],true),wheels:[0,1,2].map(w=>wheelMask(solutions[4],w)),walls:wallMask(solutions[6])};
  function isSolved(i,p) {
    if(i===7)return branchFits(p);
    if(i===8)return equal(flowerMask(p),targets.flower);
    if(i===9)return equal(pageMask(p),targets.pages);
    if(i===10)return equal(shadowMask(p),targets.front)&&equal(shadowMask(p,true),targets.side);
    if(i===11)return [0,1,2].every(w=>equal(wheelMask(p,w),targets.wheels[w]));
    if(i===12){const g=foldPaper(p.sequence);return !!g&&g.length===1&&g[0].length===1&&equal(paperPixels(g[0][0]),windowPrint);}
    if(i===13)return windFits(p)&&equal(wallMask(p),targets.walls);
    return false;
  }
  const arr=(a,n,test)=>Array.isArray(a)&&a.length===n&&a.every(test);
  const ints=n=>v=>Number.isInteger(v)&&v>=0&&v<n;
  const perm=(a,n)=>arr(a,n,ints(n))&&new Set(a).size===n;
  function valid(i,p) {
    if(!p||typeof p!=='object')return false;
    if(i===7)return perm(p.order,6)&&arr(p.turns,6,ints(4));
    if(i===8)return ints(3)(p.angle)&&arr(p.turns,3,ints(4))&&arr(p.slides,3,ints(3));
    if(i===9)return perm(p.order,4)&&arr(p.flips,4,x=>typeof x==='boolean');
    if(i===10)return arr(p.positions,4,ints(9))&&new Set(p.positions).size===4;
    if(i===11)return arr(p.rings,3,ints(12));
    if(i===12)return Array.isArray(p.sequence)&&p.sequence.length<=4&&!!foldPaper(p.sequence)&&typeof p.back==='boolean';
    if(i===13)return arr(p.walls,4,ints(3))&&ints(4)(p.window);
    return false;
  }
  function apply(i,p,op,a=0,b=0) {
    const q=copy(p);
    if(op==='swap'&&(i===7||i===9)){if(!ints(q.order.length)(a)||!ints(q.order.length)(b))return p;[q.order[a],q.order[b]]=[q.order[b],q.order[a]];}
    else if(op==='turn'&&(i===7||i===8)){if(!ints(q.turns.length)(a))return p;q.turns[a]=mod(q.turns[a]+(b||1),4);}
    else if(op==='slide'&&i===8){if(!ints(3)(a))return p;q.slides[a]=mod(q.slides[a]+(b||1),3);}
    else if(op==='angle'&&i===8)q.angle=mod(q.angle+(b||1),3);
    else if(op==='flip'&&i===9){if(!ints(4)(a))return p;q.flips[a]=!q.flips[a];}
    else if(op==='place'&&i===10){if(!ints(4)(a)||!ints(9)(b)||q.positions.some((s,id)=>id!==a&&s===b))return p;q.positions[a]=b;}
    else if(op==='ring'&&i===11){if(!ints(3)(a))return p;q.rings[a]=mod(q.rings[a]+(b||1),12);}
    else if(op==='fold'&&i===12){if(q.back)return p;q.sequence.push(a);if(!foldPaper(q.sequence))return p;}
    else if(op==='back'&&i===12)q.back=!q.back;
    else if(op==='wall'&&i===13){if(!ints(4)(a))return p;q.walls[a]=mod(q.walls[a]+(b||1),3);}
    else if(op==='window'&&i===13)q.window=Math.max(0,Math.min(3,q.window+(b||1)));
    else return p;
    return valid(i,q)?q:p;
  }
  const api={copy,mod,equal,initial,solutions,inside,rotatePoint,branches,tileNames,tilePorts,branchFits,petals,petal,flowerMask,pagePolys,pageNames,pageMask,frontProfiles,sideProfiles,shadowMask,aperture,wheelPatterns,wheelTypes,wheelMask,foldPaper,paperSize,paperTiles,paperPixels,windowPrint,bird,wallRects,wallScales,wallTransform,wallInverse,wallMask,windRoutes,windFits,targets,isSolved,valid,apply};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FoldExpansion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
