(function (root) {
  'use strict';
  const E=root.FoldExpansion;
  const titles=['留白生枝','镜间之花','纸页之下','一物两影','月轮的孔','折叠的次序','四壁成窗'];
  const captions=['枝条并不在墨里。它在墨与墨之间。','镜子没有画花，只是留下了另一种可能。','同一笔墨，也会有前与后。','一个物体，在两面墙上留下不同的自己。','孔洞相遇以后，才有了月亮。','纸记得方向，也记得先后。','再退远一点，看看这一整间房。'];
  const hints=[
    ['六块镶板可以交换位置，也可以转动。先找框底的根，再观察框外的小芽。','每块板里的白色枝条都要接到相邻板上，边缘还要接住框外的枝芽。只接通一条枝，不代表整棵树已连通。','重置后，按小印记排成：上排「月牙、细叶、菱形」，下排「涟漪、小圆、四芒」。再分别将这六块顺时针转动 3、2、1、3、1、2 次。'],
    ['看右上角的压花：数花瓣，再看花心留下的空白。两条镜边之间才是真正的墨片。','镜面夹角决定倒影数量；三片墨形的位置和朝向决定花瓣、花心与外轮廓。需要一起看整朵花。','重置后，将镜面夹角切换两次到 60°。从上到下三片墨形，分别转动 3、1、2 次，再分别向外移动 1、2、1 次。'],
    ['四张纸都有镂空和墨迹。下方从左到右，表示从最底层到最上层。','仔细看压印和放大的交叉处：有的枝条被鸟身遮住，有的枝条盖住鸟身，却又被翅膀遮住。翻面还会改变墨迹的方向。','从底层到顶层排成「斜枝、鸟身、长枝、羽翼」。只翻转「长枝」和「羽翼」，「鸟身」与「斜枝」保留初始正面。'],
    ['构件可放在底座的九个点上。左右位置改变正面影子，前后位置改变侧面影子。','浅灰色是两幅需要填满的轮廓。先观察拱窗缺哪一部分，再检查同一构件在侧面的高度和位置。','重置后：先把 Ⅱ 移到中排右点；Ⅰ 移到后排左点；Ⅲ 移到前排左点；Ⅳ 移到前排右点。图中的三排从上方后排数到下方前排。'],
    ['三个小窗旁有目标小画。选中纸轮后，下面会摊开它沿圆周排列的十二个孔。','三个纸轮的孔重合时，只有共同透光的部分会留下来。不要只盯住一个窗；转动一层，会同时改变三个窗。','重置后，使用右箭头：纸轮一转 2 格，纸轮二转 7 格，纸轮三转 4 格。三个窗应分别留下月牙、满月和叶片。'],
    ['可以查看纸背。灰色镂空会透出更下面的纸，黑色是印在当前纸面的墨。','每次折叠都会翻面，移动的纸层会反过来盖在最上方。相同的四次折叠，顺序不同，露出的墨迹也可能不同。','重置后，按顺序：左边向右折 → 下边向上折 → 右边向左折 → 上边向下折。四折后，孔洞里会露出完整窗图。'],
    ['四面纸墙都能改变折起的程度。右上方的小图，是房间的俯视图；窗框还能左右移动。','俯视图中的风纹要从入口连到出口，同时正面墙缝要留出一只完整的鸟。风纹接通之后，也可能还不是正确的房间形状。','将四面纸墙依次设为「立起、半立、平放、立起」，再把窗框移到从左数第三个刻痕。白鸟与窗框相合，风纹也会连通。']
  ];
  const poly=p=>p.map(v=>v.join(',')).join(' ');
  const path=p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z';
  const text=(x,y,s,cls='svg-small')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${s}</text>`;
  function button(op,a,b,x,y,label,body,disabled=false) {
    return `<g data-exp="${op}" data-a="${a}" data-b="${b}" role="button" tabindex="${disabled?-1:0}" aria-label="${label}" ${disabled?'aria-disabled="true"':''} class="exp-button ${disabled?'disabled':'interactive'}" transform="translate(${x} ${y})">${body||`<rect x="-39" y="-18" width="78" height="36" rx="2" fill="#ecece6" stroke="#a8aa9e"/>${text(0,4,label)}`}</g>`;
  }
  function badge(id,x,y) {
    const shapes=['M5-7A8 8 0 1 0 5 7A7 7 0 0 1 5-7','M-6 7Q-10-5 6-8Q10 5-6 7','M0-9L7 0 0 9-7 0Z','M-9-3q5-5 9 0t9 0M-9 4q5-5 9 0t9 0','M8 0A8 8 0 1 0-8 0A8 8 0 1 0 8 0','M0-9L3-3 9 0 3 3 0 9-3 3-9 0-3-3Z'];
    return `<g transform="translate(${x} ${y})"><path d="${shapes[id]}" fill="none" stroke="currentColor" stroke-width="1.2"/></g>`;
  }
  function branch(p,selected) {
    const x0=295,y0=195,size=140;
    let out=`<path d="M275 175L735 172 737 495 274 497Z" fill="#33352f" stroke="#818679"/><path d="M284 184L726 182 728 486 283 488Z" fill="none" stroke="#a3a69c" stroke-width=".7"/>`;
    p.order.forEach((id,slot)=>{
      const x=x0+slot%3*size,y=y0+Math.floor(slot/3)*size,cx=x+70,cy=y+70;
      let strokes='';E.branches[id].forEach((v,e)=>{if(v===null)return;const a=[[v,-1],[1,v],[-v,1],[-1,-v]][e];strokes+=`<path d="M${a[0]*70} ${a[1]*70}Q${a[0]*24-8} ${a[1]*27+6}-5 3"/>`;});
      out+=`<g data-exp="pick" data-a="${slot}" data-edrag="tile" data-slot="${slot}" role="button" tabindex="0" aria-label="${E.tileNames[id]}镶板，选择或拖动交换" class="drag-piece" transform="translate(${cx} ${cy})"><rect x="-70" y="-70" width="140" height="140" fill="#292c27" stroke="${selected===slot?'#f3f1e8':'#5f6258'}" stroke-width="${selected===slot?2:.6}"/><g transform="rotate(${p.turns[id]*90})"><path d="M-55-54l31 2m-24 6h13M39 45l15 4" stroke="#65695d" stroke-width=".6"/><g fill="none" stroke="#eeeee5" stroke-width="9" stroke-linecap="round">${strokes}</g><circle cx="-5" cy="3" r="5" fill="#eeeee5"/><g style="color:#919588">${badge(id,-49,-47)}</g></g></g>`;
    });
    E.branches.forEach((edges,s)=>edges.forEach((v,e)=>{
      if(v===null)return;const xx=s%3,yy=Math.floor(s/3),nx=xx+[0,1,0,-1][e],ny=yy+[-1,0,1,0][e];if(nx>=0&&nx<3&&ny>=0&&ny<2)return;
      const a=[[v,-1],[1,v],[-v,1],[-1,-v]][e],x=x0+xx*size+70+a[0]*70,y=y0+yy*size+70+a[1]*70,dx=[0,1,0,-1][e],dy=[-1,0,1,0][e];
      out+=`<path d="M${x} ${y}l${dx*18} ${dy*18}" stroke="#eeeee5" stroke-width="7"/><g transform="translate(${x+dx*30} ${y+dy*30}) rotate(${e*90})"><path d="${s===3&&e===2?'M0 0v-14m0 10l-9-8m9 8 9-8':'M0 8Q-13-4 0-12Q13-4 0 8Z'}" fill="${s===3&&e===2?'none':'#e9e9df'}" stroke="#686d5e" stroke-width="1"/></g>`;
    }));
    out+=text(506,553,'选择两块交换 · 拖动也可以');
    if(selected>=0){out+=button('turn',p.order[selected],1,505,598,'转动这块');}
    out+=`<g transform="translate(914 325)"><path d="M0 103V37Q-15 6-49-18M0 41Q19 9 52-8M-25 6L-23-27M28 14L28-28" class="pencil" stroke-dasharray="3 7"/><path d="M0 108l-16 15m16-15 14 15M-49-18q-15-22-27-8 12 19 27 8M52-8q20-14 24 0-17 17-24 0" class="pencil"/></g>${text(915,492,'从根，到每一片叶')}${text(915,516,'枝条要越过所有接缝')}`;
    return out;
  }
  function flower(p,cx,cy,scale,prefix,reference=false) {
    const alpha=[30,45,60][p.angle],rad=alpha*Math.PI/360,r=218;
    let out=`<defs><clipPath id="${prefix}-sector"><path d="M0 0L${r*Math.cos(rad)} ${-r*Math.sin(rad)}A${r} ${r} 0 0 1 ${r*Math.cos(rad)} ${r*Math.sin(rad)}Z"/></clipPath></defs><g transform="translate(${cx} ${cy}) scale(${scale})">`;
    for(let j=0;j<360/alpha;j++)out+=`<g transform="rotate(${j*alpha}) scale(1 ${j%2?-1:1})" opacity="${reference?1:j===0?1:.64}"><g clip-path="url(#${prefix}-sector)">${[0,1,2].map(id=>`<polygon points="${poly(E.petal(id,p.turns[id],p.slides[id]))}" fill="#30352c"/>`).join('')}</g></g>`;
    if(!reference)out+=`<path d="M${r*Math.cos(rad)} ${-r*Math.sin(rad)}L0 0 ${r*Math.cos(rad)} ${r*Math.sin(rad)}" fill="none" stroke="#8d9484" stroke-width="2"/><path d="M${r*Math.cos(rad)+5} ${-r*Math.sin(rad)-5}L-8 0 ${r*Math.cos(rad)+5} ${r*Math.sin(rad)+5}" class="fine"/>`;
    return out+'</g>';
  }
  function mirror(p) {
    let out=`<circle cx="465" cy="355" r="230" fill="#dde0d5" stroke="#979d8e"/><circle cx="465" cy="355" r="220" fill="#e9ece1" stroke="#b4bbac"/>${flower(p,465,355,1,'live-flower')}`;
    out+=`<path d="M829 133l209-7 12 212-218 6Z" fill="#f0f0e8" stroke="#b4b6ab"/>${flower(E.solutions[1],938,230,.43,'pressed-flower',true)}${text(938,325,'一朵压在纸里的花')}`;
    ['花心','上瓣','下瓣'].forEach((name,id)=>{
      const y=391+id*83;out+=text(808,y+4,name)+button('turn',id,1,885,y,'转动')+button('slide',id,1,997,y,'向外移');
      out+=`<g transform="translate(1044 ${y+28})">${[0,1,2].map(k=>`<circle cx="${k*9}" r="2" fill="${p.slides[id]===k?'#414638':'#b9bdaf'}"/>`).join('')}</g>`;
    });
    return out+button('angle',0,1,465,621,`镜面 ${[30,45,60][p.angle]}°`,`<path d="M-76-21H76V21H-76Z" fill="#e5e8dc" stroke="#929b85"/>${text(0,4,`镜面夹角 · ${[30,45,60][p.angle]}°`)}`)+text(944,643,'向外移到尽头，会回到内侧');
  }
  function pageImage(p,cx,cy,scale,prefix) {
    return `<g transform="translate(${cx} ${cy}) scale(${scale})">${p.order.map(id=>`<g transform="scale(${p.flips[id]?-1:1} 1)">${E.pagePolys[id].map(points=>`<path d="${path(points)}" fill="#f0f0e8" stroke="#f0f0e8" stroke-width="14" stroke-linejoin="round"/>`).join('')}${E.pagePolys[id].map(points=>`<path d="${path(points)}" fill="#32382d"/>`).join('')}</g>`).join('')}</g>`;
  }
  function pages(p,selected) {
    let out=`<path d="M278 145L699 139 708 536 286 546Z" fill="#dadfd2" stroke="#9ea792"/><rect x="307" y="159" width="370" height="365" fill="#f0f0e8" stroke="#bac0b0"/>${pageImage(p,492,343,1.64,'pages')}`;
    out+=`<path d="M789 139L1068 149 1060 405 798 402Z" fill="#f0f0e8" stroke="#b4b9ac"/>${pageImage(E.solutions[2],931,263,.99,'page-target')}${text(932,385,'纸上的旧压印')}`;
    [[-17,8],[30,22]].forEach(([x,y],i)=>{
      out+=`<defs><clipPath id="page-detail-${i}"><circle cx="${867+i*135}" cy="473" r="47"/></clipPath></defs><circle cx="${867+i*135}" cy="473" r="47" fill="#f0f0e8" stroke="#929a88"/><g clip-path="url(#page-detail-${i})">${pageImage(E.solutions[2],867+i*135-x*2.6,473-y*2.6,2.6,'detail')}</g>`;
    });
    out+=text(935,546,'看清交叉处，谁遮住了谁');
    p.order.forEach((id,s)=>{
      const x=335+s*110;
      out+=`<g data-exp="pick" data-a="${s}" data-edrag="page" data-slot="${s}" role="button" tabindex="0" aria-label="${E.pageNames[id]}，${p.flips[id]?'背面':'正面'}，选择或拖动交换" class="drag-piece"><rect x="${x-46}" y="575" width="92" height="61" fill="#e7eadf" stroke="${selected===s?'#3e4934':'#a8b39b'}" stroke-width="${selected===s?2:1}"/>${text(x,599,E.pageNames[id])}${text(x,622,p.flips[id]?'背面':'正面')}</g>`;
    });
    out+=text(317,664,'底层')+text(680,664,'顶层');
    if(selected>=0)out+=button('flip',p.order[selected],1,924,610,'翻转这张纸');
    return out;
  }
  const boardPoint=cell=>[433+(cell%3-Math.floor(cell/3))*70,426+(cell%3+Math.floor(cell/3)-2)*40];
  function projection(p,side,cx,base,scale,color) {
    return (side?E.sideProfiles:E.frontProfiles).map((points,id)=>{
      const offset=side?Math.floor(p.positions[id]/3)-1:p.positions[id]%3-1;
      return `<polygon points="${poly(points.map(([x,z])=>[cx+(x+offset)*scale,base-z*scale]))}" fill="${color}"/>`;
    }).join('');
  }
  function shadow(p,selected) {
    let out=`<path d="M211 421L432 289 659 419 435 555Z" fill="#d5dccb" stroke="#8c9e7b"/><path d="M211 421v17l224 136 224-137v-18L435 555Z" fill="#b5c4a5" stroke="#899a76"/>`;
    for(let cell=0;cell<9;cell++){
      const [x,y]=boardPoint(cell),id=p.positions.indexOf(cell);
      out+=`<g pointer-events="none"><path d="M${x-31} ${y}l31-18 31 18-31 18Z" fill="${selected===id&&id>=0?'#edf0e7':'transparent'}" stroke="#929f84" stroke-dasharray="${id>=0?'0':'3 4'}"/><circle cx="${x}" cy="${y}" r="5" fill="#c4ceb9"/>`;
      if(id>=0){out+=`<polygon points="${poly(E.frontProfiles[id].map(([px,z])=>[x+px*37,y-z*43]))}" fill="#404d35" stroke="#26351d"/><path d="M${x} ${y}v-145" class="fine" stroke-dasharray="2 5"/>${text(x,y-152,['Ⅰ','Ⅱ','Ⅲ','Ⅳ'][id])}<ellipse cx="${x}" cy="${y-18}" rx="31" ry="48" fill="transparent"/>`;}
      out+='</g>';
    }
    // Floor handles are drawn last so a taller paper piece cannot steal another handle's input.
    for(let cell=0;cell<9;cell++) {
      const [x,y]=boardPoint(cell),id=p.positions.indexOf(cell);
      out+=`<g data-exp="${id>=0?'pick':'place'}" data-a="${id>=0?id:cell}" data-b="0" data-cell="${cell}" ${id>=0?`data-edrag="shadow" data-slot="${id}"`:''} role="button" tabindex="0" aria-label="${id>=0?['构件一','构件二','构件三','构件四'][id]:'空位'}，${Math.floor(cell/3)+1}排${cell%3+1}列" class="${id>=0?'drag-piece':'interactive'}"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle cx="${x}" cy="${y}" r="${id>=0?12:5}" fill="${id>=0?'#e8efdf':'#acbea0'}" stroke="${selected===id&&id>=0?'#3f592e':'#91a67e'}"/>${id>=0?text(x,y+4,['Ⅰ','Ⅱ','Ⅲ','Ⅳ'][id]):''}</g>`;
    }
    [false,true].forEach((side,k)=>{
      const cy=200+k*236,base=cy+154;
      out+=`<rect x="764" y="${cy-13}" width="319" height="198" fill="#ecefe4" stroke="#9eac91"/>${projection(E.solutions[3],side,923,base,49,'#c9d0bf')}${projection(p,side,923,base,49,'#37452c')}${text(924,cy-32,side?'侧面 · 悬梯':'正面 · 拱窗')}`;
    });
    return out+text(433,604,'选择构件，再选择空位 · 也可拖动')+text(433,630,'上方是后排，下方是前排');
  }
  function apertureShape(type,color='#fff') {
    let body='<circle r=".92" fill="'+color+'"/>';
    if(type===1)body+='<circle cx=".42" cy="-.2" r=".79" fill="#000"/>';
    if(type===2||type===3)body=`<circle cx="${type===2?-.34:.34}" r=".82" fill="${color}"/>`;
    if(type===4)body=`<path d="M-2-2H2L-2 2Z" transform="translate(.12 0)" fill="${color}"/>`;
    if(type===5)body=`<rect x="-1" y=".08" width="2" height="1" fill="${color}"/>`;
    if(type===6)body=`<path d="M-.31-1h.62v.78H1v.44H.31V1h-.62V.22H-1v-.44h.69Z" fill="${color}"/>`;
    if(type===7)body=`<path d="M-2-2H2V2Z" transform="translate(.15 0)" fill="${color}"/>`;
    return body;
  }
  function hole(types,x,y,r,id,rotation=0) {
    let defs='',body='<circle r=".92" fill="#eeeee4"/>';
    types.forEach((t,k)=>{const key=id+'-'+k;defs+=`<mask id="${key}" maskUnits="userSpaceOnUse" x="-1" y="-1" width="2" height="2"><rect x="-1" y="-1" width="2" height="2" fill="#000"/>${apertureShape(t)}</mask>`;body=`<g mask="url(#${key})">${body}</g>`;});
    return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${r})"><defs>${defs}</defs><circle r="1" fill="#30392a"/>${body}<circle r="1" fill="none" stroke="#929d87" stroke-width=".02"/></g>`;
  }
  function wheels(p,selected) {
    const active=selected<0?0:selected;
    let out=`<circle cx="475" cy="349" r="219" fill="#d1dac8" stroke="#8c9e7b"/>${[205,194,183].map(r=>`<circle cx="475" cy="349" r="${r}" fill="none" stroke="#889a76" stroke-width="1"/>`).join('')}`;
    for(let k=0;k<36;k++){const a=k*Math.PI/18;out+=`<path d="M${475+Math.cos(a)*208} ${349+Math.sin(a)*208}l${Math.cos(a)*(k%3?4:10)} ${Math.sin(a)*(k%3?4:10)}" class="pencil"/>`;}
    p.rings.forEach((r,k)=>{const a=(r*30-90)*Math.PI/180,rad=205-k*11;out+=`<circle cx="${475+Math.cos(a)*rad}" cy="${349+Math.sin(a)*rad}" r="3" fill="#526442"/>`;});
    for(let w=0;w<3;w++){
      const a=(w*120-90)*Math.PI/180,x=475+Math.cos(a)*123,y=349+Math.sin(a)*123;
      out+=hole(E.wheelTypes(p,w),x,y,49,'window-'+w,w*120)+text(x,y+70,['一','二','三'][w]);
      out+=hole(E.wheelTypes(E.solutions[4],w),840+w*92,211,28,'wheel-target-'+w,w*120)+text(840+w*92,265,['月牙','满月','叶片'][w]);
    }
    out+=`<circle cx="475" cy="349" r="12" fill="#778b62"/><circle cx="475" cy="349" r="4" fill="#d9e2d0"/>${text(932,155,'三个孔，各留一幅小画')}`;
    for(let k=0;k<3;k++){
      const y=348+k*77;
      out+=button('pick',k,0,845,y,`纸轮${['一','二','三'][k]}`,`<rect x="-43" y="-20" width="86" height="40" fill="${active===k?'#dce6d0':'#ebefe2'}" stroke="#9ead90"/>${text(0,4,`纸轮${['一','二','三'][k]}`)}`)+button('ring',k,-1,940,y,'逆转一格',`<circle r="20" fill="#e4ecd9" stroke="#a0b28d"/>${text(0,4,'‹')}`)+button('ring',k,1,1000,y,'顺转一格',`<circle r="20" fill="#e4ecd9" stroke="#a0b28d"/>${text(0,4,'›')}`);
    }
    out+=text(631,592,`纸轮${['一','二','三'][active]}摊开后的孔 · 从刻痕开始，沿顺时针读取`);
    for(let k=0;k<12;k++){
      out+=hole([E.wheelPatterns[active][k]],303+k*58,633,20,'peek-'+k)+`<path d="M${303+k*58} 658v${k===0?8:3}" class="pencil"/>`;
      const window=[0,1,2].find(w=>E.mod(w*4-p.rings[active],12)===k);
      if(window!==undefined)out+=text(303+k*58,681,['Ⅰ','Ⅱ','Ⅲ'][window]);
    }
    return out;
  }
  function pixels(values,x,y,size) {
    const d=size/11;let out=`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#c4cabb"/>`;
    for(let row=0;row<11;row++)for(let col=0;col<11;){const v=values[row*11+col],start=col;while(col<11&&values[row*11+col]===v)col++;if(v>=0)out+=`<rect x="${x+start*d}" y="${y+row*d}" width="${(col-start)*d+.15}" height="${d+.15}" fill="${v?'#333c2b':'#eff2e7'}"/>`;}
    return out;
  }
  function folded(p) {
    const grid=E.foldPaper(p.sequence),w=grid[0].length,h=grid.length,sz=Math.min(265,440/Math.max(w,h)),x=479-w*sz/2,y=366-h*sz/2;
    let out=`<path d="M236 130L726 138 731 603 242 613Z" fill="#d1dbc5" stroke="#96a986"/><path d="M247 145L713 150M254 601L717 591" class="fine"/>`;
    for(let row=0;row<h;row++)for(let col=0;col<w;col++){
      const stack=grid[row][p.back?w-1-col:col],xx=x+col*sz,yy=y+row*sz,depth=stack.length;
      out+=`<path d="M${xx} ${yy+sz}l${depth*.6} ${depth*.65}h${sz}v-${sz}" fill="none" stroke="#a2b492"/>${pixels(E.paperPixels(stack,p.back),xx,yy,sz)}<rect x="${xx}" y="${yy}" width="${sz}" height="${sz}" fill="none" stroke="#899f77" stroke-width="1" stroke-dasharray="5 6"/>`;
    }
    out+=text(483,653,`${p.back?'观察纸背 · 翻回正面后折叠':'纸的正面'} · 已对折 ${p.sequence.length} / 4 次`);
    out+=button('fold','top',0,932,208,'上边向下折',null,h<2||p.back)+button('fold','left',0,839,290,'左边向右折',null,w<2||p.back)+button('fold','right',0,1023,290,'右边向左折',null,w<2||p.back)+button('fold','bottom',0,932,371,'下边向上折',null,h<2||p.back);
    out+=button('back',0,0,932,435,p.back?'看纸正面':'看纸背面');
    out+=pixels(E.windowPrint,879,503,106)+`<rect x="871" y="495" width="122" height="122" fill="none" stroke="#a3b691"/>`+text(932,643,'让孔洞留下这扇窗');
    return out;
  }
  function walls(p) {
    const cx=465,cy=352;
    let out=`<defs><clipPath id="whole-room-view"><rect x="180" y="144" width="570" height="421"/></clipPath><mask id="room-bird-cut" maskUnits="userSpaceOnUse" x="-215" y="-155" width="430" height="310"><rect x="-215" y="-155" width="430" height="310" fill="#fff"/><polygon points="${poly(E.bird.map(([x,y])=>[x*1.65,y*1.65]))}" fill="#000"/></mask></defs><path d="M173 144L757 139 756 570 179 578Z" fill="#d5ddcb" stroke="#9aac8a"/><g clip-path="url(#whole-room-view)"><g transform="translate(${cx} ${cy})">`;
    E.wallRects.forEach(([x0,y0,x1,y1],i)=>{
      const a=E.wallTransform(i,p.walls[i],[0,0]),b=E.wallTransform(i,p.walls[i],[1,1]);
      out+=`<g transform="matrix(${b[0]-a[0]} 0 0 ${b[1]-a[1]} ${a[0]} ${a[1]})"><g mask="url(#room-bird-cut)"><rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="#35412e"/><path d="M${x0+12} ${y0+15}h${x1-x0-24}v${y1-y0-30}h-${x1-x0-24}Z" fill="none" stroke="#91a080" stroke-width=".7"/><path d="M${x0+30} ${y0+35}h42v57h-42ZM${x0+31} ${y0+63}h40m-20-27v55M${x1-69} ${y1-28}l18-30 25 12-10 26Z" fill="none" stroke="#839574" stroke-width="1"/></g></g>`;
    });
    out+=`</g></g><g transform="translate(${cx+(p.window-2)*22} ${cy})"><rect x="-217" y="-159" width="434" height="318" fill="none" stroke="#899d77" stroke-width="5"/><path d="M-233 0h16m434 0h16M0-175v16m0 318v16" class="heavy"/></g>`;
    out+=`<path d="M799 163L1092 168 1081 365 808 362Z" fill="#e1e8d7" stroke="#a1b491"/>${text(946,144,'俯视 · 风从入口走向出口')}`;
    const heights=[221,264,307];
    p.walls.forEach((v,i)=>{
      const x=823+i*61,[a,b]=E.windRoutes[i][v];
      out+=`<path d="M${x} 192h56v133h-56Z" fill="#d4e0c8" stroke="#a6b89a"/><path d="M${x} ${heights[a]}C${x+22} ${heights[a]} ${x+34} ${heights[b]} ${x+56} ${heights[b]}" fill="none" stroke="#526746" stroke-width="4"/><path d="M${x+56} ${heights[b]}h5" class="heavy"/>${text(x+28,346,['Ⅰ','Ⅱ','Ⅲ','Ⅳ'][i])}`;
    });
    out+=`<path d="M808 ${heights[0]}h15m244 0h19" class="heavy"/>`;
    p.walls.forEach((v,i)=>{out+=button('wall',i,1,858+i%2*170,422+Math.floor(i/2)*70,`纸墙${['一','二','三','四'][i]}`,`<path d="M-66-24H66V24H-66Z" fill="#e1e9d7" stroke="#9cae8c"/>${text(0,-4,`纸墙${['一','二','三','四'][i]}`)}${text(0,14,['平放','半立','立起'][v])}`);});
    out+=`<g transform="translate(951 591) scale(.37)"><polygon points="${poly(E.bird)}" fill="#edf1e6" stroke="#8ba277" stroke-width="2"/></g>${text(951,646,'让房间留出一只鸟')}`;
    out+=button('window',0,-1,404,624,'窗框向左',`<circle r="20" fill="#e3ecd8" stroke="#a3b98e"/>${text(0,4,'‹')}`,p.window===0)+button('window',0,1,526,624,'窗框向右',`<circle r="20" fill="#e3ecd8" stroke="#a3b98e"/>${text(0,4,'›')}`,p.window===3);
    for(let i=0;i<4;i++)out+=`<path d="M${440+i*17} 618v12" stroke="${p.window===i?'#435c2e':'#9bb487'}" stroke-width="${p.window===i?3:1}"/>`;
    return out;
  }
  function roomScene(state) {
    let out=`<g class="new-paper"><path d="M966 82L1887 73 1944 603 1031 603Z" fill="url(#paperShade)" stroke="#a6ad98" stroke-width=".7"/><path d="M959 226L1092 145 1780 139 1875 214 1870 554 1780 481 1096 487 958 553Z" fill="#e5e8de"/><path d="M1780 139L1875 214 1870 554 1780 481Z" fill="#cdd2c2"/><path d="M958 553L1096 487 1780 481 1870 554 1916 590 986 588Z" fill="#d8dccf"/><path d="M959 226L1092 145 1780 139 1875 214M1096 487L1780 481 1870 554M1092 145L1096 487M1780 139V481M986 588L1916 590M1046 551L1866 548M1100 515L1814 517M1190 488L1110 589M1340 487L1330 589M1495 484L1550 589M1650 483L1768 589" class="fine"/><path d="M966 82L1031 603" class="crease"/>
    <g filter="url(#rough)"><path d="M1071 215L1202 213 1205 408 1073 411Z" fill="#939f85" stroke="#69785a"/><path d="M1081 227H1193V392H1081Z" fill="#323c2a"/>${[0,1,2,3,4,5].map(i=>`<path d="M${1086+i%3*35} ${233+Math.floor(i/3)*78}h29v68h-29Z" fill="none" stroke="#77856a"/>`).join('')}<path d="M1137 398V435" class="pencil"/>
    <path d="M1427 214L1468 167 1522 211 1488 322 1410 320Z" fill="#a9b69a" stroke="#7a8e68"/><path d="M1468 177L1462 300 1425 306ZM1476 180L1508 213 1485 304 1470 303Z" fill="#d8e1ce" stroke="#8fa57b"/><path d="M1468 302V181" class="pencil"/><path d="M1420 322h74" class="heavy"/>
    <path d="M1650 197L1802 193 1805 397 1654 401Z" fill="#a6b398" stroke="#6e855b"/><path d="M1662 261H1792M1665 327H1795M1668 385H1797" class="heavy"/>${[0,1,2,3,4,5,6].map(i=>`<path d="M${1668+i*17} ${205+i%3*7}l10-1 1 48-10 1Z" fill="${i%2?'#d7e1cd':'#657d51'}"/>`).join('')}<path d="M1669 279l43-9 21 30-46 7ZM1744 275l35 9-5 27-36-8Z" fill="#e5ecdb" stroke="#8ca277"/>
    <circle cx="1321" cy="204" r="42" fill="#becdb0" stroke="#7d956a"/><circle cx="1321" cy="204" r="35" fill="none" stroke="#8da779"/><circle cx="1321" cy="183" r="7" fill="#5d7849"/><circle cx="1303" cy="216" r="7" fill="#5d7849"/><circle cx="1339" cy="216" r="7" fill="#5d7849"/>
    <path d="M1134 472L1233 429 1345 476 1242 525Z" fill="#c2d0b2" stroke="#829c6d"/><path d="M1134 472v29l108 56 103-52v-29L1242 525Z" fill="#829b6c"/><path d="M1160 461V414l56-15v42M1241 446V392l41 19v54M1294 472V429l24 11v47" fill="#4d693a" stroke="#617e4e"/>
    <path d="M1532 482L1685 451 1788 492 1635 538Z" fill="#a9bd94" stroke="#76975c"/><path d="M1550 490l1 82 12 4 3-72M1748 503l14 66 11 4-8-73" fill="#78955f"/><path d="M1578 477L1665 462 1720 488 1638 510Z" fill="#ecf0e5" stroke="#9bb487"/><path d="M1599 477l58 26m-11-34 51 27M1611 471l-4 29M1652 466l-6 39M1690 475l-11 24" class="fine"/>
    <path d="M1819 499l40 29 15 52-50-17Z" fill="#b6c9a3" stroke="#93ae7d"/><path d="M1833 523l29 18M1840 540l25 15" class="fine"/></g></g>`;
    if(state.solved[7])out+='<path d="M1110 385L1112 337 1139 307 1120 242M1112 337L1175 365M1139 307L1174 256M1139 307L1097 283" fill="none" stroke="#e7ede0" stroke-width="3"/>';
    if(state.solved[8])out+=flower(E.solutions[1],1467,254,.2,'room-flower',true);
    if(state.solved[9])out+=`<polygon points="${poly(E.bird)}" transform="translate(1731 291) scale(.3)" fill="#485d3b"/>`;
    if(state.solved[10])out+='<path d="M1192 471v-22q43-45 81 0v24" fill="none" stroke="#dce8d1" stroke-width="6"/>';
    if(state.solved[11])out+='<circle cx="1321" cy="183" r="6" fill="#e6eddf"/><circle cx="1324" cy="181" r="5" fill="#5d7849"/><circle cx="1339" cy="216" r="6" fill="#e6eddf"/><path d="M1298 220q-3-11 10-9-1 12-10 9" fill="#e6eddf"/>';
    if(state.solved[12])out+='<path d="M1637 483q13-22 32-7l-6 17-30 3Z M1641 480l25 5m-12-14-6 23" fill="none" stroke="#617e50" stroke-width="1.5"/>';
    const spots=[[1137,316,81,109],[1466,253,73,99],[1727,300,99,119],[1236,484,113,66],[1321,204,53,55],[1659,494,116,60],[1846,550,47,57]];
    out+=spots.map(([x,y,rx,ry],k)=>{const i=k+7,done=state.solved[i],open=state.solved[i-1];return `<g data-room="${i}" role="button" tabindex="0" aria-label="${titles[k]}${done?'，已解开':open?'，进入谜题':'，尚未唤醒'}" class="interactive hotspot"><ellipse class="focus-ring" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>${!done&&open?`<circle class="breath" cx="${x}" cy="${y+ry+10}" r="3" fill="#5b6d49"/>`:''}${text(x,y+ry+29,`${done?'已展开 · ':open?'':'还在沉睡 · '}${titles[k]}`,'hover-label svg-small')}${done?`<path d="M${x-5} ${y+ry+9}l4 4 7-9" class="pencil"/>`:''}</g>`;}).join('');
    return out;
  }
  const render=(i,p,selected)=>[branch,mirror,pages,shadow,wheels,folded,walls][i-7](p,selected);
  root.ExpansionArt={titles,captions,hints,render,roomScene,boardPoint};
})(globalThis);
