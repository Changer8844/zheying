/* Original, locally synthesized score: soft paper-piano and a slow breath of air. */
(function (root) {
  'use strict';
  const melody=[
    [74,null,69,72],[65,null,69,null],[72,null,67,64],[69,null,65,null],
    [74,null,77,76],[72,null,69,null],[67,null,72,69],[65,null,62,null],
    [69,null,74,77],[76,null,72,null],[72,null,67,69],[65,null,69,null],
    [74,null,72,69],[65,null,67,null],[64,null,69,67],[62,null,null,null]
  ];
  const chords=[[50,57,65],[46,53,62],[48,55,64],[45,52,60]];
  let context,master,music,effects,compressor,wave,timer,nextBeat=0,beat=0;
  let preferences={muted:false,musicVolume:.4,effectsVolume:.75},visible=true;
  const hz=midi=>440*2**((midi-69)/12);
  function voice(bus,midi,when,volume,duration=3.8,pad=false) {
    const oscillator=context.createOscillator(),gain=context.createGain();
    if(pad)oscillator.type='sine';else oscillator.setPeriodicWave(wave);
    oscillator.frequency.setValueAtTime(hz(midi),when);
    oscillator.connect(gain);gain.connect(bus);
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+(pad?.8:.035));
    gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    oscillator.start(when);oscillator.stop(when+duration+.05);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  function schedule() {
    if(!context||context.state!=='running'||!visible||preferences.muted||preferences.musicVolume===0)return;
    if(nextBeat<context.currentTime)nextBeat=context.currentTime+.08;
    while(nextBeat<context.currentTime+.6) {
      const bar=Math.floor(beat/4)%melody.length,index=beat%4,note=melody[bar][index];
      if(note!==null)voice(music,note,nextBeat,index===0?.105:.08,3.4);
      if(index===0)chords[bar%4].forEach((n,k)=>voice(music,n,nextBeat+k*.12,.017,5.1,true));
      nextBeat+=.9;beat++;
    }
  }
  function update(settings) {
    preferences={muted:settings.muted===true,musicVolume:settings.musicVolume??.4,effectsVolume:settings.effectsVolume??.75};
    if(!context)return;
    const now=context.currentTime;
    master.gain.setTargetAtTime(preferences.muted||!visible?0:.85,now,.08);
    music.gain.setTargetAtTime(preferences.musicVolume,now,.12);
    effects.gain.setTargetAtTime(preferences.effectsVolume,now,.06);
    if(preferences.muted||!visible||preferences.musicVolume===0){clearInterval(timer);timer=null;}
    else if(!timer){nextBeat=Math.max(nextBeat,now+.08);timer=setInterval(schedule,200);schedule();}
  }
  function resume(settings) {
    try {
      if(!context) {
        const AudioContext=root.AudioContext||root.webkitAudioContext;if(!AudioContext)return;
        context=new AudioContext();master=context.createGain();music=context.createGain();effects=context.createGain();compressor=context.createDynamicsCompressor();
        master.gain.value=0;music.gain.value=0;effects.gain.value=0;
        compressor.threshold.value=-14;compressor.knee.value=20;compressor.ratio.value=2;compressor.attack.value=.025;compressor.release.value=.2;
        music.connect(master);effects.connect(master);master.connect(compressor);compressor.connect(context.destination);
        wave=context.createPeriodicWave(new Float32Array([0,0,0,0,0,0]),new Float32Array([0,1,.18,.07,.025,.01]));
        nextBeat=context.currentTime+.12;
      }
      update(settings);
      if(context.state==='suspended')context.resume().then(schedule).catch(()=>{});else schedule();
    } catch (_) { /* Audio is optional. Never interrupt a puzzle. */ }
  }
  function effect(kind,settings) {
    if(settings.muted||settings.effectsVolume===0)return;
    resume(settings);if(!context)return;
    try {
      const now=context.currentTime+.015;
      if(kind==='solved'){[74,81,86].forEach((n,k)=>voice(effects,n,now+k*.13,.23-k*.035,2.5));return;}
      if(kind==='tap'){voice(effects,69,now,.22,.28);return;}
      const length=Math.floor(context.sampleRate*.17),buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*.65;
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      source.buffer=buffer;filter.type='lowpass';filter.frequency.value=2100;
      source.connect(filter);filter.connect(gain);gain.connect(effects);
      gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.28,now+.025);gain.gain.exponentialRampToValueAtTime(.001,now+.17);
      source.start(now);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    } catch (_) { /* A sound must never block input or saving. */ }
  }
  function visibility(value){visible=value;update(preferences);}
  root.FoldAudio={resume,update,effect,visibility};
})(globalThis);
