/* 折影 — original vector artwork, puzzles, and sound. No network requests. */
(() => {
  'use strict';
  const L = FoldLogic, $ = id => document.getElementById(id), stage = $('stage');
  const KEY = 'zheying.save.v1';
  const titles = ['窗缝', '空白之鸟', '镜中的翅膀', '透页', '影子的路', '折痕', '房间也是纸'];
  const captions = ['墨迹断了，纸却可以移动。', '看见黑色以后，再看看空白。', '镜子里，还有另一半。', '有些东西，要透过纸才能看见。', '物体有位置，影子也有。', '远处的两笔，也许本来相邻。', '房间的边缘，似乎松开了。'];
  const hints = [
    ['两片窗纸都可以上下移动。窗框两侧有很小的刻痕。', '把两段圆弧接成完整的圆，让圆心与窗框两侧的刻痕处在同一高度。', '左边窗纸向下移动两格，右边向上移动两格。若已移动过，可以重置后再试。'],
    ['三块黑纸中的白色缺口，似乎来自同一个形状。', '上下移动纸片，让缺口的边缘相接。你寻找的是一只向右飞的鸟。', '重置后，左片向上四格，中片向下三格，右片向上一格。纸片的外边缘不必对齐。'],
    ['点击左侧的三片翅膀，可以改变它们的方向。倒影会一起变化。', '让翅膀的尖端向外伸展，翅脉连到镜面中央的身体上。墙角的小蛾子是线索。', '重置后，依次点击上方三次、中间一次、下方两次。完整的飞蛾会在镜中出现。'],
    ['两张纸都开了孔。拖动下方和右侧的纸耳，观察孔里。', '对齐纸边的小三角，让两层孔重合。孔旁的一、二、三个点表示读取顺序。', '重置后，下方纸耳向右两格，右边纸耳向上两格。按一、二、三个点，依次选择菱形、月牙、波纹。'],
    ['可以拖动纸板交换位置，也可以先点一片，再点另一片。留意它们下面的影子。', '从左边的光点出发，让相邻影子的端点相接，一直接到右边的窗。', '按影子的走向，从左到右排为：上→中下、中下→中上、中上→下、下→上。重置后先交换第一、二片，再交换第二、四片，最后交换第三、四片。'],
    ['这是一张有两道折痕的薄纸。边缘的小折角可以翻动。', '中间的线不用移动。把两边的墨迹折向中间，观察新的图案。', '点击左侧折角，再点击右侧折角。两半窗框会与中间的十字相接。'],
    ['这里的墙面和地板，为什么都有纸的边缘？', '四个角都能展开。试着点击它们，或把它们向房间外侧拖动。', '展开纸屋的左上、右上、右下和左下四个角。白鸟会从展开的纸中飞走。']
  ];
  let state = L.fresh(), storageOK = true, screen = 'intro', drag = null, selected = -1, transient = '', noticeTimer;
  try { const raw = localStorage.getItem(KEY); if (raw) state = L.restore(JSON.parse(raw)); } catch (_) { storageOK = false; }
  let audio, master, ambient, previousFocus;
  function initSound() {
    if (state.muted) return;
    try {
      if (!audio) {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        master = audio.createGain(); master.gain.value = .22; master.connect(audio.destination);
        ambient = audio.createGain(); ambient.gain.value = .018; ambient.connect(master);
        [130.81, 196.00].forEach(f => { const o = audio.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(ambient); o.start(); });
      }
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      master.gain.setTargetAtTime(document.hidden ? 0 : .22, audio.currentTime, .25);
    } catch (_) { /* Sound is optional; puzzles remain fully playable. */ }
  }
  function sound(kind = 'paper') {
    if (state.muted) return;
    initSound(); if (!audio || !master) return;
    try {
      const now = audio.currentTime, gain = audio.createGain(); gain.connect(master);
      if (kind === 'paper') {
        const b = audio.createBuffer(1, Math.floor(audio.sampleRate * .11), audio.sampleRate), data = b.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .12;
        const src = audio.createBufferSource(), filter = audio.createBiquadFilter(); src.buffer = b; filter.type = 'lowpass'; filter.frequency.value = 1100; src.connect(filter); filter.connect(gain);
        gain.gain.setValueAtTime(.5, now); gain.gain.exponentialRampToValueAtTime(.001, now + .11); src.start(); src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); };
      } else {
        const o = audio.createOscillator(); o.type = 'sine'; o.frequency.value = kind === 'solved' ? 523.25 : 261.63; o.connect(gain);
        gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.22, now + .03); gain.gain.exponentialRampToValueAtTime(.001, now + 1.4); o.start(); o.stop(now + 1.5); o.onended = () => { o.disconnect(); gain.disconnect(); };
      }
    } catch (_) { /* Do not block interaction when audio is unavailable. */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; } catch (_) { storageOK = false; }
    $('save-status').textContent = state.started ? storageOK ? '进度已留在这间房' : '存档不可用 · 请勿关闭页面' : '留一点空白给想象';
    $('save-status').classList.toggle('storage-warning', !storageOK);
  }
  function note(message) { transient = message; clearTimeout(noticeTimer); renderCaption(); noticeTimer = setTimeout(() => { transient = ''; renderCaption(); }, 2600); }
  function changeScene(next) { cancelDrag(); selected = -1; transient = ''; screen = next; if (next !== 'intro') { state.scene = next; state.started = true; } save(); render(); }
  function solved(i) {
    if (!state.solved[i] && L.isSolved(i, state.puzzles[i])) { state.solved[i] = true; sound('solved'); if (i === 6) { state.scene = 'ending'; screen = 'ending'; } save(); render(); return true; }
    save(); return false;
  }
  const bird = 'M-83-22 L-10 3 L52-80 L37 5 L101-18 L59 41 L4 45 L-29 75 L-17 29 Z';
  const sym = (i, x, y, scale = 1, color = '#33382c') => {
    const shapes = ['<path d="M0-15L12 0 0 15-12 0Z"/>', '<path d="M8-15A16 16 0 1 0 8 15A13 13 0 0 1 8-15Z"/>', '<path d="M-16-6q8-10 16 0t16 0M-16 7q8-10 16 0t16 0" fill="none" stroke="currentColor" stroke-width="2.5"/>', '<circle r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>', '<path d="M0-17L4-4 17 0 4 4 0 17-4 4-17 0-4-4Z"/>', '<path d="M0-14L14 11H-14Z" fill="none" stroke="currentColor" stroke-width="2.5"/>'];
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" style="color:${color}">${shapes[i]}</g>`;
  };
  const action = (attrs, label, body, classes = 'interactive') => `<g ${attrs} role="button" tabindex="0" aria-label="${label}" class="${classes}">${body}</g>`;
  function defs() { return `<defs><filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="17" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale=".65" xChannelSelector="R" yChannelSelector="G"/></filter><linearGradient id="paperShade" x2=".8" y2="1"><stop stop-color="#f3f3ee"/><stop offset="1" stop-color="#ddded6"/></linearGradient><linearGradient id="wallShade"><stop stop-color="#bfc3b6"/><stop offset="1" stop-color="#e9ebe2"/></linearGradient><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(21)"><path d="M0 0V7" stroke="#6e7561" stroke-width=".55" opacity=".32"/></pattern><pattern id="fineHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-23)"><path d="M0 0V4" stroke="#a2a895" stroke-width=".45"/></pattern></defs>`; }
  function specks() { return `<g class="dust" fill="#7f8773" opacity=".32">${Array.from({ length: 27 }, (_, i) => `<circle cx="${130 + (i * 173) % 960}" cy="${80 + (i * 89) % 570}" r="${i % 3 === 0 ? 1.1 : .55}"/>`).join('')}</g>`; }
  function cornerMark(x, y, n) { return `<g transform="translate(${x} ${y})"><circle r="13" fill="#e9ece0"/><text text-anchor="middle" y="4" font-family="Georgia" font-size="10" fill="#737d62">${n}</text></g>`; }
  function room(home = false) {
    const s = state.solved, count = s.slice(0, 6).filter(Boolean).length;
    const hotspots = [[420, 290, 86, 109], [830, 337, 66, 74], [696, 282, 69, 97], [568, 441, 112, 47], [558, 237, 52, 105], [773, 549, 81, 52]];
    let art = `<ellipse cx="625" cy="659" rx="416" ry="20" fill="#555e42" opacity=".055"/><path d="M217 92L966 82 1031 603 954 641 194 619Z" fill="url(#paperShade)" stroke="#a6ad98" stroke-width=".7"/><path d="M217 92L243 78 990 67 1007 564 1031 603M243 78L248 540" class="fine"/><path d="M251 219L350 143 850 149 959 226 958 553 850 485 354 492 248 565Z" fill="#e5e8de"/><path d="M251 219L350 143 354 492 248 565Z" fill="url(#wallShade)"/><path d="M850 149L959 226 958 553 850 485Z" fill="#cdd2c2"/><path d="M248 565L354 492 850 485 958 553 986 588 212 593Z" fill="#d8dccf"/><path d="M350 143L354 492 248 565M850 149L850 485 958 553M354 492L850 485M251 219L350 143 850 149 959 226M248 565L212 593 986 588 958 553" class="pencil"/><path d="M245 570L948 563M300 548L912 543M325 519L876 515M400 494L356 591M489 492L463 590M580 490L587 590M681 490L728 590M775 488L867 589" class="fine"/><path d="M857 158L951 231 949 542 858 483Z" fill="url(#hatch)" opacity=".5"/>
    <g filter="url(#rough)"><path d="M356 189L491 184 493 377 357 384Z" fill="#f0f2e9" stroke="#838d73"/><path d="M367 201L480 198 481 365 369 371Z" fill="#33392f"/><path d="M369 310Q421 245 480 311V365L369 371Z" fill="#5b654f"/><path d="M376 291L381 207M391 274L398 207M409 265L415 208M427 267L433 210M447 275L454 211M466 291L470 211" stroke="#919a83" stroke-width=".6"/><circle cx="451" cy="235" r="17" fill="#d9dfcd"/><circle cx="459" cy="230" r="17" fill="#33392f"/>
    ${s[0] ? '<path d="M369 284L424 274 424 365 369 371ZM424 274L480 279 481 365 424 365Z" fill="#e2e7d6" opacity=".14"/><path d="M424 198V367M367 284L481 280" stroke="#c7d0b8" stroke-width="4"/>' : '<path d="M367 263L423 261V310L368 312ZM425 299L481 297V346L425 348Z" fill="#d6dccb"/><path d="M423 198V367" stroke="#bec7af" stroke-width="3"/>'}
    <path d="M349 384L499 378 500 388 351 396Z" fill="#a6af96" stroke="#778167"/><path d="M360 391L351 404M494 388L505 400" class="pencil"/>
    <g><path d="M523 159L591 158M558 155V195" class="pencil"/><path d="M525 194L591 194" class="heavy"/>${[0,1,2,3].map((i) => `<path d="M${531+i*17} 194V${241+[12,0,21,7][i]}" class="pencil"/><path d="M${523+i*17} ${235+[12,0,21,7][i]}l15-2 2 43-15 5Z" fill="${s[4] ? '#666e5a' : '#383f31'}"/>`).join('')}<path d="M515 312L608 320" stroke="#717c62" opacity=".35"/></g>
    <path d="M647 201Q697 153 745 203L748 349Q698 376 648 349Z" fill="#a5af96" stroke="#69765b"/><path d="M656 206Q697 167 736 208L739 341Q698 363 656 341Z" fill="#d3dbca" stroke="#7f8c6f"/><path d="M696 181V351M661 303L731 233" stroke="#f7f9f0" stroke-width="2" opacity=".5"/>${s[2] ? `<g transform="translate(697 265) scale(.42)" fill="#515f43"><path d="M0 0L-73-65-65 7-19 18-57 63 0 39 57 63 19 18 65 7 73-65Z"/><path d="M0-18V47" stroke="#303e23" stroke-width="5"/></g>` : '<path d="M676 244L690 259 678 280M711 269L720 291 703 303" class="pencil"/>'}
    <path d="M792 268L869 277 870 404 792 393Z" fill="#7b876c"/><path d="M798 276L864 283 864 396 798 387Z" fill="#353e2d"/>${s[1] ? `<path d="${bird}" transform="translate(832 337) scale(.29)" fill="#e9eee0"/>` : '<path d="M807 313L825 329 838 309M817 365L843 345 851 366" stroke="#e7ecdd" stroke-width="5" fill="none"/>'}<path d="M814 266L832 250 851 273" class="fine"/>
    <path d="M462 441L646 427 703 457 483 479Z" fill="#a7b395" stroke="#687858"/><path d="M483 479L703 457V471L483 492 462 454V441" fill="#8e9d7b" stroke="#687858"/><path d="M491 491L491 570 502 573 508 490M681 473L689 547 700 550 697 471M472 462V533L481 539V478" fill="#737f61"/>
    <path d="M490 439L549 420 577 438 623 417 665 441 579 464Z" fill="#eaedde" stroke="#808e6d"/><path d="M549 420L555 442 579 464 577 438M577 438L624 417M555 442L506 446" class="pencil"/><path d="M503 438L546 426M510 443L548 432M598 439L637 429M605 444L646 434" class="fine"/>${s[3] ? sym(0,556,438,.35) + sym(1,605,438,.35) : '<circle cx="536" cy="438" r="4" fill="#9da98b"/><circle cx="620" cy="436" r="4" fill="#9da98b"/>'}
    <path d="M309 463L355 460 374 481 330 488Z" fill="#9ba989" stroke="#6e805d"/><path d="M307 426L309 463 319 468 317 428ZM350 423L355 460 364 470 360 427Z" fill="#748664"/><path d="M306 425L358 422 361 435 308 438Z" fill="#8c9b79"/><path d="M329 489L328 549M368 484L375 533M315 473L311 524" stroke="#768465" stroke-width="7"/>
    <path d="M739 432Q731 468 749 478Q770 477 766 430Z" fill="#77876a"/><path d="M751 432L749 379M750 404L728 389M750 399L769 379M750 419L775 405M749 386L735 363M749 381L762 354" class="heavy"/><path d="M727 389q-10-20-18-7 7 13 18 7M769 379q5-21 17-16-3 15-17 16M775 405q18-3 13-13-11-1-13 13M735 363q-2-15-13-13 0 13 13 13" fill="#617550"/>
    <path d="M713 538L789 508 840 549 761 582Z" fill="#f0f3e5" stroke="#8d9c7b"/><path d="M736 551L789 508 779 562M740 528L803 565" class="fine"/>${s[5] ? '<path d="M762 544q-3-20 15-20t15 20v16h-30Z" fill="none" stroke="#667957" stroke-width="1.5"/>' : '<path d="M742 543l12 8M785 528l11 5M785 558l12-4" class="pencil"/>'}
    <path d="M425 548L462 548M708 518L734 515M911 460L931 475M275 316L290 305M799 180L823 181" class="fine"/></g>`;
    if (count) art += `<g opacity="${.2 + count * .07}" class="crease">${count >= 1 ? '<path d="M217 92L595 348 1031 603"/>' : ''}${count >= 2 ? '<path d="M966 82L595 348 194 619"/>' : ''}${count >= 3 ? '<path d="M209 345L1010 347"/>' : ''}${count >= 4 ? '<path d="M595 87L599 630"/>' : ''}</g>`;
    if (!home) {
      art += hotspots.map(([x,y,rx,ry], i) => {
        const unlocked = i === 0 || s[i-1];
        return action(`data-room="${i}"`, `${titles[i]}${s[i] ? '，已解开' : unlocked ? '，进入谜题' : '，尚未唤醒'}`, `<ellipse class="focus-ring" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>${!s[i] && unlocked ? `<circle class="breath" cx="${x}" cy="${y+ry+12}" r="3" fill="#5b6d49"/><path d="M${x-9} ${y+ry+12}h-9m36 0h9" class="fine"/>` : ''}<text class="hover-label svg-small" x="${x}" y="${y+ry+37}" text-anchor="middle">${s[i] ? '已展开 · ' : unlocked ? '' : '还在沉睡 · '}${titles[i]}</text>`, 'interactive hotspot');
      }).join('');
      if (count === 6) {
        const c = state.puzzles[6].corners;
        const points = [[217,92],[966,82],[1031,603],[194,619]];
        art += points.map(([x,y],i) => action(`data-corner="${i}"`, `${['左上','右上','右下','左下'][i]}纸角${c[i] ? '已展开' : '，点击或向外拖动展开'}`, `<g transform="translate(${x} ${y}) rotate(${[0,90,180,270][i]})"><path d="${c[i] ? 'M0 0L-41-24-24-41Z' : 'M0 0L58 0 0 58Z'}" fill="${c[i] ? '#eee' : '#c0c8b4'}" stroke="#7f8e6c"/><path d="M5 5L26 26" class="fine"/>${!c[i] ? '<path d="M13 27L13 13 27 13" class="pencil breath"/>' : ''}<circle r="38" fill="transparent"/></g>`, 'interactive corner')).join('');
      }
    }
    return `<g ${home ? 'transform="translate(272 5) scale(.78)"' : ''}><g class="scene-art">${art}</g></g>`;
  }
  function paperBackground() { return `<ellipse cx="600" cy="622" rx="330" ry="13" class="shadow"/><path d="M300 155L891 144 912 577 294 587Z" fill="#eff1e8" stroke="#aab19d" stroke-width=".7"/><path d="M308 160L883 154M304 577L901 570" class="fine"/>`; }
  function puzzle0() {
    const p = state.puzzles[0];
    let html = `<path d="M338 164L861 158 867 555 334 562Z" fill="#cbd2bf" stroke="#808f6f"/><path d="M353 179H847V541H353Z" fill="#f4f5ef" stroke="#a7b09a"/><path d="M600 181V540" class="fine"/><path d="M324 360h29m494 0h30" class="heavy"/>`;
    for (let i=0;i<2;i++) {
      const x = i ? 604 : 362, y = 206 + p.offsets[i];
      html += action(`data-drag="window" data-i="${i}"`, `${i ? '右' : '左'}窗纸，上下拖动或按方向键`, `<g transform="translate(0 ${p.offsets[i]})"><path d="M${x} 206h232v309h-232Z" fill="${i ? '#e5e9de' : '#eaeee3'}" stroke="#b0b9a0"/><path d="${i ? 'M600 248A112 112 0 0 1 600 472' : 'M600 248A112 112 0 0 0 600 472'}" fill="none" stroke="#343e2b" stroke-width="7"/><path d="M${x+25} 224h${i ? 23 : 38}M${x+19} 490h30" class="fine"/><circle cx="${i ? 804 : 399}" cy="360" r="3" fill="#8b987a"/><path d="M${i ? 798 : 393} 350h12m-12 20h12" class="fine"/></g><rect x="${x}" y="${y}" width="232" height="309" fill="transparent"/>`, 'drag-piece');
    }
    html += `<path d="M600 573v24m-5-18 5-6 5 6m-10 12 5 6 5-6" class="pencil"/><text x="600" y="632" text-anchor="middle" class="svg-small">上下移动窗纸</text>`;
    return html;
  }
  function puzzle1() {
    const p = state.puzzles[1], outline = 'M400 210L534 198 531 527 396 512ZM531 187L662 214 666 548 534 527ZM663 210L800 189 791 518 665 539Z';
    let html = `<path d="M357 176L835 169 843 573 350 581Z" fill="#dde3d2" stroke="#bac3a9"/><g transform="translate(600 630)"><path d="M-18-8L0 8 18-8" class="fine"/></g>`;
    for (let i=0;i<3;i++) {
      const x = 400+i*133, d = p.offsets[i];
      html += `<defs><clipPath id="strip-${i}"><rect x="${x}" y="170" width="134" height="390"/></clipPath><mask id="bird-mask-${i}" maskUnits="userSpaceOnUse" x="350" y="150" width="500" height="440"><rect x="350" y="150" width="500" height="440" fill="white"/><path d="${bird}" transform="translate(600 345) scale(1.55)" fill="black"/></mask></defs>`;
      html += action(`data-drag="void" data-i="${i}"`, `第${i+1}块黑纸，上下移动，让留白相接`, `<g transform="translate(0 ${d})"><g clip-path="url(#strip-${i})"><path d="${outline}" mask="url(#bird-mask-${i})" fill="#30392a"/><path d="M${x+12} 223v45m3-41v24M${x+116} 477v25" stroke="#818b76" stroke-width=".5"/></g><rect x="${x}" y="205" width="133" height="312" fill="transparent"/></g>`, 'drag-piece');
    }
    return html;
  }
  const wingCenters = [[524,295],[518,376],[551,455]];
  const wings = ['M76 59L-67-76Q-89-24-65 44L-1 73Z','M82-8L-71-24-56 47-6 40Z','M49-43L-63 0-36 56 17 24Z'];
  function puzzle2() {
    const p=state.puzzles[2];
    let html=`<path d="M599 150Q764 152 823 280L823 535Q720 601 600 567Z" fill="#cdd6c1" stroke="#94a580"/><path d="M611 167Q754 165 808 283V526Q724 582 611 556Z" fill="#dce5d1" stroke="#a4b295"/><path d="M600 145V575" stroke="#667b50" stroke-width="2"/><path d="M654 191L800 398M626 204L800 451" stroke="#f0f4e9" stroke-width="8" opacity=".4"/><path d="M600 287C591 318 590 418 600 483C610 418 609 318 600 287Z" fill="#3d502e"/><path d="M599 299q-10-46-28-45M602 299q10-46 28-45" class="heavy"/>`;
    for(let i=0;i<3;i++) {
      const [x,y]=wingCenters[i], rot=p.turns[i]*90;
      const shape=`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${wings[i]}" fill="#374a29" stroke="#6d8257"/><path d="${i===0 ? 'M76 59L-54-51M30 31L-56-10M1 2L-67 27' : i===1 ? 'M82-8L-53 10M32-4L-35 34' : 'M49-43L-31 38M14-16L-47 10'}" fill="none" stroke="#b7c7a6" stroke-width="1.3"/><circle r="3" fill="#cfdbc2"/></g>`;
      html += `<g transform="translate(1200 0) scale(-1 1)" opacity=".72">${shape}</g>`;
      html += action(`data-turn="${i}"`, `第${i+1}片翅膀，点击旋转四分之一圈`, shape + `<circle cx="${x}" cy="${y}" r="53" fill="transparent"/>`);
    }
    html += `<g transform="translate(341 548) scale(.23)" fill="#919e83"><path d="M0 0L-73-65-65 7-19 18-57 63 0 39 57 63 19 18 65 7 73-65Z"/><path d="M0-18V47" stroke="#819373" stroke-width="5"/></g><text x="600" y="633" text-anchor="middle" class="svg-small">轻触纸片，转动翅膀</text>`;
    return html;
  }
  function puzzle3() {
    const p = state.puzzles[3];
    let html=`<path d="M308 183L892 181 900 454 305 462Z" fill="#ebeee4" stroke="#9baa87"/><defs><clipPath id="peek"><rect x="333" y="206" width="535" height="230"/></clipPath><mask id="holes" maskUnits="userSpaceOnUse" x="100" y="80" width="1000" height="540"><rect x="100" y="80" width="1000" height="540" fill="white"/>${[410,600,790].map(x=>`<circle cx="${x}" cy="320" r="33" fill="black"/>`).join('')}</mask></defs><g clip-path="url(#peek)"><rect x="333" y="206" width="535" height="230" fill="#e7eddd"/>`;
    for(let r=0;r<3;r++)for(let c=0;c<6;c++)html+=sym((r*5+c+3)%6,355+c*95,245+r*75,.7,'#778568');
    html+=`<rect x="368" y="280" width="461" height="79" fill="#e7eddd"/>${[410,600,790].map((x,i)=>sym(i,x,320,1.1)).join('')}`;
    html+=`<g transform="translate(${p.offsets[0]} 0)"><rect x="100" y="80" width="1000" height="540" fill="#9ca98b" mask="url(#holes)"/><path d="M250 242H960M250 395H960" class="fine"/></g><g transform="translate(0 ${p.offsets[1]})"><rect x="100" y="80" width="1000" height="540" fill="#c8d2bb" mask="url(#holes)"/>${[410,600,790].map((x,i)=>`<circle cx="${x}" cy="320" r="34" fill="none" stroke="#859875"/>${Array.from({length:i+1},(_,j)=>`<circle cx="${x+(j-i/2)*9}" cy="372" r="2.3" fill="#657951"/>`).join('')}`).join('')}</g></g>`;
    html+=`<path d="M594 459L600 450 606 459M894 314L885 320 894 326" fill="#60754c"/>`;
    html+=action('data-drag="veil" data-i="0"','下方纸耳，左右移动第一张镂空纸',`<g transform="translate(${p.offsets[0]} 0)"><path d="M570 465H630V493H570Z" fill="#a2b08e" stroke="#7d9168"/><path d="M594 470L600 460 606 470" fill="#60754c"/><path d="M580 484H620" class="fine"/></g>`,'drag-piece');
    html+=action('data-drag="veil" data-i="1"','右侧纸耳，上下移动第二张镂空纸',`<g transform="translate(0 ${p.offsets[1]})"><path d="M902 288H938V352H902Z" fill="#c8d2bb" stroke="#7d9168"/><path d="M904 314L895 320 904 326" fill="#60754c"/><path d="M922 300V340" class="fine"/></g>`,'drag-piece');
    html+=`<g>${[0,1,2].map((_,i)=>`<path d="M${549+i*50} 535h28" class="pencil"/>${p.input[i]===undefined?'':sym(p.input[i],563+i*50,517,.6)}`).join('')}</g>`;
    for(let i=0;i<6;i++) html+=action(`data-symbol="${i}"`,['菱形','月牙','波纹','圆环','星芒','三角'][i],`<rect x="${370+i*78}" y="557" width="64" height="59" rx="2" fill="#e6ebdf" stroke="#a0ad90"/>${sym(i,402+i*78,586,.78)}`,'interactive pressable');
    html+=action('data-clear="1"','清空已选符号','<text x="735" y="527" class="svg-small">清空</text><rect x="724" y="495" width="60" height="45" fill="transparent"/>');
    return html;
  }
  function puzzle4() {
    const p=state.puzzles[4], heights=[437,472,507,542];
    let html=`<path d="M316 159H898" class="heavy"/><path d="M300 160H321m573 0h18" class="fine"/><path d="M306 426L326 437 306 448" fill="#536b3f"/><circle cx="307" cy="437" r="22" fill="none" stroke="#b0bfa2"/><path d="M895 419H925V454H895Z" fill="none" stroke="#60764c"/><path d="M910 420V452M896 437H924" class="fine"/>`;
    p.order.forEach((id,slot)=>{
      const x=330+slot*140, [a,b]=L.routes[id], y1=heights[a],y2=heights[b];
      html+=`<path d="M${x+24} 324L${x} ${y1} ${x+140} ${y2} ${x+115} 323Z" fill="url(#fineHatch)" opacity=".43"/><path d="M${x} ${y1}C${x+52} ${y1} ${x+88} ${y2} ${x+140} ${y2}" fill="none" stroke="#3f5330" stroke-width="11" stroke-linecap="butt"/><circle cx="${x}" cy="${y1}" r="3" fill="#b8c7a9"/><circle cx="${x+140}" cy="${y2}" r="3" fill="#b8c7a9"/>`;
      html+=action(`data-drag="shadow" data-i="${slot}"`, `第${slot+1}片悬纸，拖动交换或点选两片交换`, `<g><path d="M${x+69} 160V221" class="pencil"/><path d="M${x+16} 223L${x+121} 218 ${x+121} ${303+b*12}Q${x+81} ${287+a*8} ${x+14} ${303+a*12}Z" fill="#465a35" stroke="#60774d"/><circle cx="${x+69}" cy="235" r="3" fill="#d6e1cb"/><path d="M${x+26} 239v50m4-35v30M${x+107} 230v44" stroke="#92a47f" stroke-width=".6"/><rect x="${x+5}" y="211" width="128" height="154" fill="transparent" stroke="${selected===slot?'#657b51':'transparent'}" stroke-dasharray="3 6"/></g>`, 'drag-piece');
    });
    html+=`<path d="M319 588H922" class="fine"/><text x="600" y="632" text-anchor="middle" class="svg-small">交换悬纸，让影子接上</text>`;
    return html;
  }
  function puzzle5() {
    const p=state.puzzles[5];
    let html=`<path d="M352 168L847 166 853 573 351 578Z" fill="#e8eede" stroke="#93a580"/><rect x="520" y="180" width="160" height="380" fill="#dce6cd"/><path d="M520 180V560M680 180V560" class="crease"/><path d="M550 390H650M600 300V465" fill="none" stroke="#3d572a" stroke-width="4"/><path d="M596 290h8M550 390v6M650 390v6" class="fine"/>`;
    html+=`<g transform="${p.folds[0]?'translate(1040 0) scale(-1 1)':''}"><path d="M360 180H520V560H360Z" fill="#f2f5eb" fill-opacity=".3" stroke="#b3c39f"/><path d="M490 350Q490 300 440 300M490 350V465H440" fill="none" stroke="#3d572a" stroke-width="4"/><path d="M382 198l21 9M392 531h20" class="fine"/></g>`;
    html+=`<g transform="${p.folds[1]?'translate(1360 0) scale(-1 1)':''}"><path d="M680 180H840V560H680Z" fill="#f2f5eb" fill-opacity=".3" stroke="#b3c39f"/><path d="M760 300Q710 300 710 350V465H760" fill="none" stroke="#3d572a" stroke-width="4"/><path d="M796 204h23M800 540l20-9" class="fine"/></g>`;
    for(let i=0;i<2;i++) html+=action(`data-fold="${i}"`, `${i?'右':'左'}折角，${p.folds[i]?'展开':'向中间折叠'}`, `<g transform="translate(${i?858:342} 369)"><circle r="30" fill="#e0e9d4" stroke="#a0b28b"/><path d="${i?'M9-14L-9 0 9 14':'M-9-14L9 0-9 14'}" class="pencil"/><path d="M-14-24L15-19" class="fine"/></g>`);
    return html;
  }
  function endingArt() { return `<g class="scene-art"><ellipse cx="859" cy="558" rx="237" ry="24" class="shadow"/><path d="M637 263L902 240 1051 440 785 504 612 412Z" fill="#f2f4eb" stroke="#a8b698"/><path d="M637 263L785 504M902 240L612 412M720 255L976 468" class="crease"/><g opacity=".2" transform="translate(530 238) scale(.39)">${room(true)}</g><path d="M1051 440L998 407 1012 462Z" fill="#cbd8bc"/><path d="M719 354Q805 294 839 223" fill="none" stroke="#99aa88" stroke-dasharray="2 9"/><g class="bird-flight"><path d="${bird}" fill="#f9faf4" stroke="#7b9266" stroke-width="1.2"/><path d="M-10 3L37 5 4 45M-10 3L-17 29" class="fine"/></g></g>`; }
  function renderCaption() {
    let caption = '';
    if (screen === 'room') caption = state.solved[5] ? state.solved[6] ? '纸记得，每一次轻轻的触碰。' : '原来，房间也有折角。' : state.solved.some(Boolean) ? '刚刚的变化，留在了房间里。' : '那扇窗，似乎藏着第一道缝隙。';
    else if (typeof screen === 'number') caption = state.solved[screen] ? ['窗外的光，终于连成一个圆。','原来，鸟一直藏在空白里。','镜中的另一半，终于醒来。','纸遮住了杂音，留下了答案。','影子走到了窗前。','两道折痕，折出了一扇窗。'][screen] : captions[screen];
    $('scene-caption').textContent = transient || caption;
  }
  function render() {
    const isPuzzle = typeof screen === 'number', isRoom = screen === 'room', ending = screen === 'ending';
    $('intro').hidden = screen !== 'intro'; $('ending').hidden = !ending;
    $('scene-heading').hidden = !isPuzzle && !(isRoom && state.solved[5] && !state.solved[6]);
    const i = isPuzzle ? screen : 6;
    $('back').hidden = !isPuzzle; $('reset').hidden = !isPuzzle || state.solved[i];
    $('scene-title').textContent = titles[i]; $('scene-index').textContent = `${String(i+1).padStart(2,'0')} / 07`;
    $('start').firstChild.textContent = state.started ? '回到这个梦 ' : '走进这间房 ';
    $('sound').innerHTML = `声音 <span>${state.muted ? '关' : '开'}</span>`; $('sound').setAttribute('aria-label',state.muted?'开启声音':'关闭声音'); $('sound').setAttribute('aria-pressed',String(!state.muted));
    $('chapter-label').textContent = isPuzzle ? '纸的另一面' : ending ? '梦的出口' : '一间纸做的梦';
    $('footer-note').textContent = isPuzzle ? '观察 · 移动 · 发现' : ending ? '谢谢你，轻轻展开这个梦。' : '慢慢观察，轻轻移动。';
    $('progress').innerHTML = state.solved.map((v,k)=>`<i class="${v?'done':k===i&&isPuzzle?'current':''}"></i>`).join('');
    $('progress').setAttribute('aria-label',`已解开 ${state.solved.filter(Boolean).length} / 7 道谜题`);
    $('return-room').hidden = !isPuzzle || !state.solved[screen];
    let html = defs()+specks();
    if (screen === 'intro') html += room(true);
    else if (isRoom) html += room();
    else if (ending) html += endingArt();
    else html += `<g class="puzzle-art ${state.solved[screen]?'solved-glow':''}">${[puzzle0,puzzle1,puzzle2,puzzle3,puzzle4,puzzle5][screen]()}</g>`;
    stage.innerHTML = html;
    stage.setAttribute('aria-label',isPuzzle?`${titles[screen]}谜题`:ending?'白鸟飞出了展开的纸屋':'折影的纸房间');
    if (isPuzzle && state.solved[screen]) stage.querySelectorAll('[role=button]').forEach(el=>{el.removeAttribute('tabindex');el.setAttribute('aria-disabled','true');el.classList.remove('drag-piece','interactive');});
    renderCaption(); save();
  }
  function panel(html) { cancelDrag(); previousFocus=document.activeElement; $('panel-body').innerHTML=html; if (!$('panel').open) $('panel').showModal(); $('close-panel').focus(); }
  function closePanel() { $('panel').close(); if (previousFocus?.isConnected) previousFocus.focus(); }
  function showHint() {
    const i=typeof screen==='number'?screen:6;
    if(!state.hints[i]) state.hints[i]=1;
    save();
    panel(`<p class="eyebrow">A SMALL NUDGE</p><h2 id="panel-title">${titles[i]}</h2>${hints[i].slice(0,state.hints[i]).map((h,k)=>`<div class="hint-step"><span>0${k+1} / 03</span><p>${h}</p></div>`).join('')}<div class="panel-actions">${state.hints[i]<3?'<button id="next-hint" class="enter">再给一点提示 <span>↗</span></button>':'<p class="warning">答案已经在这里。按自己的节奏试试。</p>'}</div>`);
    if($('next-hint')) $('next-hint').onclick=()=>{state.hints[i]++;showHint();};
  }
  function menu() {
    panel('<p class="eyebrow">TAKE YOUR TIME</p><h2 id="panel-title">歇一会儿也没关系</h2><p>点击房间里的物体，走近它。<br>拖动纸片，或轻触转动、折叠。<br>可移动的纸片也支持方向键。<br>没有计时，答案不依赖声音。</p><p class="warning">进度保存在当前浏览器。清除网站数据会清除这个梦。</p><div class="menu-links"><button id="resume-menu" class="enter">继续这个梦 <span>↗</span></button><button id="restart-menu" class="quiet">从头开始</button></div>');
    $('resume-menu').onclick=closePanel; $('restart-menu').onclick=confirmRestart;
  }
  function confirmRestart() {
    panel('<p class="eyebrow">A NEW SHEET OF PAPER</p><h2 id="panel-title">重新折起这间房？</h2><p>本次的解谜进度和提示记录会清除。声音设置会保留。</p><div class="panel-actions"><button id="confirm-restart" class="enter">重新开始 <span>↗</span></button><button id="cancel-restart" class="quiet">保留这个梦</button></div>');
    $('cancel-restart').onclick=closePanel; $('confirm-restart').onclick=()=>{const muted=state.muted;state=L.fresh();state.muted=muted;closePanel();changeScene('intro');};
  }
  function pt(e) { const p = stage.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(stage.getScreenCTM().inverse()); }
  function cancelDrag() { if(!drag)return; if(drag.kind!=='corner') state.puzzles[drag.scene]=L.copy(drag.before); const id=drag.pointer;drag=null;stage.classList.remove('dragging');try{stage.releasePointerCapture(id);}catch(_){}save();render(); }
  function inputAllowed() { return typeof screen==='number'&&!state.solved[screen]; }
  function movePiece(kind,i,value) {
    if(kind==='window')state.puzzles[0].offsets[i]=Math.max(-120,Math.min(120,Math.round(value/40)*40));
    if(kind==='void')state.puzzles[1].offsets[i]=Math.max(-100,Math.min(100,Math.round(value/20)*20));
    if(kind==='veil')state.puzzles[3].offsets[i]=Math.max(i?-80:-100,Math.min(i?80:100,Math.round(value/(i?40:50))*(i?40:50)));
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.button!==0 || drag)return;
    const el=e.target.closest('[data-drag],[data-corner]'); if(!el)return;
    const corner=el.hasAttribute('data-corner');
    if(!corner&&!inputAllowed() || corner && (screen!=='room'||!state.solved[5]||state.solved[6]))return;
    const start=pt(e), i=Number(corner?el.dataset.corner:el.dataset.i), kind=corner?'corner':el.dataset.drag;
    drag={kind,i,start,pointer:e.pointerId,scene:screen,before:corner?null:L.copy(state.puzzles[screen]),moved:false};
    stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');e.preventDefault();
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    const p=pt(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
    if(Math.hypot(dx,dy)>6)drag.moved=true;
    if(['window','void','veil'].includes(drag.kind)) { const delta=drag.kind==='veil'&&drag.i===0?dx:dy;movePiece(drag.kind,drag.i,drag.before.offsets[drag.i]+delta);render(); }
    else if(drag.kind==='shadow'&&drag.moved){selected=Math.max(0,Math.min(3,Math.floor((p.x-330)/140)));render();}
  });
  stage.addEventListener('pointerup',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    const d=drag,p=pt(e);drag=null;stage.classList.remove('dragging');try{stage.releasePointerCapture(e.pointerId);}catch(_){}
    if(d.kind==='corner') {
      const dx=p.x-d.start.x,dy=p.y-d.start.y;
      const outward=[-dx-dy,dx-dy,dx+dy,-dx+dy][d.i];
      if(!d.moved||outward>35) {state.puzzles[6].corners[d.i]=true;sound();solved(6);}
    } else if(d.kind==='shadow') {
      if(d.moved) {const to=Math.max(0,Math.min(3,Math.floor((p.x-330)/140)));const a=state.puzzles[4].order;[a[d.i],a[to]]=[a[to],a[d.i]];selected=-1;sound();solved(4);}
      else pickShadow(d.i);
    } else {sound();solved(d.scene);}
    save();render();
  });
  stage.addEventListener('pointercancel',cancelDrag);
  stage.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
  function pickShadow(i){if(selected<0)selected=i;else{const a=state.puzzles[4].order;[a[selected],a[i]]=[a[i],a[selected]];selected=-1;sound();solved(4);}render();}
  function activate(el) {
    if(el.hasAttribute('data-room')) {
      const i=Number(el.dataset.room); if(i===0||state.solved[i-1])changeScene(i);else note('先唤醒房间里，那处微微亮起的地方。');return;
    }
    if(!inputAllowed())return;
    if(el.hasAttribute('data-turn')){const i=Number(el.dataset.turn);state.puzzles[2].turns[i]=(state.puzzles[2].turns[i]+1)%4;sound();solved(2);}
    if(el.hasAttribute('data-fold')){const i=Number(el.dataset.fold);state.puzzles[5].folds[i]=!state.puzzles[5].folds[i];sound();solved(5);}
    if(el.hasAttribute('data-symbol')) {
      const p=state.puzzles[3];if(p.input.length===3)p.input=[];p.input.push(Number(el.dataset.symbol));sound('tap');
      if(p.input.length===3&&!solved(3))note('纸还没有回应。再看看孔里的形状。');
    }
    if(el.hasAttribute('data-clear'))state.puzzles[3].input=[];
    save();render();
  }
  stage.addEventListener('click',e=>{const el=e.target.closest('[data-room],[data-turn],[data-fold],[data-symbol],[data-clear]');if(el)activate(el);});
  stage.addEventListener('keydown',e=>{
    const el=e.target.closest('[role=button]');if(!el)return;
    if((e.key==='Enter'||e.key===' ')&&!el.hasAttribute('data-drag')){
      e.preventDefault();if(el.hasAttribute('data-corner')&&screen==='room'&&state.solved[5]&&!state.solved[6]){state.puzzles[6].corners[Number(el.dataset.corner)]=true;sound();solved(6);render();}else activate(el);return;
    }
    if(!inputAllowed()||!el.hasAttribute('data-drag'))return;
    const kind=el.dataset.drag,i=Number(el.dataset.i), dir=e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:e.key==='ArrowDown'||e.key==='ArrowRight'?1:0;
    if(kind==='shadow'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pickShadow(i);stage.querySelector(`[data-drag="shadow"][data-i="${i}"]`)?.focus();return;}
    if(!dir||kind==='shadow')return;
    e.preventDefault();const step=kind==='window'?40:kind==='void'?20:i?40:50;
    movePiece(kind,i,state.puzzles[screen].offsets[i]+dir*step);sound();solved(screen);render();stage.querySelector(`[data-drag="${kind}"][data-i="${i}"]`)?.focus();
  });
  $('start').onclick=()=>{initSound();changeScene(state.started?state.scene:'room');};
  $('home').onclick=()=>{changeScene('intro');}; $('back').onclick=()=>changeScene('room');$('return-room').onclick=()=>changeScene('room');
  $('ending-room').onclick=()=>changeScene('room');$('restart-end').onclick=confirmRestart;
  $('reset').onclick=()=>{if(!inputAllowed())return;cancelDrag();state.puzzles[screen]=L.copy(L.initial[screen]);selected=-1;transient='';sound();save();render();};
  $('hint').onclick=showHint;$('menu').onclick=menu;$('close-panel').onclick=closePanel;
  $('panel').addEventListener('click',e=>{if(e.target===$('panel')){const b=$('panel').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closePanel();}});
  $('sound').onclick=()=>{state.muted=!state.muted;if(master)master.gain.setTargetAtTime(state.muted?0:.22,audio.currentTime,.12);if(!state.muted)initSound();save();render();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drag){cancelDrag();return;}if(!$('panel').open&&typeof screen==='number')changeScene('room');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelDrag();save();if(master)master.gain.setTargetAtTime(0,audio.currentTime,.2);}else if(master&&!state.muted)master.gain.setTargetAtTime(.22,audio.currentTime,.2);});
  window.addEventListener('blur',()=>{if(drag)cancelDrag();});window.addEventListener('pagehide',()=>{cancelDrag();save();});
  render();
})();
