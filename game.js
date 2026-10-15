import * as THREE from './lib/three.module.js';
/* BAYOU REQUIEM — Gothic Marxist survival, Nouvelle-Orleans 1666. Part 1: core, audio, data, world. */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const choice=a=>a[Math.floor(Math.random()*a.length)];
const dist2=(ax,az,bx,bz)=>{const dx=ax-bx,dz=az-bz;return Math.sqrt(dx*dx+dz*dz);};
const fmtT=h=>{const H=Math.floor(h),M=Math.floor((h-H)*60);return String(H).padStart(2,'0')+':'+String(M).padStart(2,'0');};

/* ============ AUDIO: procedural dark score + sfx ============ */
const AudioSys={ctx:null,master:null,musicGain:null,mode:'menu',step:0,timer:null,muted:false,
init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
 this.master=this.ctx.createGain();this.master.gain.value=.7;this.master.connect(this.ctx.destination);
 this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.34;this.musicGain.connect(this.master);
 /* tube amp warmth */
 this.tube=this.ctx.createWaveShaper();const curve=new Float32Array(256);for(let i=0;i<256;i++){const v=i/255*2-1;curve[i]=Math.tanh(2.4*v);}this.tube.curve=curve;
 const tl=this.ctx.createBiquadFilter();tl.type='lowpass';tl.frequency.value=3600;this.tube.connect(tl);tl.connect(this.musicGain);
 this.dry=this.ctx.createGain();this.dry.gain.value=0.8;this.dry.connect(this.musicGain);
 /* analog delay: dark echo */
 this.dly=this.ctx.createDelay(1.5);this.dly.delayTime.value=0.38;const fb=this.ctx.createGain();fb.gain.value=0.42;
 const dl=this.ctx.createBiquadFilter();dl.type='lowpass';dl.frequency.value=1500;
 this.dly.connect(fb);fb.connect(dl);dl.connect(this.dly);
 const wet=this.ctx.createGain();wet.gain.value=0.5;this.dly.connect(wet);wet.connect(this.musicGain);
 this.loop();},
toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.7;$('music-state').textContent=this.muted?'OFF':'ON';return !this.muted;},
scales:{menu:[110,130.8,164.8,196,246.9,293.7],day:[146.8,164.8,174.6,196,220,246.9,293.7],night:[82.4,87.3,110,123.5,138.6,164.8],combat:[98,103.8,138.6,146.8,196,207.6],chapel:[130.8,146.8,164.8,196,220,261.6]},
loop(){if(this.timer)clearInterval(this.timer);const M=(this.modes&&this.modes[this.mode])||{bpm:72};this.timer=setInterval(()=>this.tick(),Math.max(60,Math.round(60000/M.bpm/2)));},
setMode(m){if(this.mode===m||!this.modes)return;this.mode=m;this.loop();},
/* 16-Horsepower-style songbook: minor keys, train beats, banjo rolls, reeds */
modes:{
 menu:{bpm:80,drum:'brush',banjo:true,bass:[55,55,65.41,49],chords:[[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[146.83,196,246.94]]},
 day:{bpm:96,drum:'train',banjo:true,bass:[55,65.41,49,58.27],chords:[[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[164.81,196,246.94]]},
 night:{bpm:66,drum:'dirge',banjo:false,reed:true,bass:[41.2,41.2,49,38.89],chords:[[110,130.81,164.81],[98,123.47,146.83],[87.31,110,138.59]]},
 combat:{bpm:132,drum:'war',banjo:true,bass:[55,55,58.27,65.41],chords:[[220,261.63,311.13],[196,233.08,293.66]]},
 chapel:{bpm:60,drum:'none',banjo:false,reed:true,bass:[65.41,49,58.27,65.41],chords:[[261.63,329.63,392],[293.66,349.23,440],[329.63,415.3,493.88]]}},
noiseBuf(){if(this._nb)return this._nb;const c=this.ctx,b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this._nb=b;return b;},
ks(freq,dur,bright,vol){const c=this.ctx,t=c.currentTime;const N=Math.max(8,Math.round(c.sampleRate/freq));
 const b=c.createBuffer(1,N,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<N;i++)d[i]=(Math.random()*2-1)*(1-i/N*0.3);
 const src=c.createBufferSource();src.buffer=b;src.loop=true;
 const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=1.2;
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=bright||2500;
 const g=c.createGain();g.gain.setValueAtTime(vol||0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
 const send=c.createGain();send.gain.value=0.5;
 src.connect(bp);bp.connect(lp);lp.connect(g);g.connect(this.tube);g.connect(this.dry);lp.connect(send);send.connect(this.dly);
 src.start(t);src.stop(t+dur+0.05);},
bassN(freq,dur,vol){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain();
 o.type='triangle';o.frequency.value=freq;o2.type='sine';o2.frequency.value=freq/2;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
 o.connect(g);o2.connect(g);g.connect(this.tube);o.start(t);o.stop(t+dur+0.05);o2.start(t);o2.stop(t+dur+0.05);},
reedN(chord,dur,vol){const c=this.ctx,t=c.currentTime,g=c.createGain();
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+1.1);g.gain.linearRampToValueAtTime(0.0001,t+dur);
 const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=5.2;lg.gain.value=7;lfo.connect(lg);
 chord.forEach(f=>{[0.997,1.003].forEach(dt=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;lg.connect(o.detune);o.connect(g);o.start(t);o.stop(t+dur+0.05);});});
 lfo.start(t);lfo.stop(t+dur+0.05);
 const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;g.connect(lp);lp.connect(this.dly);lp.connect(this.dry);},
fade(to,dur,done){const c=this.ctx;if(!c||!this.musicGain)return;try{const g=this.musicGain.gain,t=c.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(Math.max(0.0001,g.value),t);g.linearRampToValueAtTime(Math.max(0.0001,to),t+dur);if(done)setTimeout(done,dur*1000+60);}catch(e){if(done)done();}},
setVol(v){this.vol=v;const g=this.musicGain&&this.musicGain.gain,c=this.ctx;if(!g||!c)return;try{const t=c.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(Math.max(0.0001,g.value),t);g.linearRampToValueAtTime(Math.max(0.0001,v*0.6),t+0.4);}catch(e){}},
kick(v){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(38,t+0.22);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.connect(g);g.connect(this.dry);o.start(t);o.stop(t+0.32);},
snare(v){const c=this.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=this.noiseBuf();const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=1600;const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);s.connect(f);f.connect(g);g.connect(this.dry);s.start(t);s.stop(t+0.2);
 const o=c.createOscillator(),g2=c.createGain();o.type='triangle';o.frequency.value=190;g2.gain.setValueAtTime(v*0.6,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.connect(g2);g2.connect(this.dry);o.start(t);o.stop(t+0.12);},
tom(v){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(52,t+0.25);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.connect(g);g.connect(this.dry);o.start(t);o.stop(t+0.32);},
tick2(v){const c=this.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=this.noiseBuf();s.playbackRate.value=1.7;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=6000;const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);s.connect(f);f.connect(g);g.connect(this.dry);s.start(t);s.stop(t+0.07);},
tick(){if(!this.ctx||this.muted||!this.modes||(typeof G!=='undefined'&&G.musicHold))return;const c=this.ctx,t=c.currentTime;
 let M=this.modes[this.mode]||this.modes.night,s,bar,ch,root;const stepDur=60/(M.bpm||80)/2;
 if(G.song&&(G.song.cfg||SONGS[G.song.id])){const S=G.song.cfg||SONGS[G.song.id];M=S;s=G.song.steps%8;bar=Math.floor(G.song.steps/8)%S.chords.length;ch=S.chords[bar];root=S.bass[bar%S.bass.length];G.song.steps++;if(--G.song.left<=0){G.song=null;if(G.autoplay&&!G.musicHold)G.songGap=8;}}
 else{s=this.step%8;bar=Math.floor(this.step/8)%M.chords.length;ch=M.chords[bar];root=M.bass[bar%M.bass.length];this.step++;
  if(!G.song&&G.autoplay&&!G.musicHold&&G.started){G.songGap-=stepDur;if(G.songGap<=0){G.songGap=8;autoNext();}}}
 if(s===0||(M.drum==='train'&&s===4)||(M.drum==='war'&&s===6))this.bassN(root,1.6,0.20);
 if(M.drum==='dirge'&&s===0)this.bassN(root/2,3.2,0.22);
 if(M.banjo&&(s%2===0||M.drum==='war'))this.ks(ch[(this.step>>1)%ch.length]*(s%4===2?2:1),M.drum==='war'?0.5:0.9,3200,0.20);
 if((this.mode==='night'||this.mode==='combat'||this.mode==='menu')&&s%3===0)this.ks(root/2,2.2,1400,0.16);
 if((M.reed||this.mode==='night')&&s===0)this.reedN(ch,3.4,0.10);
 const D=M.drum;
 if(D==='train'){if(s===0||s===4)this.kick(0.22);if(s===2||s===6)this.snare(0.14);if(s%2===1)this.tick2(0.05);}
 else if(D==='war'){if(s%2===0)this.kick(0.24);if(s===2||s===6)this.snare(0.18);if(s%2===1)this.tick2(0.07);if(s===4)this.tom(0.16);}
 else if(D==='dirge'){if(s===0)this.kick(0.2);if(s===4)this.tom(0.14);if(s===2||s===6)this.tick2(0.04);}
 else if(D==='brush'){if(s%2===1)this.tick2(0.035);}
 if(s===0&&this.mode!=='combat'){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=root/2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.10,t+0.6);g.gain.linearRampToValueAtTime(0,t+4);o.connect(g);g.connect(this.musicGain);o.start(t);o.stop(t+4.1);}
 if(this.mode==='night'&&this.step%32===0)this.howl();},
drum(){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(38,t+.25);g.gain.setValueAtTime(.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.35);},
howl(){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.linearRampToValueAtTime(880,t+.5);o.frequency.linearRampToValueAtTime(520,t+1.4);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.3);g.gain.linearRampToValueAtTime(0,t+1.6);o.connect(g);g.connect(this.musicGain);o.start(t);o.stop(t+1.7);},
bell(){if(!this.ctx||this.muted)return;const c=this.ctx,t=c.currentTime;[523,392,659].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.12,t+i*.5);g.gain.exponentialRampToValueAtTime(.0001,t+i*.5+2);o.connect(g);g.connect(this.master);o.start(t+i*.5);o.stop(t+i*.5+2.1);});},
sfx(n){if(!this.ctx||this.muted)return;const c=this.ctx,t=c.currentTime;
 const mk=(type,f0,f1,dur,vol)=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);};
 const nz=(dur,vol,ff)=>{const b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=ff||1200;const g=c.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(this.master);s.start(t);};
 if(n==='swing')nz(.15,.25,2500);else if(n==='hit'){mk('square',180,60,.18,.2);nz(.12,.2,900);}else if(n==='shot'){nz(.5,.5,4000);mk('sine',150,30,.4,.4);}else if(n==='hurt')mk('sawtooth',300,90,.3,.25);else if(n==='pickup')mk('sine',500,900,.12,.15);else if(n==='eat'){nz(.2,.2,800);mk('sine',200,350,.15,.12);}else if(n==='quest'){mk('sine',523,523,.15,.15);setTimeout(()=>mk('sine',659,659,.2,.15),140);}else if(n==='gold')mk('sine',880,1320,.15,.14);else if(n==='craft'){nz(.2,.2,1500);mk('sine',300,500,.2,.15);}else if(n==='pray')mk('sine',261,523,.8,.12);else if(n==='wolf')this.howl();else nz(.1,.15,2000);}
};

/* ============ DATA ============ */
const ITEMS={
 bread:{n:'Black bread',e:'🍞',d:'Rye loaf, gritty with mill-stone. +28 hunger.',use:'eat',hunger:28,price:3},
 stew:{n:'Bayou stew',e:'🍲',d:'Crayfish, okra, pepper. +48 hunger, +8 HP.',use:'eat',hunger:48,hp:8,price:8},
 herb:{n:'Wormwood & mugwort',e:'🌿',d:'Bitter medicine. Cures bite fever, +10 HP.',use:'heal',hp:10,cure:true,price:5},
 bandage:{n:'Linen bandage',e:'🩹',d:'Clean rag, boiled. +25 HP.',use:'heal',hp:25,price:6},
 tonic:{n:'Manon’s tonic',e:'🧪',d:'Fever-breaker. +40 HP, clears infection.',use:'heal',hp:40,cure:true,price:14},
 torch:{n:'Pine torch',e:'🔥',d:'Light + ward. Equip to hold back apparitions.',use:'equip',dmg:4,price:4},
 rapier:{n:'Smallsword',e:'🗡',d:'Gentleman’s blade, quick. dmg 14.',use:'equip',dmg:14,price:25},
 axe:{n:'Splitting axe',e:'🪓',d:'Woodsman’s axe. dmg 18, slow.',use:'equip',dmg:18,price:22},
 musket:{n:'Flintlock musket',e:'🔫',d:'Heavy, loud, holy at range. dmg 55. Needs powder&ball.',use:'equip',dmg:55,ranged:true,price:70},
 ammo:{n:'Powder & ball',e:'🧨',d:'A paper cartridge. 1 shot.',price:3},
 bible:{n:'Geneva bible',e:'📖',d:'Blessed steel companion. +dmg vs apparitions/vampires. Equip in pocket (passive).',use:'bless',price:18},
 silver:{n:'Silver dirk',e:'🔪',d:'Church silver. dmg 12, ×3 vs Loup-Garou.',use:'equip',dmg:12,silver:true,price:30},
 plank:{n:'Cypress plank',e:'🪵',d:'Barricade & craft material.',price:2},
 nail:{n:'Hand-forged nail',e:'📌',d:'Smith’s work. Craft material.',price:2},
 barricade:{n:'Barricade bundle',e:'🚧',d:'Pre-cut planks, braces, spite. Use to raise a barricade that holds the dead (E mends, E tears down).',use:'place',price:5},
 canoe:{n:'Dugout canoe',e:'🛶',d:'Cypress pirogue, adzed from one stubborn log. Use near water to launch; E boards and beaches.',use:'launch',price:25},
 fists:{n:'Bare fists',e:'✊',d:'Irish diplomacy. Fast, weak, honest. Raise with G.',use:'equip',dmg:6,price:0},
 charcoal:{n:'Charcoal',e:'⬛',d:'Pit-burned cypress. Powder ingredient.',price:1},
 niter:{n:'Saltpetre',e:'🧂',d:'Scraped from the stye walls. Powder ingredient.',price:3},
 blackpowder:{n:'Black powder',e:'🧨',d:'Serpentine, hand-mixed. Horns of it win arguments.',price:6},
 grenado:{n:'Grenado',e:'💣',d:'Nails and powder in a clay ball. Use: throw at the nearest horror (boom, mind the splash).',use:'bomb',price:16},
 keg:{n:'Powder keg',e:'🛢',d:'A quarter-barrel of persuasion. Use: set it down; E lights the fuse. RUN.',use:'keg',price:30},
 blunderbuss:{n:'Blunderbuss',e:'📯',d:'Thunder’s own trumpet. Spreads shot over everything ahead. dmg 30 × all. 2 cartridges a blast.',use:'equip',dmg:30,ranged:true,spread:true,price:90},
 cudgel:{n:'Oak cudgel',e:'🏏',d:'A chair-leg of justice. dmg 10, very fast.',use:'equip',dmg:10,price:6},
 spear:{n:'Boar spear',e:'🔱',d:'Militia pike, fire-hardened. dmg 16.',use:'equip',dmg:16,price:18},
 powder_herb:{n:'Brimstone',e:'🧂',d:'Sulphur for cartridges.',price:4},
 coin:{n:'Livre tournois',e:'🪙',d:'The Seigneur’s coin. Spends everywhere, forgives nothing.',price:1},
 rosary:{n:'Bog-oak rosary',e:'📿',d:'Quest relic. Smells of rain.',price:0,quest:true},
 pelt:{n:'Wolf pelt',e:'🦴',d:'Proof of a loup slain. Bounty pays.',price:9},
 fang:{n:'Vampire fang',e:'🦷',d:'Ivory needle. Alchemists & priests pay.',price:15},
 ash:{n:'Consecrated ash',e:'⚱',d:'Burnt demon-stain. Seals rifts.',price:12},
 deed:{n:'Torn indenture',e:'📜',d:'Someone’s debt, signed in another’s hand.',price:0,quest:true},
 /* --- wild foods & game: October 1666, the commons provide --- */
 pecan:{n:'Pecans',e:'🌰',d:'October-ripe, rich as butter. +14 hunger.',use:'eat',hunger:14,price:2},
 persimmon:{n:'Persimmon',e:'🍑',d:'Dead-ripe after first frost, honeyed. +16 hunger.',use:'eat',hunger:16,price:2},
 muscadine:{n:'Muscadines',e:'🍇',d:'Wild grapes, thick-skinned, September-October. +12 hunger.',use:'eat',hunger:12,price:2},
 pawpaw:{n:'Pawpaw',e:'🥭',d:'Custard of the understory, brief season. +18 hunger.',use:'eat',hunger:18,price:3},
 acorn:{n:'Acorns (leached)',e:'🌰',d:'Bitter unless leached; the Houma know how. +8 hunger.',use:'eat',hunger:8,price:1},
 hickory:{n:'Hickory nuts',e:'🌰',d:'Sweet mast of the fall woods. +14 hunger.',use:'eat',hunger:14,price:2},
 sassafras:{n:'Sassafras root',e:'🫚',d:'Root-tea bark, warming. +4 hunger, +4 HP.',use:'eat',hunger:4,hp:4,price:3},
 yaupon:{n:'Yaupon leaves',e:'🍃',d:'Cassina — the only caffeinated leaf in the woods. Chew for +4 hunger, +12 reason.',use:'eat',hunger:4,price:2},
 onion:{n:'Wild onion',e:'🧅',d:'Ramps of the meadow. +8 hunger.',use:'eat',hunger:8,price:2},
 groundnut:{n:'Groundnuts',e:'🥔',d:'Apios tubers the Choctaw dig in fall. +16 hunger.',use:'eat',hunger:16,price:3},
 cattail:{n:'Cattail root',e:'🌾',d:'Flour from the shallows. +12 hunger.',use:'eat',hunger:12,price:2},
 maypop:{n:'Maypops',e:'🍈',d:'Wild passionfruit, wrinkled-ripe in fall. +14 hunger.',use:'eat',hunger:14,price:2},
 crawfish:{n:'Crawfish',e:'🦞',d:'Boiled in the shell over a fire. +20 hunger.',use:'eat',hunger:20,price:4},
 catfish:{n:'Catfish',e:'🐟',d:'Whiskered mud-glutton. +26 hunger.',use:'eat',hunger:26,price:5},
 venison:{n:'Venison',e:'🍖',d:'Fall-fat deer. +30 hunger.',use:'eat',hunger:30,price:6},
 rabbit:{n:'Rabbit',e:'🐇',d:'Cottontail, snared at dawn. +18 hunger.',use:'eat',hunger:18,price:4},
 turkey:{n:'Wild turkey',e:'🦃',d:'Fall-flocked and foolish. +24 hunger.',use:'eat',hunger:24,price:5},
 duck:{n:'Duck',e:'🦆',d:'Bayou mallard. +20 hunger.',use:'eat',hunger:20,price:5},
 squirrel:{n:'Squirrel',e:'🐿',d:'Gray squirrel. +12 hunger.',use:'eat',hunger:12,price:3},
 gator:{n:'Gator tail',e:'🐊',d:'Tastes of chicken and bad decisions. +28 hunger.',use:'eat',hunger:28,price:7},
 froglegs:{n:'Frog legs',e:'🐸',d:'Gigged at night, fried by morning. +16 hunger.',use:'eat',hunger:16,price:4},
 turtle:{n:'Turtle meat',e:'🐢',d:'Snapper or box — seven meats in one. +22 hunger.',use:'eat',hunger:22,price:5},
 pork:{n:'Feral pork',e:'🐗',d:'Spanish stock gone wild and mean. +26 hunger.',use:'eat',hunger:26,price:5},
 bearmeat:{n:'Bear meat',e:'🐻',d:'The old man of the canebrake. +34 hunger.',use:'eat',hunger:34,price:8},
 snakemeat:{n:'Cottonmouth (dressed)',e:'🐍',d:'Venom sacs removed, mostly. +18 hunger.',use:'eat',hunger:18,price:4},
 venom:{n:'Venom sac',e:'☠',d:'Moccasin venom. Poison — or, doctored, cure.',price:6},
 coon:{n:'Raccoon',e:'🦝',d:'Night-bandit, greasy and sweet. +16 hunger.',use:'eat',hunger:16,price:3},
 possum:{n:'Opossum',e:'🐀',d:'Played dead; lost the argument. +14 hunger.',use:'eat',hunger:14,price:3},
 bone:{n:'Old bones',e:'☠',d:'Levy-issue, long discharged. Apothecaries and priests pay.',price:2},
 locket:{n:'Silver locket',e:'💠',d:'Miniature portraits inside — Odette’s mother, unmistakably. Quest relic.',price:0,quest:true},
 /* --- cookery: evolved parish dishes, all botanically local --- */
 gumbo:{n:'Bayou gumbo',e:'🍲',d:'Crawfish, onion, sassafras, patience. +55 hunger, +4 reason.',use:'eat',hunger:55,sanity:4,price:12},
 pudding:{n:'Persimmon pudding',e:'🍮',d:'Baked in coals, honeyed by frost. +40 hunger.',use:'eat',hunger:40,price:8},
 smoked:{n:'Smoked venison',e:'🥩',d:'Hickory-smoked; keeps the wolves philosophical. +45 hunger.',use:'eat',hunger:45,price:10},
 fricassee:{n:'Frog fricassee',e:'🍛',d:'Legs in wine with onion. +42 hunger.',use:'eat',hunger:42,price:9},
 soup:{n:'Turtle soup',e:'🍵',d:'Seven meats, one pot. +48 hunger, +8 HP.',use:'eat',hunger:48,hp:8,price:11},
 mash:{n:'Pawpaw mash',e:'🥣',d:'Custard fruit beaten with nuts. +38 hunger.',use:'eat',hunger:38,price:7},
 cakes:{n:'Cattail cakes',e:'🥞',d:'Root flour, griddle-crisped. +36 hunger.',use:'eat',hunger:36,price:7},
 hotpot:{n:'Hunter’s pot',e:'🍲',d:'Venison, groundnut, onion, all day. +60 hunger, +5 HP.',use:'eat',hunger:60,hp:5,price:14},
 tea:{n:'Yaupon tea',e:'🍵',d:'The black drink, cassina-strong. +4 hunger, +20 reason.',use:'drink',hunger:4,sanity:20,price:6},
 brew:{n:'Sassafras brew',e:'🍺',d:'Root beer of the woods. +10 hunger, +10 reason.',use:'drink',hunger:10,sanity:10,price:6},
 mix:{n:'Trail mix',e:'🥜',d:'Hickory, maypop, pecan. +30 hunger.',use:'eat',hunger:30,price:6},
 smothered:{n:'Smothered gator',e:'🍖',d:'Low and slow with onion and crawfish. +65 hunger, +5 HP.',use:'eat',hunger:65,hp:5,price:16},
 wine:{n:'Claret',e:'🍷',d:'French wine, cellared through the crossing. +6 hunger, +12 reason.',use:'drink',hunger:6,sanity:12,price:6},
 tafia:{n:'Tafia',e:'🥃',d:'Raw cane spirit. Burns clean through grief. +2 hunger, +18 reason, −5 HP.',use:'drink',hunger:2,sanity:18,hp:-5,price:8},
 tobacco:{n:'Pipe tobacco',e:'🚬',d:'Virginia leaf. Smoke a bowl and watch the mist. +10 reason, −2 HP.',use:'smoke',sanity:10,hp:-2,price:3},
 candle:{n:'Tallow candle',e:'🕯',d:'Light for altars, vigils, and the Loa’s attention. Burned in ritual.',price:2},
 grisgris:{n:'Gris-gris bag',e:'🧿',d:'Red flannel, root, bone, verse. Carry it: +20 max spirit. Manon’s own recipe.',use:'charm',price:12},
};
const RECIPES=[
 {id:'bandage',n:'Linen bandage',need:{plank:0,herb:1},make:{bandage:1},txt:'herb → bandage (+25 HP)'},
 {id:'torch',n:'Pine torch',need:{plank:2},make:{torch:1},txt:'2 plank → torch'},
 {id:'plankwall',n:'Barricade bundle',need:{plank:4,nail:2},make:{barricade:1},heal:10,txt:'4 plank + 2 nail → 1 placeable barricade (holds the dead; carpenter tier toughens it)'},
 {id:'ammo',n:'Powder & ball ×3',need:{powder_herb:1,plank:1},make:{ammo:3},txt:'1 brimstone + 1 plank → 3 cartridges'},
 {id:'tonic',n:'Fever tonic',need:{herb:2,powder_herb:0},make:{tonic:1},txt:'2 herbs → tonic (cures bite)'},
 {id:'silver',n:'Bless silver dirk',need:{bible:0},make:{silver:1},cost:20,txt:'blessing + 20 livres → silver dirk (loup-slayer)'},
 {id:'hstew',n:"Hunter's stew",need:{venison:1,onion:1},make:{stew:2},txt:'1 venison + 1 wild onion → 2 bayou stew'},
 {id:'trail',n:'Trail bread',need:{pecan:1,persimmon:1},make:{bread:2},txt:'pecan + persimmon → 2 travel bread'},
 {id:'snakeoil',n:'Snake-oil cure',need:{venom:1,sassafras:1},make:{tonic:1},txt:'1 venom sac + 1 sassafras → 1 fever tonic (the one honest cure)'},
 {id:'dugout',n:'Dugout canoe',need:{plank:6,nail:2},make:{canoe:1},txt:'6 plank + 2 nail → 1 launchable canoe (fast on water, drag on land)'},
 {id:'cudgel',n:'Oak cudgel',need:{plank:1},make:{cudgel:1},txt:'1 plank → cudgel (fast blunt)'},
 {id:'spear',n:'Boar spear',need:{plank:2,nail:1},make:{spear:1},txt:'2 plank + 1 nail → boar spear'},
 {id:'char',cat:'field',n:'Charcoal',need:{plank:2},make:{charcoal:3},txt:'2 plank → 3 charcoal (pit-burned)'},
 {id:'powder',cat:'field',n:'Black powder ×2',need:{charcoal:1,powder_herb:1,niter:1},make:{blackpowder:2},txt:'charcoal + brimstone + nitre → 2 powder'},
 {id:'grenado',cat:'field',n:'Grenado',need:{blackpowder:2,nail:2},make:{grenado:1},txt:'2 powder + 2 nails → 1 grenado (throwable)'},
 {id:'kegmake',cat:'field',n:'Powder keg',need:{blackpowder:4,plank:2},make:{keg:1},txt:'4 powder + 2 plank → 1 powder keg (placeable, E to light)'},
 {id:'grisgris',n:'Gris-gris bag',need:{herb:1,candle:1},make:{grisgris:1},cost:5,txt:'herb + candle + 5 livres → gris-gris (+20 max spirit, carry it)'},
 {id:'gumbo',cat:'cook',cookTier:1,fire:1,n:'Bayou gumbo',need:{crawfish:1,onion:1,sassafras:1},make:{gumbo:1},txt:'crawfish + onion + sassafras → gumbo (fire, apprentice cook)'},
 {id:'pudding',cat:'cook',fire:1,n:'Persimmon pudding',need:{persimmon:2,acorn:1},make:{pudding:1},txt:'2 persimmon + acorn → pudding (fire)'},
 {id:'smoked',cat:'cook',cookTier:1,fire:1,n:'Smoked venison',need:{venison:1,hickory:1},make:{smoked:1},txt:'venison + hickory → smoked (fire, apprentice)'},
 {id:'fricassee',cat:'cook',fire:1,n:'Frog fricassee',need:{froglegs:1,onion:1,wine:1},make:{fricassee:1},txt:'frog legs + onion + wine → fricassee (fire)'},
 {id:'soup',cat:'cook',cookTier:1,fire:1,n:'Turtle soup',need:{turtle:1,onion:1,herb:1},make:{soup:1},txt:'turtle + onion + herb → soup (fire, apprentice)'},
 {id:'mash',cat:'cook',n:'Pawpaw mash',need:{pawpaw:1,muscadine:1,pecan:1},make:{mash:1},txt:'pawpaw + muscadine + pecan → mash (no fire)'},
 {id:'cakes',cat:'cook',fire:1,n:'Cattail cakes',need:{cattail:2,groundnut:1},make:{cakes:1},txt:'2 cattail + groundnut → cakes (fire)'},
 {id:'hotpot',cat:'cook',cookTier:2,fire:1,n:'Hunter’s pot',need:{venison:1,groundnut:1,onion:1},make:{hotpot:1},txt:'venison + groundnut + onion → pot (fire, journeyman)'},
 {id:'tea',cat:'cook',fire:1,n:'Yaupon tea',need:{yaupon:2},make:{tea:1},txt:'2 yaupon → tea (fire, +20 reason)'},
 {id:'brew',cat:'cook',fire:1,n:'Sassafras brew',need:{sassafras:1,muscadine:1},make:{brew:1},txt:'sassafras + muscadine → brew (fire)'},
 {id:'mix',cat:'cook',n:'Trail mix',need:{hickory:1,maypop:1,pecan:1},make:{mix:1},txt:'hickory + maypop + pecan → mix (no fire)'},
 {id:'smothered',cat:'cook',cookTier:2,fire:1,n:'Smothered gator',need:{gator:1,onion:1,crawfish:1},make:{smothered:1},txt:'gator + onion + crawfish → smothered (fire, journeyman)'},
];
const ZONES=[
 {id:'palisade',n:'The Palisade',x:0,z:0,r:58},{id:'manor',n:'Seigneur’s Manor',x:0,z:-46,r:16},
 {id:'chapel',n:'Chapel of St. Mud',x:-34,z:-12,r:14},{id:'market',n:'Market Row',x:14,z:-6,r:16},
 {id:'smith',n:'Smithy',x:26,z:-20,r:12},{id:'herb',n:'Herbalist Hut',x:-16,z:26,r:12},
 {id:'cabins',n:'Indenture Cabins',x:20,z:28,r:18},{id:'cemetery',n:'Cemetery of the Unpaid',x:-70,z:8,r:20},
 {id:'swamp',n:'The Drowned Swamp',x:10,z:80,r:34},{id:'ruins',n:'Ruined Mission',x:78,z:20,r:20},
 {id:'gallows',n:'Gallows Oak',x:-8,z:-34,r:10}, {id:'bayou',n:'Bayou Landing',x:-52,z:52,r:18},
 {id:'forestmanor',n:'Maison Lament',x:88,z:-38,r:20},
 {id:'pigstye',n:'Jean-Luc’s Pigstye',x:-38,z:-40,r:12},
 {id:'tavern',n:'L’Ancre Noyée',x:34,z:-8,r:12},
];
const NPC_DEFS=[
 {id:'anselme',n:'Père Anselme',role:'priest of the unconsecrated chapel',e:'☩',x:-30,z:-10,c:0x1a1a1a,d:'A Jesuit who lost his breviary and found a ledger. Buries the poor for free; dreads the Seigneur’s pew.'},
 {id:'manon',n:'Citoyenne Manon',role:'herbalist, maroon-wise',e:'🌿',x:-14,z:24,c:0x2e5a2e,d:'Free black woman, cunning with fever and root. The swamp taught her what Paris forbade.'},
 {id:'baptiste',n:'Forgeron Baptiste',role:'blacksmith · arms & irons',e:'⚒',x:26,z:-18,c:0x6e4a26,d:'Hammers horseshoes by day, files musket balls by night. Hates the tithe on iron.'},
 {id:'odette',n:'Veuve Odette',role:'widow, keeper of debts',e:'🧵',x:18,z:26,c:0x5a3a5a,d:'Three husbands buried, two to fever, one to the Seigneur’s arithmetic. Remembers every loaf lent.'},
 {id:'jean',n:'Jean-Baptiste',role:'maroon guide of the bayou',e:'🐊',x:-48,z:48,c:0x3a5a5a,d:'Ran from the cane fields and learned the water. Will guide those who respect the swamp.'},
 {id:'seamus',n:'Seamus the Bound',role:'indentured Irishman',e:'⛏',x:22,z:30,c:0x7a6a4a,d:'Seven years for stealing bread that was already his. Counts the days in notches.'},
 {id:'taxman',n:'Huissier Poulain',role:'the Seigneur’s taxman',e:'💰',x:2,z:-40,c:0x2a3a7a,d:'Powdered wig, ink-stained fingers. Collects in coin what cannot be collected in souls.'},
 {id:'doctor',n:'Chirurgien Fauche',role:'barber-surgeon',e:'🩸',x:12,z:-4,c:0x7a2a2a,d:'Bleeds patients and purses alike. Knows anatomy; learning mercy.'},
 {id:'lucile',n:'Lucile, child-runner',role:'messenger, 11 years old',e:'🧒',x:10,z:2,c:0xa08a3a,d:'Swift as rumour. Carries letters, warnings, and other people’s secrets.'},
 {id:'seraphine',n:'Dame Séraphine',role:'lady of the evening, licensed by hunger',e:'💋',x:17,z:-3,c:0x8a2a4a,d:'Powder, patch, and a patience the priests envy. Sells company, conversation, and the only honest forgetfulness in the parish.'},
 {id:'pelle',n:'Pelle the Digger',role:'gravedigger, union-dead liaison',e:'⛏',x:-64,z:6,c:0x4a4a4a,d:'Digs by day, listens by night. “The quiet ones tip best: information. The cemetery is the parish archive — every plot a page, every stone a signature.”'},
 {id:'jeanluc',n:'Jean-Luc Porcher',role:'pig farmer, widower-ish',e:'🐷',x:-36,z:-38,c:0x7a5a3a,d:'Smells of mast and heartbreak. Three days back his wife Babette went maypop-picking and never came home — or so he says with the particular grief of a man checking over his shoulder.'},
 {id:'mama',n:'Mama Tambour',role:'keeper of L’Ancre Noyée',e:'🍺',x:34,z:-10,c:0x8a5a2a,d:'Broad as the bar and twice as solid. Rents bunks, pours tafia, buries secrets. “Sleep here, eat here, confess here — same price.”'},
 {id:'nine',n:'Nine-Fingers',role:'trader in unasked questions',e:'🤫',x:37,z:-5,c:0x3a3a3a,d:'Counts to nine and stops, smiling. Sells powder, shot, and things that fell off a cart. No receipts, no memories.'},
 {id:'celestin',n:'Fiddler Célestin',role:'musician, mostly sober',e:'🎻',x:32,z:-6,c:0x5a3a5a,d:'His fiddle survived three shipwrecks and one marriage. Tips in coin or tafia; pays in songs.'},
 {id:'eustache',n:'Eustache the Ear',role:'hearer of things',e:'👂',x:35,z:-9,c:0x4a4a4a,d:'Knows who buried what, where, and how deep. Sells it by the sentence. The Seigneur’s men pay him too — everybody’s ear, nobody’s friend.'},
];
const FOE_DEFS={
 risen:{n:'The Risen',e:'🧟',hp:45,dmg:10,spd:2.2,xp:1,col:0x5a6a4a,txt:'Plague-dead in grave linen. They rise where wages were withheld.'},
 wolf:{n:'Loup-Garou',e:'🐺',hp:90,dmg:18,spd:5.2,xp:3,col:0x3a3a3a,txt:'A neighbour by day. By moon, a reckoning with teeth. Silver & fire.'},
 ghost:{n:'Apparition',e:'👻',hp:60,dmg:12,spd:3.0,xp:3,col:0x9ab0ff,txt:'Unpaid grief, semi-transparent. Drains reason. Blessed steel & lantern burn it.'},
 vamp:{n:'Sang-Mêlé',e:'🧛',hp:140,dmg:22,spd:4.4,xp:5,col:0x6a1a2e,txt:'Old-world hunger in a brocade coat. Parleys at dusk; ash at dawn.'},
 demon:{n:'Bête de l’Abîme',e:'😈',hp:520,dmg:30,spd:3.4,xp:25,col:0x8a1a00,txt:'The drained swamp’s interest, compounded. Boss of the Leveling Night.'},
 skeleton:{n:'Hollow Levy',e:'💀',hp:55,dmg:12,spd:3.0,xp:2,col:0xe6dcc0,txt:'The Seigneur’s old wars, buried in formation and raised in formation. They still take orders — from the mud.'},
};
const QUESTS=[
 {id:'q_bread',n:'Bread for the Bound',giver:'seamus',chain:'main',karma:8,desc:'Seamus the Bound has eaten Seigneur’s promises for a week. Bring him 2 bread. The pamphlet says: from each according to hunger.',obj:[{t:'collect',item:'bread',n:2,label:'black bread'}],rw:{coin:6,karma:8}},
 {id:'q_rosary',n:'The Bog-Oak Rosary',giver:'odette',chain:'side',karma:6,desc:'The Widow Odette lost her mother’s rosary near the cemetery. The dead, she says, are better neighbours than the living — but she wants it back.',obj:[{t:'collect',item:'rosary',n:1,label:'bog-oak rosary'}],rw:{coin:10,tonic:1,karma:6}},
 {id:'q_herbs',n:'Wormwood Tithe',giver:'manon',chain:'side',karma:6,desc:'Manon needs 3 herbs from the swamp edge to brew fever tea for the cabins. “The Seigneur taxes iron. He cannot tax weeds.”',obj:[{t:'collect',item:'herb',n:3,label:'herbs'}],rw:{tonic:2,karma:6}},
 {id:'q_iron',n:'Iron Against Night',giver:'baptiste',chain:'side',karma:5,desc:'The smith needs 3 planks and 2 nails to bar the chapel door before the bell tolls thirteen.',obj:[{t:'collect',item:'plank',n:3,label:'planks'},{t:'collect',item:'nail',n:2,label:'nails'}],rw:{rapier:0,ammo:4,karma:5}},
 {id:'q_dead',n:'Bury the Unpaid',giver:'anselme',chain:'main',karma:10,desc:'Three paupers lie unburied by the cemetery; the Seigneur charges 5 livres a grave. Bury them yourself: find 3 shallow graves (E) in the cemetery.',obj:[{t:'bury',n:3,label:'paupers buried'}],rw:{bible:1,karma:10}},
 {id:'q_guide',n:'Water Knows the Way',giver:'jean',chain:'side',karma:6,desc:'Jean-Baptiste will mark the swamp paths if you walk them: visit the Bayou Landing, the Drowned Swamp heart, and the Ruined Mission.',obj:[{t:'visit',zone:'bayou',label:'Bayou Landing'},{t:'visit',zone:'swamp',label:'Drowned Swamp'},{t:'visit',zone:'ruins',label:'Ruined Mission'}],rw:{stew:2,coin:8,karma:6}},
 {id:'q_wolf',n:'Teeth of the Moon',giver:'lucile',chain:'side',karma:8,desc:'Lucile saw her cousin change under the full moon. Bring 2 wolf pelts — proof — and she will tell you whose roof he sleeps under.',obj:[{t:'kill',foe:'wolf',n:2,label:'loups slain'}],rw:{silver:1,coin:12,karma:8}},
 {id:'q_ghost',n:'The Bell Tolls Thirteen',giver:'anselme',chain:'main',karma:10,desc:'Apparitions infest the chapel yard. Banish 3 with blessed steel or torch-light, then ring the chapel bell (E at the chapel).',obj:[{t:'kill',foe:'ghost',n:3,label:'apparitions banished'}],rw:{coin:14,karma:10}},
 {id:'q_tax',n:'The Tithe of Blood',giver:'odette',chain:'main',karma:12,desc:'Huissier Poulain demands 30 livres from the cabins by sundown — or takes Seamus instead. Either pay him, or drive him off (talk, then choose). Gold or iron decides.',obj:[{t:'tax',n:1,label:'the tithe, settled'}],rw:{karma:12,coin:10}},
 {id:'q_child',n:'Lost in the Canebrake',giver:'lucile',chain:'side',karma:8,desc:'A child wandered to the gallows oak at dusk and has not returned. Find the small shoe (loot, glowing crate) and bring word back to Lucile.',obj:[{t:'collect',item:'deed',n:1,label:'clue of the lost child'}],rw:{stew:2,karma:8}},
 {id:'q_vamp',n:'An Invitation in Brocade',giver:'doctor',chain:'side',karma:7,desc:'The Chirurgien was invited to sup with the Sang-Mêlé at the Ruined Mission. Refuse for him: confront and destroy the vampire (1) — or parley, at your soul’s peril.',obj:[{t:'kill',foe:'vamp',n:1,label:'sang-mêlé destroyed'}],rw:{fang:0,coin:20,karma:7}},
 {id:'q_ward',n:'Lanterns for the Living',giver:'manon',chain:'side',karma:5,desc:'Craft or carry 2 torches and plant them (E) at the cabin fires so the night shift of gravediggers can see.',obj:[{t:'torch',n:2,label:'lanterns planted'}],rw:{herb:3,karma:5}},
 {id:'q_forage',n:'The Commons Provide',giver:'manon',chain:'side',karma:8,desc:'October, and the unenclosed woods are generous: pecans, muscadines, persimmons, groundnuts — all free to hands that know. Gather 5 wild foods (E at green growth) and take 2 head of game. The Seigneur cannot tithe what he never planted.',obj:[{t:'forage',n:5,label:'wild foods gathered'},{t:'hunt',n:2,label:'game taken'}],rw:{stew:1,coin:8,karma:8}},
 {id:'q_gumbo',n:'A Gumbo for the Commune',giver:'odette',chain:'side',karma:7,desc:'The Widow means to feed the whole cabin row from one pot: 2 frog legs, 2 crawfish, 2 wild onions. “A gumbo is the commune in a kettle — everything in, everybody fed.”',obj:[{t:'collect',item:'froglegs',n:2,label:'frog legs'},{t:'collect',item:'crawfish',n:2,label:'crawfish'},{t:'collect',item:'onion',n:2,label:'wild onions'}],rw:{stew:2,karma:7}},
 {id:'q_teeth',n:'Teeth of the Water',giver:'jean',chain:'side',karma:8,desc:'Gator, snapper, moccasin — the water charges rent in blood. Take 4 head of game anywhere, and Jean will call you square with the bayou. Mind the nests.',obj:[{t:'hunt',n:4,label:'game taken'}],rw:{ammo:4,coin:10,karma:8}},
 {id:'q_w_carpenter',n:'Boards for the Barricade',giver:'baptiste',chain:'side',karma:4,desc:'The chapel door hangs by a prayer. Work 3 shifts at the cabin sawpit (E) and Baptiste will call you chip of his own block.',obj:[{t:'work',job:'carpenter',n:3,label:'carpenter shifts'}],rw:{coin:10,nail:2,karma:4}},
 {id:'q_w_cook',n:'Noon Soup',giver:'odette',chain:'side',karma:5,desc:'The cabin row eats at noon or not at all. Work 3 cook shifts at the market cookfire and nobody calls you stranger again.',obj:[{t:'work',job:'cook',n:3,label:'cook shifts'}],rw:{stew:1,karma:5}},
 {id:'q_w_pirate',n:'Crates Without Names',giver:'seraphine',chain:'side',karma:2,desc:'Certain crates must pass the landing without passing the taxman. Work 2 pirate shifts after dark-ish. Ask no questions; Séraphine will tell you no lies.',obj:[{t:'work',job:'pirate',n:2,label:'smuggling runs'}],rw:{coin:18,karma:2}},
 {id:'q_w_fisher',n:'Supper From the Water',giver:'lucile',chain:'side',karma:6,desc:'Lucile’s family nets are torn and her brothers are small. Work 3 fisherman shifts at the bayou or swamp spots and teach her the knots.',obj:[{t:'work',job:'fisherman',n:3,label:'fishing shifts'}],rw:{crawfish:2,karma:6}},
 {id:'q_w_hunter',n:'Prove Provider',giver:'seamus',chain:'side',karma:6,desc:'Seamus says a pamphlet never filled a belly. Work 3 hunter shifts at the east-woods trapper’s post and lay meat on the cabin table.',obj:[{t:'work',job:'hunter',n:3,label:'hunting shifts'}],rw:{rabbit:2,karma:6}},
 {id:'q_w_sheriff',n:'The Watch Takes You',giver:'anselme',chain:'side',karma:8,desc:'The chapel cannot sanctuary the whole parish. Work 3 sheriff shifts at the gallows watch post; Anselme himself pins on the ribbon.',obj:[{t:'work',job:'sheriff',n:3,label:'watch shifts'}],rw:{coin:12,karma:8}},
 {id:'q_w_soldier',n:'Shoulder Arms',giver:'baptiste',chain:'side',karma:5,desc:'The militia drills with sticks and good intentions. Work 3 soldier shifts at the south-gate yard — someone here has actually stood in a line.',obj:[{t:'work',job:'soldier',n:3,label:'drill shifts'}],rw:{ammo:4,karma:5}},
 {id:'q_w_tavern',n:'The Back Room',giver:'seraphine',chain:'side',karma:5,desc:'Séraphine’s grog stall needs a steady hand and a deaf ear. Work 3 tavern shifts: pour, listen, forget by morning.',obj:[{t:'work',job:'tavern',n:3,label:'tavern shifts'}],rw:{wine:1,coin:8,karma:5}},
 {id:'q_w_smith',n:'Apprentice of the Forge',giver:'baptiste',chain:'side',karma:5,desc:'Baptiste’s hammer-arm gives out by dusk. Work 3 smith shifts at the forge (bring planks for charcoal) and earn the burn-scars.',obj:[{t:'work',job:'smith',n:3,label:'forge shifts'}],rw:{nail:3,karma:5}},
 {id:'q_w_farmer',n:'Common Acres',giver:'seamus',chain:'side',karma:7,desc:'A strip behind the cabins lies fallow — “nobody’s”, which means everybody’s. Work 3 farmer shifts and the commune eats in October.',obj:[{t:'work',job:'farmer',n:3,label:'farm shifts'}],rw:{bread:2,karma:7}},
 {id:'q_w_banker',n:'Honest Books',giver:'taxman',chain:'side',karma:6,desc:'Poulain, incredibly, wants the manor books honest — “fraud is a tax on myself.” Work 3 banker shifts at the counting desk and quietly forgive one cabin debt.',obj:[{t:'work',job:'banker',n:3,label:'ledger shifts'}],rw:{coin:14,karma:6}},
 {id:'q_w_tycoon',n:'Corner the Market',giver:'taxman',chain:'side',karma:3,desc:'“Accumulation,” says Poulain, “is a virtue with interest.” Work 2 tycoon shifts at the exchange corner (10-livre stake each) and prove the pamphlet wrong — or rich.',obj:[{t:'work',job:'tycoon',n:2,label:'speculations'}],rw:{coin:12,karma:3}},
 {id:'q_w_sewer',n:'The Miasma Theory',giver:'doctor',chain:'side',karma:7,desc:'Fauche blames the airs, and for once the airs agree. Work 3 sewer shifts at the drainage ditches. Danger money, gloves, no questions.',obj:[{t:'work',job:'sewer',n:3,label:'ditch shifts'}],rw:{coin:16,tonic:1,karma:7}},
 {id:'q_w_crier',n:'Lungs for the Commune',giver:'lucile',chain:'side',karma:6,desc:'Lucile runs messages; the parish needs a voice. Work 3 crier shifts at the market stone and cry the commune’s news true.',obj:[{t:'work',job:'crier',n:3,label:'crying shifts'}],rw:{coin:10,karma:6}},
 {id:'q_heirloom',n:'The Widow’s Locket',giver:'odette',chain:'side',karma:7,desc:'Odette’s mother’s locket was flung from a Maison Lament window the night the factor vanished — so the story goes. The house is deep in the east woods and not empty. Bring it home.',obj:[{t:'collect',item:'locket',n:1,label:'silver locket'}],rw:{coin:16,karma:7}},
 {id:'q_root1',n:'First Lessons',giver:'manon',chain:'side',karma:6,desc:'Manon will not teach the work to hands that never feed it. Perform 2 rituals at any altars (✝ crossroads, cemetery, bayou, chapel — bring offerings). The spirit comes to those who come to it.',obj:[{t:'ritual',n:2,label:'rituals worked'}],rw:{candle:2,karma:6}},
 {id:'q_root2',n:'Gris-gris and Teeth',giver:'manon',chain:'side',karma:8,desc:'“Now make your own protection and prove it.” Craft a gris-gris bag (C: herb + candle + 5 livres) and banish 1 apparition with steel, fire, or Lantern Call.',obj:[{t:'collect',item:'grisgris',n:1,label:'gris-gris bag'},{t:'kill',foe:'ghost',n:1,label:'apparition banished'}],rw:{tonic:1,karma:8}},
 {id:'q_pig_wife',n:'Jean-Luc’s Wife',giver:'jeanluc',chain:'side',karma:6,desc:'Babette Porcher went maypop-picking in the east and never came home — or so Jean-Luc says, checking over his shoulder. Walk the Bayou Landing; the maroon women know everything. Then settle it with him, kindly or honestly.',obj:[{t:'visit',zone:'bayou',label:'ask after Babette'},{t:'wife',n:1,label:'settle it with Jean-Luc'}],rw:{coin:8,karma:6}},
 {id:'q_pig_feed',n:'Mast and Mash',giver:'jeanluc',chain:'side',karma:5,desc:'“Pigs is honest. Pigs don’t sign.” Fatten the herd the old way — pannage: 3 acorns and 2 cattail roots for the trough.',obj:[{t:'collect',item:'acorn',n:3,label:'acorns'},{t:'collect',item:'cattail',n:2,label:'cattail roots'}],rw:{pork:2,coin:6,karma:5}},
 {id:'q_pig_boar',n:'The Boar Problem',giver:'jeanluc',chain:'side',karma:6,desc:'Feral boars circle the pen at night, Spanish ghosts with tusks. Take 3 head of game anywhere and Jean-Luc sleeps again.',obj:[{t:'hunt',n:3,label:'game taken'}],rw:{coin:12,ammo:2,karma:6}},
 {id:'q_t_herb',n:'Manon’s Apprentice',giver:'manon',chain:'side',karma:6,trait:'herbalist',desc:'For Herbalists only: Manon needs hands that know leaves. Gather 8 wormwood & mugwort for the fever teas.',obj:[{t:'collect',item:'herb',n:8,label:'herbs'}],rw:{tonic:3,karma:6}},
 {id:'q_t_boar',n:'The Old Boar',giver:'seamus',chain:'side',karma:8,trait:'hunter',desc:'For the Hunter-Born only: a scarred old boar roots the east woods and fears nothing. Take 8 head of game and bring back proof of the biggest.',obj:[{t:'hunt',n:8,label:'game taken'}],rw:{coin:20,karma:8}},
 {id:'q_t_brave',n:'Stand the Bell',giver:'anselme',chain:'side',karma:10,trait:'brave',desc:'For the Brave only: the chapel yard needs a soul who will not run. Bury 5 paupers while the dead shift walks.',obj:[{t:'bury',n:5,label:'paupers buried'}],rw:{coin:10,bible:1,karma:10}},
 {id:'q_t_garden',n:'Seamus’s Acre',giver:'seamus',chain:'side',karma:7,trait:'gardener',desc:'For Gardeners only: Seamus’s strip could feed three families in the right hands. Gather 8 wild foods to prove the hands.',obj:[{t:'forage',n:8,label:'wild foods'}],rw:{bread:3,karma:7}},
 {id:'q_t_coward',n:'Face the Bell',giver:'anselme',chain:'side',karma:8,trait:'cowardly',desc:'For the Cowardly only: Anselme prescribes terror as medicine. Slay 3 loups and the fear may leave you for good.',obj:[{t:'kill',foe:'wolf',n:3,label:'loups slain'}],rw:{karma:8}},
 {id:'q_t_haunt',n:'Lay Them Down',giver:'anselme',chain:'side',karma:10,trait:'haunted',desc:'For the Haunted only: what follows you can be faced. Banish 4 apparitions and sleep unaccompanied at last.',obj:[{t:'kill',foe:'ghost',n:4,label:'apparitions banished'}],rw:{karma:10}},
 {id:'q_risen',n:'The Night Shift',giver:'baptiste',chain:'side',karma:7,desc:'The Risen walk in force after dark. Put 6 back into the mud. The commune defends itself.',obj:[{t:'kill',foe:'risen',n:6,label:'risen laid to rest'}],rw:{ammo:6,coin:10,karma:7}},
 {id:'q_seal',n:'Seal of the Drowned',giver:'jean',chain:'side',karma:9,desc:'A demon-stain festers in the swamp heart. Gather 2 consecrated ash from destroyed apparitions? No — from the chapel brazier after banishings. Then cleanse the stain (E) in the swamp.',obj:[{t:'collect',item:'ash',n:2,label:'consecrated ash'}],rw:{coin:16,karma:9}},
 {id:'q_manor',n:'What the Manor Owes',giver:'seamus',chain:'main',karma:14,desc:'Seamus found the manor’s debt-book: 60 souls bought for 12 livres the head. Steal it from the manor chest (glowing crate behind the manor) and bring it to the market cross.',obj:[{t:'collect',item:'deed',n:2,label:'pages of the debt-book'}],rw:{karma:14,coin:15}},
 {id:'q_fang',n:'Ivory Needles',giver:'doctor',chain:'side',karma:6,desc:'Fauche pays 15 livres a fang and asks no questions. Bring 2 vampire fangs. Science, he calls it.',obj:[{t:'collect',item:'fang',n:2,label:'vampire fangs'}],rw:{coin:30,karma:2}},
 {id:'q_cure',n:'Cure for the Cousin',giver:'manon',chain:'side',karma:9,desc:'Lucile’s cousin can still be saved before the third moon: bring Manon 2 tonics and 1 silver dirk to cut the curse out.',obj:[{t:'collect',item:'tonic',n:2,label:'tonics'},{t:'collect',item:'silver',n:1,label:'silver dirk'}],rw:{coin:18,karma:9}},
 {id:'q_level',n:'THE LEVELING NIGHT',giver:'anselme',chain:'main',karma:25,desc:'The bell will toll thirteen on Night 3. The Bête de l’Abîme rises in the swamp with its court. Gather the commune (2 companions), face the Bête, and live to write the pamphlet. ⚜ ENDING QUEST.',obj:[{t:'kill',foe:'demon',n:1,label:'the Bête, leveled'}],rw:{karma:25}},
];
const CODEX={
 History:{t:'New Orleans, 1666 — that never was',b:`<h3>A fort that history forgot</h3><p>Real Nouvelle-Orléans was staked in 1718 by Bienville. Our 1666 is the <i>shadow-founding</i>: a private seigneurie of the Compagnie des Marais, fifty years early, built of cypress and debt. French <i>colombage</i> (half-timber), steep thatch, palisades, a chapel without consecration — all true to the 1660s. Justaucorps coats, tricornes not yet born (we wear broad cavalier hats), linen coifs, wool petticoats, wooden sabots in mud.</p><p>The anachronism is the point: primitive accumulation needed a swamp to rehearse in.</p>`},
 Thesis:{t:'Gothic Marxism in five graves',b:`<h3>The commune of the dead and the living</h3><p><b>1.</b> The dead work the night shift — unburied labour, unpaid, unquiet.<b> 2.</b> The Seigneur encloses the swamp and charges rent on rain.<b> 3.</b> The Church counts souls as tithes.<b> 4.</b> The Loup-Garou is the peasant who learned to bite back.<b> 5.</b> The Leveling Night is the general strike of the graveyard.</p><p>Karma is not heaven’s ledger. It is the commune’s memory of you.</p>`},
 Bestiary:{t:'The Five Plagues',b:`<h3>Field notes, Chirurgien Fauche</h3><p><b>🧟 Risen</b> — the plague-dead. Slow. Bite breeds fever (eat tonic/herb).<br><b>🐺 Loup-Garou</b> — by day a neighbour; by moon a wolf. Silver ×3, fire fears it.<br><b>👻 Apparition</b> — grief with a face. Wounds reason (sanity). Lantern-light + blessed steel.<br><b>🧛 Sang-Mêlé</b> — vampire gentry. Vain, parleyable at dusk, deadly always. Fangs worth coin.<br><b>😈 Bête de l’Abîme</b> — the swamp’s compound interest. Appears Night 3+ in the swamp. Bring friends, silver, and spite.</p>`},
 FloraFauna:{t:'Forage & game of the parish',b:`<h3>What the unenclosed woods give (October)</h3><p>Fall is the honest season. <b>🌰 Pecans & hickory</b> drop ripe in October; <b>🍇 muscadines</b> hang September–October; <b>🍑 persimmons</b> sweeten after frost; <b>🥭 pawpaws</b> and <b>🍈 maypops</b> finish; <b>🌰 acorns</b> mast (leach the bitterness, as the Houma do); <b>🥔 groundnuts</b> — Apios tubers the Choctaw dig in fall. Year-round: <b>🫚 sassafras</b> root-tea, <b>🍃 yaupon</b> cassina (the woods’ only caffeine — steadying to the nerves), <b>🧅 wild onion</b>, <b>🌾 cattail</b> root-flour, <b>🦞 crawfish</b> in the shallows.</p><p><b>Game:</b> cottontail 🐇, gray squirrel 🐿, fall-fat deer 🦌, turkey 🦃 in autumn flocks, mallards 🦆 on the water — and 🐊 the alligator, which hunts back. Feral hogs (Spanish stock) root the cane. Note the <i>absent</i>: no armadillos yet — they will not waddle in for another century.</p><p><b>Teeth:</b> 🐊 alligator (rolls), 🐍 cottonmouth (venom = bite-fever; suck the wound, chew herb), 🐢 snapping turtle (slow, shears), 🐗 feral hogs — Spanish stock gone wild by 1666 — charge, 🐱 bobcats hunt at a run, 🐻 the black bear, old man of the canebrake, is a siege engine. <b>Small neighbours:</b> 🦝 raccoon (steals shine), 🐀 opossum (plays dead — convincingly), 🐸 bullfrog (gig for legs), 🐦 great heron, 🐢 box turtle, 🦦 otter, and 🦅 the bald eagle circling over it all, untouchable as a tax farmer.</p><p>Take only hunger’s share. The commune remembers greed the way the Seigneur remembers debts.</p>`},
 Voodoo:{t:'Voodoo, hoodoo & rootwork',b:`<h3>The old ways</h3><p>Louisiana Voodoo braids West African religion with Catholic saints; hoodoo and rootwork are the practical magic of herbs, candles, dusts and deals. Here it runs on <b>🌀 spirit</b>: cast from the conjure-book (<b>R</b>, or keys 7–0,–), and restore it at four altars — ✝ crossroads, cemetery, bayou, chapel — with offerings of coin, candle, bread, tafia and herb. Carry a gris-gris for +20 max. Manon teaches; the mud provides.</p>`},
 Music:{t:'A gothic-Americana score',b:`<h3>Five songs for the parish (16-Horsepower weather)</h3><p>Menu brush-drums, day train-beat with banjo rolls, night dirge with reeds, combat war-drums at 132, chapel hymn at 60 — all in brooding minor keys. The strings are Karplus-Strong physical models through a tube-amp waveshaper into a dark analog echo; the accordion is detuned reeds with bellows swell; the drums are synthesized kick, snare, toms and steel ticks. No recordings — only mathematics, which in the bayou amounts to the same haunting.</p>`},
};
/* ============ WILD PARISH: forage, game, horses, carts ============ */
const FORAGE_DEFS={
 pecan:{item:'pecan',label:'pecan mast',name:'Pecan mast',e:'🌰',build:'ground',dot:0x8a6a3a},
 hickory:{item:'hickory',label:'hickory nuts',name:'Hickory mast',e:'🌰',build:'ground',dot:0xa88a4a},
 acorn:{item:'acorn',label:'acorns',name:'Oak mast',e:'🌰',build:'ground',dot:0x6a4a2a},
 persimmon:{item:'persimmon',label:'persimmons',name:'Persimmon tree',e:'🍑',build:'bush',leaf:0x3a5a2e,berry:0xe07a2a},
 muscadine:{item:'muscadine',label:'muscadines',name:'Muscadine vine',e:'🍇',build:'bush',leaf:0x2e4a26,berry:0x4a2a5a},
 pawpaw:{item:'pawpaw',label:'pawpaws',name:'Pawpaw patch',e:'🥭',build:'bush',leaf:0x3a6a2e,berry:0x9aaa3a},
 maypop:{item:'maypop',label:'maypops',name:'Maypop vine',e:'🍈',build:'bush',leaf:0x3a5a2e,berry:0xd8d89a},
 yaupon:{item:'yaupon',label:'yaupon leaves',name:'Yaupon holly',e:'🍃',build:'bush',leaf:0x1e4a26,berry:0xc02a2a},
 sassafras:{item:'sassafras',label:'sassafras root',name:'Sassafras sapling',e:'🫚',build:'sprout',leaf:0x4a7a2e},
 onion:{item:'onion',label:'wild onions',name:'Onion bed',e:'🧅',build:'sprout',leaf:0x5a8a3a},
 groundnut:{item:'groundnut',label:'groundnuts',name:'Groundnut vines',e:'🥔',build:'sprout',leaf:0x4a6a2e},
 cattail:{item:'cattail',label:'cattail roots',name:'Cattail stand',e:'🌾',build:'stalk'},
 crawfish:{item:'crawfish',label:'crawfish',name:'Crawfish pool',e:'🦞',build:'pool',item2:'catfish'},
 niter:{item:'niter',label:'saltpetre',name:'Nitre crust',e:'🧂',build:'ground',dot:0xe8e4d4},
};
const FORAGE_NODES=[
 ['pecan',60,0],['pecan',66,-8],['pecan',55,10],['pecan',-60,-14],
 ['persimmon',-44,20],['persimmon',36,44],['persimmon',52,-30],
 ['muscadine',-46,44],['muscadine',-58,58],['muscadine',30,52],
 ['pawpaw',44,16],['pawpaw',-40,-28],['pawpaw',64,34],
 ['acorn',-70,-20],['acorn',70,-6],['acorn',-20,-48],['acorn',34,12],
 ['hickory',62,44],['hickory',-64,34],['hickory',24,-44],
 ['sassafras',8,34],['sassafras',-24,8],['sassafras',40,-14],
 ['yaupon',-28,-20],['yaupon',-10,32],['yaupon',18,44],
 ['onion',30,4],['onion',38,8],['onion',-48,-2],
 ['groundnut',-36,56],['groundnut',4,68],['groundnut',36,60],
 ['cattail',10,62],['cattail',-2,72],['cattail',22,70],['cattail',-44,56],
 ['maypop',48,-2],['maypop',-52,20],['maypop',16,18],
 ['crawfish',6,76],['crawfish',16,86],['crawfish',-42,62],
 ['niter',-34,-36],['niter',-42,-44],['niter',4,-40],
];
const CRITTER_DEFS={
 rabbit:{n:'Cottontail',e:'🐇',hp:10,spd:5.0,drops:[['rabbit',1,1]]},
 squirrel:{n:'Gray squirrel',e:'🐿',hp:8,spd:5.5,drops:[['squirrel',1,1]]},
 deer:{n:'White-tailed deer',e:'🦌',hp:45,spd:6.5,drops:[['venison',2,1]]},
 turkey:{n:'Wild turkey',e:'🦃',hp:20,spd:4.5,drops:[['turkey',1,1]]},
 duck:{n:'Mallard',e:'🦆',hp:12,spd:4.0,drops:[['duck',1,1]]},
 gator:{n:'Alligator',e:'🐊',hp:120,spd:4.2,hostile:true,dmg:16,drops:[['gator',2,1],['coin',5,0.6]]},
 snake:{n:'Cottonmouth',e:'🐍',hp:25,spd:3.6,hostile:true,dmg:10,venom:true,drops:[['snakemeat',1,1],['venom',1,0.5]]},
 snapper:{n:'Snapping turtle',e:'🐢',hp:60,spd:1.2,hostile:true,dmg:18,drops:[['turtle',2,1]]},
 hog:{n:'Feral hog',e:'🐗',hp:70,spd:5.2,hostile:true,dmg:14,drops:[['pork',2,1]]},
 bobcat:{n:'Bobcat',e:'🐱',hp:50,spd:6.2,hostile:true,dmg:12,drops:[['pelt',1,0.8],['coin',3,0.6]]},
 bear:{n:'Black bear',e:'🐻',hp:230,spd:4.6,hostile:true,dmg:26,drops:[['bearmeat',3,1],['coin',8,0.8]]},
 raccoon:{n:'Raccoon',e:'🦝',hp:15,spd:4.5,drops:[['coon',1,1],['coin',2,0.3]]},
 opossum:{n:'Opossum',e:'🐀',hp:12,spd:3.5,drops:[['possum',1,1]]},
 frog:{n:'Bullfrog',e:'🐸',hp:8,spd:3.0,drops:[['froglegs',1,1]]},
 heron:{n:'Great heron',e:'🐦',hp:30,spd:7.0,drops:[['duck',1,1]]},
 boxturtle:{n:'Box turtle',e:'🐢',hp:25,spd:0.8,drops:[['turtle',1,1]]},
 otter:{n:'River otter',e:'🦦',hp:18,spd:4.8,drops:[['catfish',1,0.9]]},
 eagle:{n:'Bald eagle',e:'🦅',hp:999,spd:0,flying:true,drops:[]},
 pig:{n:'Pig',e:'🐷',hp:25,spd:3.0,drops:[['pork',1,1]]},
};
function makeForageMesh(sp){const g=new THREE.Group();
 if(sp.build==='bush'){const b=new THREE.Mesh(new THREE.SphereGeometry(0.9,8,6),mat(sp.leaf||0x2e4a26));b.position.y=0.7;g.add(b);
  for(let i=0;i<7;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,4),new THREE.MeshBasicMaterial({color:sp.berry||0xc02a2a}));d.position.set(rand(-0.7,0.7),rand(0.4,1.3),rand(-0.7,0.7));g.add(d);}}
 else if(sp.build==='ground'){for(let i=0;i<8;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(0.13,6,4),mat(sp.dot||0x8a6a3a));d.position.set(rand(-0.9,0.9),0.12,rand(-0.9,0.9));g.add(d);}}
 else if(sp.build==='stalk'){for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.8,5),mat(0x3a5a2e));s.position.set(rand(-0.6,0.6),0.9,rand(-0.6,0.6));g.add(s);
   const h=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.5,6),mat(0x5a3a1a));h.position.set(s.position.x,1.9,s.position.z);g.add(h);}}
 else if(sp.build==='pool'){const p=new THREE.Mesh(new THREE.CircleGeometry(1.1,16),new THREE.MeshLambertMaterial({color:0x14262c}));p.rotation.x=-Math.PI/2;p.position.y=0.08;g.add(p);
  const r=new THREE.Mesh(new THREE.TorusGeometry(0.9,0.06,6,18),new THREE.MeshBasicMaterial({color:0x3a6a6a}));r.rotation.x=-Math.PI/2;r.position.y=0.1;g.add(r);}
 else{for(let i=0;i<5;i++){const s=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.9,5),mat(sp.leaf||0x4a7a2e));s.position.set(rand(-0.6,0.6),0.45,rand(-0.6,0.6));g.add(s);}}
 return g;}
function plantForage(){FORAGE_NODES.forEach(([spId,x,z])=>{const sp=FORAGE_DEFS[spId];const m=makeForageMesh(sp);m.position.set(x,0,z);scene.add(m);
 interactables.push({kind:'forage',species:spId,name:sp.name,x,z,r:2.8,txt:'Gather '+sp.label+' (E)',node:m});});}
function forageUpdate(){const now=performance.now();for(const it of interactables){if(it.kind!=='forage'||!it.node)continue;
 it.node.visible=!(it.cd&&now<it.cd);}}
function gatherForage(it){const sp=FORAGE_DEFS[it.species];addItem(sp.item,1);
 if(Math.random()<0.1*skillLvl('forage')+(T('rootwise')?0.15:0)+(T('outdoorsman')?0.1:0)){addItem(sp.item,1);toast('🌿 A forager’s eye: double '+sp.label+'.','good');}
 if(sp.item==='herb'&&T('herbalist')&&Math.random()<0.5){addItem('herb',1);toast('🌿 Herbalist’s hands: twin sprigs.','good');}
 if(it.species==='crawfish'&&(skillLvl('fish')>=3||T('angler'))){addItem(sp.item,1);toast('🎣 Old water-hand: extra share.','good');}
 gainXp('forage',2);if(it.species==='crawfish')gainXp('fish',2);
 if(sp.item2&&Math.random()<0.35){addItem(sp.item2,1);toast(sp.e+' A bonus! '+ITEMS[sp.item2].n+'.','good');}
 else toast(sp.e+' Gathered '+sp.label+'.','good');
 AudioSys.sfx('pickup');it.cd=performance.now()+rand(120000,240000);wildProgress('forage');refreshHUD();refreshHotbar();}
function makeCritterMesh(type){const g=new THREE.Group();
 if(type==='rabbit'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.4,0.35),mat(0x8a8072));b.position.y=0.3;g.add(b);
  const e1=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.35,0.08),mat(0x8a8072));e1.position.set(-0.2,0.65,0);g.add(e1);const e2=e1.clone();e2.position.z=0.12;e2.position.x=-0.2;g.add(e2);}
 else if(type==='squirrel'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.25),mat(0x7a5a3a));b.position.y=0.35;g.add(b);
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.1),mat(0x7a5a3a));t.position.set(0.4,0.6,0);t.rotation.z=0.7;g.add(t);}
 else if(type==='deer'){const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.8,0.6),mat(0x9a7a52));b.position.y=1.0;b.castShadow=true;g.add(b);
  const n=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.7,0.3),mat(0x9a7a52));n.position.set(0.8,1.6,0);g.add(n);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.3,0.3),mat(0x9a7a52));h.position.set(0.85,2.0,0);g.add(h);
  for(const [lx,lz] of [[-0.5,0.2],[-0.5,-0.2],[0.5,0.2],[0.5,-0.2]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.7,0.12),mat(0x7a5f3f));l.position.set(lx,0.35,lz);g.add(l);}}
 else if(type==='turkey'){const b=new THREE.Mesh(new THREE.SphereGeometry(0.4,8,6),mat(0x3a2a1a));b.position.y=0.5;g.add(b);
  const f=new THREE.Mesh(new THREE.ConeGeometry(0.4,0.7,6),mat(0x5a3a2a));f.position.set(-0.4,0.7,0);f.rotation.z=1.2;g.add(f);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,4),mat(0x2a4a6a));h.position.set(0.35,0.9,0);g.add(h);}
 else if(type==='duck'){const b=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),mat(0x5a4a3a));b.position.y=0.3;g.add(b);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,4),mat(0x2a5a2a));h.position.set(0.3,0.55,0);g.add(h);}
 else if(type==='snake'){for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.18,0.18),mat(i%2?0x3a2a1a:0x5a3a2a));s.position.set(i*0.35,0.15,Math.sin(i)*0.15);g.add(s);}
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.22,0.24),mat(0x6a4a2a));h.position.set(1.5,0.25,0);g.add(h);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.06),new THREE.MeshBasicMaterial({color:0xf0f0f0,side:THREE.DoubleSide}));m.position.set(1.5,0.28,0);m.rotation.y=Math.PI/2;g.add(m);}
 else if(type==='snapper'){const s=new THREE.Mesh(new THREE.SphereGeometry(0.55,8,5,0,Math.PI*2,0,1.5),mat(0x3a3a26));s.position.y=0.25;g.add(s);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.25,0.3),mat(0x4a4a30));h.position.set(0.6,0.25,0);g.add(h);
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.12,0.15),mat(0x3a3a26));t.position.set(-0.6,0.15,0);g.add(t);}
 else if(type==='boxturtle'){const s=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,5,0,Math.PI*2,0,1.5),mat(0x6a5a2a));s.position.y=0.12;g.add(s);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,4),mat(0x7a6a3a));h.position.set(0.32,0.12,0);g.add(h);}
 else if(type==='hog'){const b=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.7,0.55),mat(0x4a3a2e));b.position.y=0.6;b.castShadow=true;g.add(b);
  const s=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.3,0.3),mat(0x4a3a2e));s.position.set(0.7,0.5,0);g.add(s);
  const t1=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.25,5),mat(0xe8e0cc));t1.position.set(0.85,0.35,0.15);t1.rotation.z=-1.2;g.add(t1);
  const t2=t1.clone();t2.position.z=-0.15;g.add(t2);
  for(const [lx,lz] of [[-0.4,0.18],[-0.4,-0.18],[0.4,0.18],[0.4,-0.18]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.4,0.12),mat(0x3a2a20));l.position.set(lx,0.2,lz);g.add(l);}}
 else if(type==='bobcat'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.45,0.35),mat(0x8a6a4a));b.position.y=0.5;g.add(b);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.28),mat(0x8a6a4a));h.position.set(0.55,0.75,0);g.add(h);
  for(const s of [-0.1,0.1]){const e=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.18,4),mat(0x6a4a30));e.position.set(0.55,0.95,s);g.add(e);}
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.12),mat(0x8a6a4a));t.position.set(-0.55,0.55,0);g.add(t);}
 else if(type==='bear'){const b=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.1,0.9),mat(0x2e2018));b.position.y=0.9;b.castShadow=true;g.add(b);
  const hump=new THREE.Mesh(new THREE.SphereGeometry(0.5,7,6),mat(0x2e2018));hump.position.set(0.4,1.5,0);g.add(hump);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.32,7,6),mat(0x2e2018));h.position.set(1.1,1.3,0);g.add(h);
  const sn=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.2,0.22),mat(0x5a4a3a));sn.position.set(1.35,1.2,0);g.add(sn);}
 else if(type==='raccoon'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.4,0.3),mat(0x6a6a6a));b.position.y=0.35;g.add(b);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.28,0.26),mat(0x6a6a6a));h.position.set(0.45,0.55,0);g.add(h);
  const mk=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.27),mat(0x1a1a1a));mk.position.set(0.5,0.58,0);g.add(mk);
  for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.24,0.24),mat(i%2?0x1a1a1a:0x6a6a6a));r.position.set(-0.45-i*0.16,0.35,0);g.add(r);}}
 else if(type==='opossum'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.65,0.35,0.28),mat(0x9a9a9a));b.position.y=0.3;g.add(b);
  const h=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.3,6),mat(0xd8c8c8));h.position.set(0.42,0.35,0);h.rotation.z=-1.2;g.add(h);
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,0.06),mat(0xd8a8a8));t.position.set(-0.55,0.3,0);g.add(t);}
 else if(type==='frog'){const b=new THREE.Mesh(new THREE.SphereGeometry(0.25,7,6),mat(0x3a7a2e));b.position.y=0.2;g.add(b);
  const e1=new THREE.Mesh(new THREE.SphereGeometry(0.07,5,4),new THREE.MeshBasicMaterial({color:0x111111}));e1.position.set(0.15,0.38,0.12);g.add(e1);
  const e2=e1.clone();e2.position.z=-0.12;g.add(e2);
  for(const s of [-0.2,0.2]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.1,0.1),mat(0x3a7a2e));l.position.set(-0.1,0.08,s);g.add(l);}}
 else if(type==='heron'){for(const s of [-0.15,0.15]){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.9,4),mat(0x1a1a1a));l.position.set(0,0.45,s);g.add(l);}
  const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.25),mat(0x8a9aaa));b.position.y=1.0;g.add(b);
  const n=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.6,5),mat(0x8a9aaa));n.position.set(0.25,1.35,0);g.add(n);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.12,0.12),mat(0x8a9aaa));h.position.set(0.3,1.65,0);g.add(h);}
 else if(type==='otter'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.3,0.28),mat(0x4a3428));b.position.y=0.25;g.add(b);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,5),mat(0x4a3428));h.position.set(0.5,0.35,0);g.add(h);
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.12,0.12),mat(0x4a3428));t.position.set(-0.7,0.25,0);g.add(t);}
 else if(type==='pig'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.55,0.5),mat(0xd8a0a0));b.position.y=0.5;g.add(b);
  const s=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.25,0.25),mat(0xe8b0b0));s.position.set(0.55,0.45,0);g.add(s);
  for(const s2 of [-0.12,0.12]){const e=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.16,4),mat(0xd8a0a0));e.position.set(0.35,0.85,s2);g.add(e);}
  const t=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.06,0.06),mat(0xd8a0a0));t.position.set(-0.55,0.55,0);t.rotation.z=0.6;g.add(t);
  for(const [lx,lz] of [[-0.3,0.15],[-0.3,-0.15],[0.3,0.15],[0.3,-0.15]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.35,0.1),mat(0xc08080));l.position.set(lx,0.18,lz);g.add(l);}}
 else if(type==='eagle'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.25,0.3),mat(0x3a2a1a));g.add(b);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,5),mat(0xf0f0f0));h.position.set(0.4,0.1,0);g.add(h);
  for(const s of [-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.06,1.6),mat(0x2a1a10));w.position.set(-0.1,0.1,s*0.85);g.add(w);}}
 else{const b=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.6,0.7),mat(0x2e4a2e));b.position.y=0.4;b.castShadow=true;g.add(b);
  const j=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.25,0.5),mat(0x243a24));j.position.set(1.5,0.35,0);g.add(j);
  const t=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.2,0.3),mat(0x2e4a2e));t.position.set(-1.7,0.35,0);g.add(t);
  const e1=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4),new THREE.MeshBasicMaterial({color:0xffee00}));e1.position.set(1.0,0.7,0.2);g.add(e1);const e2=e1.clone();e2.position.z=-0.2;g.add(e2);}
 return g;}
function spawnCritter(type,x,z){const d=CRITTER_DEFS[type];const m=makeCritterMesh(type);m.position.set(x,0,z);scene.add(m);
 const c={type,d,mesh:m,hp:d.hp,tx:x,tz:z,wt:rand(0,3),cd:0,hx:x,hz:z};critters.push(c);return c;}
function hurtCritter(c,dmg){if(c.d.flying)return;dmg*=(1+0.1*skillLvl('hunt'))*(T('hunter')?1.1:1);c.hp-=dmg;blood(c.mesh.position.x,c.mesh.position.z);AudioSys.sfx('hit');
 if(c.hp<=0)killCritter(c);
 else if(c.type==='opossum'&&!c.trick&&c.hp<c.d.hp*0.5){c.trick=true;c.mesh.rotation.z=1.4;toast('🐀 The opossum plays dead. It is very convincing. Sometimes mercy is the smarter tax.');}
 else{c.tx=c.mesh.position.x+(c.mesh.position.x-G.pos.x);c.tz=c.mesh.position.z+(c.mesh.position.z-G.pos.z);c.wt=3;}}
function killCritter(c){scene.remove(c.mesh);critters.splice(critters.indexOf(c),1);
 for(const [id,n,ch] of c.d.drops){if(Math.random()<ch)addItem(id,n);}
 if(skillLvl('trap')>0&&c.d.drops.length&&Math.random()<0.1*skillLvl('trap')){addItem(c.d.drops[0][0],1);toast('🪤 A trapper’s clean work: bonus share.','good');}
 gainXp('hunt',3);
 toast(c.d.e+' '+c.d.n+' taken. The pot thanks you.');AudioSys.sfx('hurt');
 if(c.type==='pig'){addKarma(-8,'livestock slain — Jean-Luc saw everything');G.dispo.jeanluc=(G.dispo.jeanluc||0)-3;toast('🐷 Jean-Luc howls from the pen. The parish will remember this theft.','bad');}
 wildProgress('hunt');refreshHUD();refreshHotbar();}
function critterUpdate(c,dt){const m=c.mesh;c.cd-=dt;
 const px=G.pos.x,pz=G.pos.z,d=dist2(m.position.x,m.position.z,px,pz);
 if(c.d.flying){c.a=(c.a||rand(0,6))+dt*0.3;const R=20;m.position.set(c.hx+Math.cos(c.a)*R,22,c.hz+Math.sin(c.a)*R);m.rotation.y=-c.a;return;}
 if(c.d.hostile){
  if(d<14){const dx=(px-m.position.x)/d,dz=(pz-m.position.z)/d;const cc=collide(m.position.x+dx*c.d.spd*dt,m.position.z+dz*c.d.spd*dt,0.9);m.position.x=cc.x;m.position.z=cc.z;m.lookAt(px,0,pz);
   if(d<2.2&&c.cd<=0){c.cd=1.6;hurtPlayer(c.d.dmg+rand(-3,3),c.d.n);toast(c.d.e+' '+c.d.n+(c.type==='gator'?' rolls!':' strikes!')+' (−HP)','bad');if(c.d.venom&&G.infected<=0){G.infected=1;toast('☠ Venom in the blood! Herb or tonic, quickly!','bad');}}return;}
  c.wt-=dt;if(c.wt<=0){c.wt=rand(4,9);c.tx=c.hx+rand(-10,10);c.tz=c.hz+rand(-10,10);}
 }else{
  const fleeR=(G.sneaking?0.6:1)*(Math.max(3,7-0.4*skillLvl('sneak'))-(T('hunter')?1:0));
  if(d<fleeR&&!G.dead){const dx=(m.position.x-px)/d,dz=(m.position.z-pz)/d;const cc=collide(m.position.x+dx*c.d.spd*dt,m.position.z+dz*c.d.spd*dt,0.5);m.position.x=cc.x;m.position.z=cc.z;m.lookAt(m.position.x+dx,0,m.position.z+dz);return;}
  c.wt-=dt;if(c.wt<=0){c.wt=rand(3,8);c.tx=c.hx+rand(-16,16);c.tz=c.hz+rand(-16,16);}
 }
 const dx=c.tx-m.position.x,dz=c.tz-m.position.z,dd=Math.hypot(dx,dz);
 if(dd>1){const cc=collide(m.position.x+dx/dd*c.d.spd*0.5*dt,m.position.z+dz/dd*c.d.spd*0.5*dt,0.5);m.position.x=cc.x;m.position.z=cc.z;}}
let critT=10;
function critterSpawns(dt){critT-=dt;if(critT>0)return;critT=20;
 const passives=critters.filter(c=>c.type!=='gator').length;
 if(passives<12){const t=choice(['rabbit','rabbit','squirrel','squirrel','turkey','deer','duck','deer','raccoon','opossum','frog','boxturtle','heron','otter','hog','snake']);const a=rand(0,Math.PI*2);
  spawnCritter(t,clamp(G.pos.x+Math.cos(a)*rand(25,50),-110,110),clamp(G.pos.z+Math.sin(a)*rand(25,50),-110,110));}
 if(critters.filter(c=>c.type==='gator').length<3&&Math.random()<0.5)spawnCritter('gator',rand(-5,25),rand(66,92));
 if(!critters.some(c=>c.type==='bear')&&Math.random()<0.12){const a=rand(0,Math.PI*2);spawnCritter('bear',clamp(G.pos.x+Math.cos(a)*rand(35,55),-110,110),clamp(G.pos.z+Math.sin(a)*rand(35,55),-110,110));toast('🐻 The old man of the canebrake is abroad. Give way.','bad');}}
function wildProgress(kind){for(const id of [...G.qactive]){const q=qdef(id);if(!q.obj.some(o=>o.t===kind))continue;const s=G.quests[id];s.have[kind]=(s.have[kind]||0)+1;
 let done=true;for(const o of q.obj){if(o.t==='forage'&&(s.have.forage||0)<o.n)done=false;if(o.t==='hunt'&&(s.have.hunt||0)<o.n)done=false;
  if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);if(h<o.n)done=false;}
  if(o.t==='kill'&&(s.have['k_'+o.foe]||0)<o.n)done=false;
  if(o.t==='bury'&&(s.have.bury||0)<o.n)done=false;
  if(o.t==='visit'&&!s.have['v_'+o.zone])done=false;
  if(o.t==='tax'&&!G.taxPaid)done=false;
  if(o.t==='torch'&&(G.planted||0)<o.n)done=false;if(o.t==='work'&&(s.have['w_'+o.job]||0)<o.n)done=false;if(o.t==='ritual'&&(s.have.ritual||0)<o.n)done=false;}
 if(done)completeQuest(id);}refreshTracker();}
/* ---- horses & carts: rideable ---- */
function makeHorseMesh(blanket){const g=new THREE.Group();
 const b=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.75,0.65),mat(0x5a3a26));b.position.y=1.15;b.castShadow=true;g.add(b);
 const n=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.75,0.3),mat(0x5a3a26));n.position.set(0.95,1.6,0);n.rotation.z=-0.4;g.add(n);
 const h=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.3,0.28),mat(0x5a3a26));h.position.set(1.15,1.95,0);g.add(h);
 const mn=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.18,0.14),mat(0x2a1a10));mn.position.set(0.85,1.95,0);g.add(mn);
 for(const [lx,lz] of [[-0.6,0.22],[-0.6,-0.22],[0.6,0.22],[0.6,-0.22]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.8,0.14),mat(0x4a3020));l.position.set(lx,0.4,lz);g.add(l);}
 const t=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.12),mat(0x2a1a10));t.position.set(-1.05,1.2,0);t.rotation.z=0.5;g.add(t);
 const s=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.12,0.75),mat(blanket||0x6a1a2e));s.position.set(0,1.56,0);g.add(s);
 return g;}
function spawnHorses(){[['Brigand',30,38],['Misère',-48,56],['Calvin',6,-32],['Rosalie',2,56]].forEach(([nm,x,z],i)=>{
 const m=makeHorseMesh([0x6a1a2e,0x2a4a6a,0x3a5a2e,0x5a4a1a][i]);m.position.set(x,0,z);scene.add(m);
 const lb=makeLabel('🐎 '+nm,0.5);lb.position.set(0,2.9,0);m.add(lb);
 horses.push({kind:'horse',name:nm,mesh:m,hx:x,hz:z,tx:x,tz:z,wt:rand(1,4)});});}
function horseUpdate(h,dt){if(G.mounted&&G.mounted.ref===h)return;const m=h.mesh;
 for(const f of foes){if(dist2(m.position.x,m.position.z,f.mesh.position.x,f.mesh.position.z)<9){ // shies from monsters
  const dx=(m.position.x-f.mesh.position.x),dz=(m.position.z-f.mesh.position.z),d=Math.hypot(dx,dz)||1;
  const cc=collide(m.position.x+dx/d*5*dt,m.position.z+dz/d*5*dt,0.8);m.position.x=cc.x;m.position.z=cc.z;return;}}
 h.wt-=dt;if(h.wt<=0){h.wt=rand(5,11);h.tx=h.hx+rand(-9,9);h.tz=h.hz+rand(-9,9);}
 const dx=h.tx-m.position.x,dz=h.tz-m.position.z,dd=Math.hypot(dx,dz);
 if(dd>0.8){const cc=collide(m.position.x+dx/dd*1.4*dt,m.position.z+dz/dd*1.4*dt,0.8);m.position.x=cc.x;m.position.z=cc.z;m.lookAt(h.tx,0,h.tz);}}
function makeCartMesh(){const g=new THREE.Group();
 const bed=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.5,1.5),mat(0x6a4a26));bed.position.y=1.0;bed.castShadow=true;g.add(bed);
 for(const s of [-0.6,0.6]){const rail=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.5,0.12),mat(0x4a3018));rail.position.set(0,1.5,s);g.add(rail);}
 for(const s of [-0.85,0.85]){const w=new THREE.Mesh(new THREE.CylinderGeometry(0.75,0.75,0.14,12),mat(0x3a2612));w.rotation.x=Math.PI/2;w.position.set(-0.2,0.75,s);g.add(w);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.2,8),mat(0x8a6a3a));hub.rotation.x=Math.PI/2;hub.position.set(-0.2,0.75,s);g.add(hub);}
 const mule=makeHorseMesh(0x4a4a4a);mule.scale.setScalar(0.85);mule.position.set(2.4,0,0);mule.rotation.y=0;g.add(mule);
 for(const s of [-0.4,0.4]){const shaft=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.1,0.1),mat(0x4a3018));shaft.position.set(1.6,0.9,s);g.add(shaft);}
 // sacks & barrels aboard
 const sk=new THREE.Mesh(new THREE.SphereGeometry(0.4,7,6),mat(0x9a8a6a));sk.position.set(-0.6,1.5,0);g.add(sk);
 const br=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.6,8),mat(0x5a3a1a));br.position.set(0.5,1.55,0.3);g.add(br);
 return g;}
function placeCarts(){[['Market cart',18,-2,0.4],['Manor cart',-4,-36,1.7],['Landing cart',-54,46,-0.6]].forEach(([nm,x,z,ry])=>{
 const m=makeCartMesh();m.position.set(x,0,z);m.rotation.y=ry;scene.add(m);
 const lb=makeLabel('🛒 '+nm,0.5);lb.position.set(0,3.2,0);m.add(lb);
 carts.push({kind:'cart',name:nm,mesh:m,stash:{}});});}
function mountHorse(h){G.mounted={kind:'horse',ref:h};G.pos.x=h.mesh.position.x;G.pos.z=h.mesh.position.z;
 toast('🐎 Mounted '+h.name+'. Gallop with Shift — the parish is yours. (E to dismount)','good');AudioSys.sfx('pickup');}
function mountCart(c){G.mounted={kind:'cart',ref:c};G.pos.x=c.mesh.position.x;G.pos.z=c.mesh.position.z;
 toast('🛒 Driving '+c.name+'. Slow but sure — and she carries your commons (V for stash).','good');AudioSys.sfx('pickup');}
function dismount(){if(!G.mounted)return;const m=G.mounted;G.mounted=null;
 const a=rand(0,Math.PI*2);const cc=collide(G.pos.x+Math.cos(a)*2.2,G.pos.z+Math.sin(a)*2.2,0.7);
 G.pos.x=clamp(cc.x,-112,112);G.pos.z=clamp(cc.z,-112,112);
 playerMesh.position.set(G.pos.x,0,G.pos.z);playerMesh.position.y=0;
 toast(m.kind==='horse'?'🐎 Dismounted.':(m.kind==='boat'?'🛶 Beached. Mind the mud.':'🛒 Parked.'));AudioSys.sfx('pickup');}
let stashCart=null;
function openStash(c){stashCart=c;$('trade').classList.remove('hidden');$('trade-with').textContent='— '+c.name+' stash';renderStash();}
function renderStash(){const c=stashCart;if(!c)return;const T=$('trade-theirs'),Y=$('trade-yours');T.innerHTML='';Y.innerHTML='';
 const ck=Object.keys(c.stash);
 T.innerHTML=ck.length?'':'<i>Empty bed. The commons await.</i>';
 ck.forEach(id=>{const it=ITEMS[id];if(!it)return;const d=document.createElement('div');d.className='trade-item';
  d.innerHTML='<span>'+it.e+' '+it.n+' ×'+c.stash[id]+'</span><span>take ⤵</span>';
  d.onclick=()=>{c.stash[id]--;if(c.stash[id]<=0)delete c.stash[id];addItem(id,1);AudioSys.sfx('pickup');renderStash();refreshHotbar();};
  T.appendChild(d);});
 Object.keys(G.inv).forEach(id=>{const it=ITEMS[id];if(!it)return;const d=document.createElement('div');d.className='trade-item';
  d.innerHTML='<span>'+it.e+' '+it.n+' ×'+G.inv[id]+'</span><span>stash ⤴</span>';
  d.onclick=()=>{if(!takeItem(id,1))return;c.stash[id]=(c.stash[id]||0)+1;AudioSys.sfx('gold');renderStash();refreshHotbar();};
  Y.appendChild(d);});
 $('trade-info').textContent='A mobile commons: take or leave freely. Rides with you.';}
function nearestCart(){let best=null,bd=4.5;for(const c of carts){const d=dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z);if(d<bd){bd=d;best=c;}}return best;}
/* ---- beds: sleep until dawn ---- */
function placeBeds(){[['Cabin bunk',24,26,0x6a1a2e],['Chapel pew',-36,-8,0x3a3a5a],['Swamp hammock',12,76,0x2e5a2e],['Herbalist cot',-18,28,0x5a4a1a]].forEach(([nm,x,z,blanket])=>{
 const fr=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.4,1.3),mat(0x5a4630));fr.position.set(x,0.35,z);scene.add(fr);
 const mt=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.25,1.1),mat(0x9a8a6a));mt.position.set(x,0.65,z);scene.add(mt);
 const bl=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.15,1.15),mat(blanket));bl.position.set(x-0.4,0.8,z);scene.add(bl);
 interactables.push({kind:'bed',name:nm,x,z,r:2.8,txt:'Sleep until dawn (E)'});});}
function doSleep(bed){if(G.time>=6&&G.time<18){subtitle('Only owls and the guilty sleep by day. Come back at dusk.');return;}
 for(const f of foes){if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<14){toast('Too dangerous — the dark is standing too close. Clear it or run.','bad');return;}}
 const lt=$('letterbox-top'),lb=$('letterbox-bot');lt.style.height='12vh';lb.style.height='12vh';
 setTimeout(()=>{lt.style.height='0';lb.style.height='0';},1400);
 const nextDay=G.time>=6.2;if(nextDay){G.day++;AudioSys.bell();toast('☀ Day '+G.day+' — the bell counts what the Seigneur cannot.','good');
  if(G.day===3)subtitle('The air tastes of iron. Tonight the bell will toll thirteen.');
  unlockQuests();}
 G.time=6.2;G.weather=choice(['mist','mist','clear','mosquitoes']);
 G.hunger=clamp(G.hunger-30,0,100);
 const nightmare=(G.sanity<35||G.infected>0)&&Math.random()<0.45;
 if(nightmare){G.sanity=clamp(G.sanity+10,0,100);G.hp=clamp(G.hp-10,1,G.maxhp);
  subtitle('You dream of ledgers written in teeth. You wake chewing the blanket.');toast('Nightmare. (+10 🕯 only, −10 ❤)','bad');}
 else{G.sanity=clamp(G.sanity+45*(T('restless')?0.5:1),0,100);G.hp=clamp(G.hp+25*(T('restless')?0.5:1),0,G.maxhp);gainXp('vigor',4);
  if(G.hunger<=0){G.hp=clamp(G.hp-10,1,G.maxhp);toast('You slept hungry. The belly keeps its own ledger.','bad');}
  else toast('🛏 You slept at '+bed.name+'. (+45 🕯, +25 ❤)','good');AudioSys.sfx('pray');}
 refreshHUD();checkEnding();}
/* ============ STATE ============ */
const G={started:false,paused:false,dead:false,ending:false,day:1,time:8.0,weather:'mist',kills:0,buried:0,
 hp:100,maxhp:100,hunger:100,stam:100,sanity:100,karma:0,coins:20,infected:0,weapon:'rapier',lantern:false,
 inv:{bread:2,torch:1,rapier:1,plank:1},ammo:0,quests:{},qactive:[],companions:[],dispo:{},looted:{},planted:0,
 killsByFoe:{},taxPaid:false,debtBook:0,shoeFound:0,bellRung:false,endingShown:false,pos:{x:6,z:10}};
QUESTS.forEach(q=>G.quests[q.id]={st:'lock',have:{}});
G.work={};G.shifts=0;G.grave=null;G.mana=100;G.maxmana=100;G.haggle={xp:0,tier:0};G.traits=[];
G.song=null;G.songGap=6;G.autoplay=true;G.musicHold=false;G.lastSong=null;G.sneaking=false;
function qdef(id){return QUESTS.find(q=>q.id===id);}
function karmaTitle(k){if(k>=60)return 'Saint of the Bayou';if(k>=35)return 'Friend of the Commune';if(k>=12)return 'Trusted Neighbour';if(k>-12)return 'Wanderer of the Bayou';if(k>-35)return 'Suspect Soul';if(k>-60)return 'Hound of the Seigneur';return 'Butcher of the Mud';}
function addKarma(n,why){G.karma=clamp(G.karma+n,-100,100);toast((n>0?'+':'')+n+' ⚖ '+(why||''),n>=0?'good':'bad');refreshHUD();}
function addItem(id,n){n=n||1;if(id==='coin'){G.coins+=n;refreshHUD();return;}G.inv[id]=(G.inv[id]||0)+n;if(G.inv[id]<=0)delete G.inv[id];checkQuestItem();refreshHUD();refreshHotbar();}
function hasItem(id,n){if(id==='coin')return G.coins>=(n||1);return (G.inv[id]||0)>=(n||1);}
function takeItem(id,n){n=n||1;if(id==='coin'){G.coins-=n;refreshHUD();return true;}if((G.inv[id]||0)<n)return false;G.inv[id]-=n;if(G.inv[id]<=0)delete G.inv[id];refreshHUD();refreshHotbar();return true;}

/* ============ THREE SETUP ============ */
let renderer,scene,camera,sun,moon,hemi,torchLight,playerMesh,lanternLight;
let camYaw=0,camDist=26,camH=20; // fixed isometric, Zomboid-style: W walks screen-up (north)
const colliders=[],interactables=[],foes=[],npcs=[],fires=[],labels=[],torches=[],critters=[],horses=[],carts=[],barricades=[],boats=[],kegs=[],WATER=[],FOLIAGE=[];
function regLeaf(m){FOLIAGE.push({m,base:m.material.color.clone()});}
const WORLD=240;
function mat(c){return new THREE.MeshLambertMaterial({color:c});}
/* ---- procedural HD textures (canvas-baked, no downloads) ---- */
function canvasTex(size,fn,rx,ry){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');fn(x,size);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rx)t.repeat.set(rx,ry||rx);
 t.colorSpace=THREE.SRGBColorSpace;return t;}
function grain(x,s,n,cols){for(let i=0;i<n;i++){x.fillStyle=cols[Math.floor(Math.random()*cols.length)];x.globalAlpha=rand(0.15,0.5);x.fillRect(rand(0,s),rand(0,s),rand(1,4),rand(1,4));}x.globalAlpha=1;}
const TEX={
 mud:canvasTex(256,(x,s)=>{x.fillStyle='#b8ad99';x.fillRect(0,0,s,s);grain(x,s,900,['#a89d89','#c8bda9','#988d79','#d8cdb9']);},24,24),
 daub:canvasTex(256,(x,s)=>{x.fillStyle='#d8c8a8';x.fillRect(0,0,s,s);grain(x,s,700,['#c8b898','#e8d8b8','#b8a888']);x.strokeStyle='rgba(90,70,45,0.5)';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(0,i*64);x.lineTo(s,i*64);x.stroke();x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,s);x.stroke();}},1,1),
 thatch:canvasTex(256,(x,s)=>{x.fillStyle='#b09a68';x.fillRect(0,0,s,s);x.lineWidth=2;for(let r=0;r<8;r++){x.strokeStyle=r%2?'#a08a58':'#c0aa78';for(let i=0;i<40;i++){const y=r*32+rand(0,8);x.beginPath();x.moveTo(rand(-10,s),y);x.lineTo(rand(0,s+10),y+rand(-4,10));x.stroke();}}},2,2),
 shingle:canvasTex(256,(x,s)=>{x.fillStyle='#8a8078';x.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let cix=0;cix<8;cix++){x.fillStyle=(r+cix)%2?'#948a80':'#7a7068';x.fillRect(cix*32+(r%2?16:0)-16,r*32,30,30);}},2,2),
 wood:canvasTex(256,(x,s)=>{x.fillStyle='#a8845e';x.fillRect(0,0,s,s);for(let i=0;i<46;i++){x.strokeStyle='rgba(80,55,30,'+rand(0.3,0.7)+')';x.lineWidth=rand(1,3);const y=rand(0,s);x.beginPath();x.moveTo(0,y);x.bezierCurveTo(s*0.3,y+rand(-6,6),s*0.7,y+rand(-6,6),s,y);x.stroke();}},1,1),
 stone:canvasTex(256,(x,s)=>{x.fillStyle='#c2c2b8';x.fillRect(0,0,s,s);grain(x,s,500,['#b2b2a8','#d2d2c8','#a2a29a']);x.strokeStyle='rgba(90,90,86,0.6)';x.lineWidth=2;for(let i=0;i<=3;i++){x.beginPath();x.moveTo(0,i*85);x.lineTo(s,i*85);x.stroke();}},1,1),
 water:canvasTex(256,(x,s)=>{x.fillStyle='#b8d4de';x.fillRect(0,0,s,s);x.strokeStyle='rgba(70,110,120,0.4)';x.lineWidth=2;for(let i=0;i<26;i++){const y=rand(0,s);x.beginPath();x.moveTo(rand(0,s),y);x.lineTo(rand(0,s),y+rand(-3,3));x.stroke();}},3,3),
 glow:canvasTex(128,(x,s)=>{const g=x.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(255,200,120,1)');g.addColorStop(0.4,'rgba(255,150,60,0.5)');g.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=g;x.fillRect(0,0,s,s);}),
 soft:canvasTex(128,(x,s)=>{const g=x.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(200,210,220,0.55)');g.addColorStop(1,'rgba(200,210,220,0)');x.fillStyle=g;x.fillRect(0,0,s,s);}),
};
function texed(c,t){return new THREE.MeshLambertMaterial({color:c,map:t});}
let waterTex=TEX.water;
function glowAt(x,y,z,s,op){const m=new THREE.SpriteMaterial({map:TEX.glow,transparent:true,opacity:op||0.7,depthWrite:false,blending:THREE.AdditiveBlending});const sp=new THREE.Sprite(m);sp.position.set(x,y,z);sp.scale.set(s,s,1);scene.add(sp);return sp;}
/* ---- particles: embers, rain, blood ---- */
const PMAX=360;let pGeo=null,pPts=null;const pData=[];
function initParticles(){pGeo=new THREE.BufferGeometry();
 const pos=new Float32Array(PMAX*3),col=new Float32Array(PMAX*3);
 pGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.PointsMaterial({size:0.4,map:TEX.glow,vertexColors:true,transparent:true,opacity:0.95,depthWrite:false,blending:THREE.AdditiveBlending});
 pPts=new THREE.Points(pGeo,m);pPts.frustumCulled=false;scene.add(pPts);
 for(let i=0;i<PMAX;i++)pData.push({life:0,max:1,x:0,y:-99,z:0,vx:0,vy:0,vz:0,r:1,g:1,b:1});}
const _tmpC=new THREE.Color();
function spawnP(x,y,z,vx,vy,vz,life,hex){for(const p of pData){if(p.life>0)continue;p.life=life;p.max=life;p.x=x;p.y=y;p.z=z;p.vx=vx;p.vy=vy;p.vz=vz;_tmpC.setHex(hex);p.r=_tmpC.r;p.g=_tmpC.g;p.b=_tmpC.b;return;}}
function updateParticles(dt){if(!pGeo)return;const pos=pGeo.attributes.position.array,col=pGeo.attributes.color.array;
 for(let i=0;i<PMAX;i++){const p=pData[i];
  if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.life<=0)p.y=-99;}
  pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;
  const f=Math.max(0,p.life/p.max);col[i*3]=p.r*f;col[i*3+1]=p.g*f;col[i*3+2]=p.b*f;}
 pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
 if(G.started&&!G.paused){for(const f of fires){if(Math.random()<dt*10)spawnP(f.x+rand(-0.4,0.4),1.4,f.z+rand(-0.4,0.4),rand(-0.3,0.3),rand(1,2.4),rand(-0.3,0.3),rand(0.8,1.6),0xff9a3a);}
  if(G.weather==='rain'){for(let i=0;i<3;i++)spawnP(G.pos.x+rand(-28,28),rand(8,16),G.pos.z+rand(-28,28),0,-26,0,1.1,0x4a6a9a);}}}
const mists=[];
function initMist(){for(let i=0;i<9;i++){const m=new THREE.SpriteMaterial({map:TEX.soft,transparent:true,opacity:0.1,depthWrite:false});const s=new THREE.Sprite(m);
 const sw=i<5;s.position.set(sw?rand(-10,30):rand(-80,-50),2,sw?rand(60,95):rand(-5,20));s.scale.set(rand(10,18),rand(4,7),1);scene.add(s);mists.push(s);}}
function initThree(){
 const cv=$('game-canvas');
 renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
 renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
 renderer.setSize(innerWidth,innerHeight);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 scene=new THREE.Scene();scene.background=new THREE.Color(0x0a0d14);
 scene.fog=new THREE.FogExp2(0x0d1210,0.0055);
 camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,600);
 hemi=new THREE.HemisphereLight(0x8a90b0,0x2a2418,0.7);scene.add(hemi);
 const amb=new THREE.AmbientLight(0x2a3040,0.5);scene.add(amb);scene.userData.amb=amb;
 const chapelGlow=new THREE.PointLight(0xffc46a,1.2,26);chapelGlow.position.set(-34,4,-12);scene.add(chapelGlow);
 const marketGlow=new THREE.PointLight(0xffb45a,1.0,24);marketGlow.position.set(14,4,-6);scene.add(marketGlow);
 sun=new THREE.DirectionalLight(0xffe0b0,1.1);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.6;
 sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun);scene.add(sun.target);
 moon=new THREE.DirectionalLight(0x6a7aff,0.0);scene.add(moon);scene.add(moon.target);
 torchLight=new THREE.PointLight(0xff9a3a,0,40);scene.add(torchLight);
 lanternLight=new THREE.PointLight(0xffc46a,0,26);scene.add(lanternLight);
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
function makeLabel(txt,scale){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
 x.fillStyle='rgba(8,6,4,0.72)';x.fillRect(0,48,1024,160);x.strokeStyle='#c9a227';x.lineWidth=6;x.strokeRect(8,56,1008,144);
 x.fillStyle='#e8dcc0';x.textAlign='center';x.textBaseline='middle';
 let fs=84;x.font=fs+'px Georgia';while(x.measureText(txt).width>950&&fs>20){fs-=4;x.font=fs+'px Georgia';}
 x.shadowColor='#000';x.shadowBlur=12;x.fillText(txt,512,132);
 const t=new THREE.CanvasTexture(c);const m=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false});
 const s=new THREE.Sprite(m);s.scale.set(10*(scale||1),2.5*(scale||1),1);return s;}

/* ============ WORLD ============ */
function addBox(x,y,z,w,h,d,c,ry,mOverride){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mOverride||mat(c));m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
function addRoof(x,y,z,w,d,c,mOverride){const g=new THREE.CylinderGeometry(0.01,Math.sqrt(w*w+d*d)/2,3.4,4,1);const m=new THREE.Mesh(g,mOverride||mat(c));m.position.set(x,y,z);m.rotation.y=Math.PI/4;m.scale.set(w/Math.sqrt(w*w+d*d)*1.42,1,d/Math.sqrt(w*w+d*d)*1.42);m.castShadow=true;scene.add(m);return m;}
function solid(x,z,w,d){colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});}
function buildWorld(){
 // ground: big plane + painted patches
 const gg=new THREE.PlaneGeometry(WORLD,WORLD,48,48);gg.rotateX(-Math.PI/2);
 const cols=[];const base=new THREE.Color(0x3d4a2e);
 for(let i=0;i<gg.attributes.position.count;i++){const px=gg.attributes.position.getX(i),pz=gg.attributes.position.getZ(i);
  const sw=Math.hypot(px-10,pz-80);const v=new THREE.Color(0x3d4a2e);
  if(sw<34)v.setHex(0x2a3a33); // swamp dark
  if(Math.abs(px)<60&&Math.abs(pz)<60)v.setHex(0x4a4230); // trampled town mud
  if(Math.abs(px-14)<8&&Math.abs(pz+6)<20)v.setHex(0x5a4c34); // market path
  const n=(Math.sin(px*0.7)*Math.cos(pz*0.6)+Math.sin(px*0.23+pz*0.31))*0.5;
  v.offsetHSL(0,0,n*0.03);cols.push(v.r,v.g,v.b);}
 gg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
 const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({vertexColors:true,map:TEX.mud}));ground.receiveShadow=true;scene.add(ground);
 // water ponds (swamp)
 const wmat=new THREE.MeshLambertMaterial({color:0x8899aa,map:TEX.water,transparent:true,opacity:0.92});
 [[10,80,26,20],[-40,60,12,9],[40,66,14,10]].forEach(([x,z,w,d])=>{WATER.push({x,z,rx:w,rz:d});const p=new THREE.Mesh(new THREE.CircleGeometry(1,24),wmat);p.rotation.x=-Math.PI/2;p.position.set(x,0.06,z);p.scale.set(w,d,1);scene.add(p);});
 // cypress + reeds + oaks
 for(let i=0;i<130;i++){const x=rand(-115,115),z=rand(-115,115);if(Math.abs(x)<62&&Math.abs(z)<62&&Math.random()<0.7)continue;
  const swampy=dist2(x,z,10,80)<36;
  if(swampy&&Math.random()<0.5){ // cypress knee + trunk
   const t=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.9,rand(7,11),7),mat(0x4a3a28));t.position.set(x,3.5,z);t.castShadow=true;scene.add(t);
   const c=new THREE.Mesh(new THREE.ConeGeometry(rand(2.5,4),rand(4,7),8),mat(0x2e4a2e));c.position.set(x,9,z);scene.add(c);regLeaf(c);
   const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.4),new THREE.MeshLambertMaterial({color:0x6a7a5a,transparent:true,opacity:0.7}));m.position.set(x+1,7,z);scene.add(m);
  } else {const t=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.6,rand(4,7),6),mat(0x4a3a28));t.position.set(x,2.5,z);t.castShadow=true;scene.add(t);
   const c=new THREE.Mesh(new THREE.SphereGeometry(rand(2,3.4),8,7),mat(Math.random()<0.5?0x2e4a26:0x3a5a2e));c.position.set(x,6,z);scene.add(c);}
 }
 // palisade walls (circle of stakes)
 for(let a=0;a<Math.PI*2;a+=Math.PI/44){const x=Math.cos(a)*58,z=Math.sin(a)*58;
  if(Math.abs(x-6)<5&&z>50)continue; // south gate gap
  if(Math.abs(x+56)<6&&Math.abs(z-2)<5)continue; // west gate
  const s=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.4,6,5),mat(0x5a4630));s.position.set(x,3,z);s.castShadow=true;scene.add(s);}
 solid(58,0,4,120);solid(-58,0,4,120); // approx gate funnels (keeps player roughly in world via bounds anyway)
 // buildings: [name,x,z,w,d,wall,roof,desc]
 const B=[
  ['Seigneur’s Manor',0,-46,16,10,0x8a7a5a,0x4a2a1a,'Two-storey colombage, stolen cypress. Candlelight upstairs; ledgers downstairs.'],
  ['Chapel of St. Mud',-34,-12,10,14,0x9a8a6a,0x3a2a1a,'Unconsecrated chapel. Sanctuary ground — apparitions weaken here. Bell rope inside.'],
  ['Market Row',14,-6,14,6,0x7a5a3a,0x5a3a1a,'Stalls of bread, iron, gossip. Prices obey karma.'],
  ['Smithy',26,-20,8,8,0x6a5a4a,0x2a2a2a,'Forge never cold. Baptiste shoes horses and sharpens arguments.'],
  ['Herbalist Hut',-16,26,7,7,0x6a5a3a,0x4a5a2a,'Smoke of mugwort. Manon’s door is open to all but taxmen.'],
  ['Cabin Row West',20,28,7,6,0x7a6248,0x5a4a2a,'Indenture cabins, six souls to a room.'],
  ['Cabin Row East',28,30,7,6,0x7a6248,0x5a4a2a,'Indenture cabins. Notches on the doorframe count years.'],
  ['Warehouse',-6,-22,10,7,0x6a5a40,0x3a2a1a,'Compagnie storehouse. Guarded by hunger and one old dog.'],
  ['Ruined Mission',78,20,9,12,0x7a7a7a,0x2a2a2a,'Burnt Jesuit mission. Sang-Mêlé parley here at dusk.'],
  ['Swamp Shack',10,74,6,6,0x5a4a38,0x3a4a2a,'Jean-Baptiste’s shack on stilts. Dry floor, wet philosophy.'],
  ['Bayou Hut',-52,52,6,5,0x5a4a38,0x3a4a2a,'Landing hut. Nets, pirogues, and news from the maroons.'],
  ['Gallows Oak Hut',-8,-30,5,5,0x6a5a40,0x3a2a1a,'Rope-store by the old oak. Nobody volunteers to sweep.'],
  ['Fishing Hut',-59,43,6,5,0x5a4a38,0x3a4a2a,'Nets, lines, and the smell of honest work. Poles by the door.'],
  ['Smoke Hut',-14,94,5,5,0x5a4a38,0x3a3a3a,'Crabs and fish smoke here. The mosquitoes respect it.'],
  ['Hunting Cabin',34,92,7,6,0x6a5238,0x4a3a22,'Antler pegs, drying racks, and quiet. Mind the bear sign.'],
  ['Trapper Cabin',56,24,6,5,0x6a5238,0x4a3a22,'Pelts stretched, traps oiled. The east woods pay in fur.'],
 ];
 B.forEach(([nm,x,z,w,d,wall,roof])=>{
  addBox(x,1.7,z,w,3.4,d,wall,0,texed(wall,TEX.daub));addRoof(x,5.1,z,w+1.4,d+1.4,roof,texed(roof,((roof&0x303030)<0x202020)?TEX.shingle:TEX.thatch));
  // timber frame stripes
  addBox(x,1.7,z+d/2+0.06,w,3.2,0.12,0x2a2018);addBox(x-w/2-0.06,1.7,z,0.12,3.2,d,0x2a2018);
  // door glow
  const dr=addBox(x,1.1,z+d/2+0.15,1.6,2.2,0.2,0x1a120a);dr.name='door:'+nm;
  const win=addBox(x+w/4,2.2,z+d/2+0.12,1.2,0.9,0.15,0xffc46a);win.material=new THREE.MeshBasicMaterial({color:0xffc46a});labels.push({m:win,nm});
  solid(x,z,w+0.6,d+0.6);
  const lb=makeLabel(nm,0.9);lb.position.set(x,8.4,z);scene.add(lb);
  interactables.push({kind:'door',name:nm,x:x,z:z+d/2+1.6,r:3,txt:'Enter '+nm});
 });
 // gallows
 addBox(-8,3,-34,0.5,6,0.5,0x3a2a1a);addBox(-6,3,-34,0.5,6,0.5,0x3a2a1a);addBox(-7,5.8,-34,5,0.5,0.5,0x3a2a1a);
 const rope=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,2,5),mat(0x9a8a6a));rope.position.set(-7,4.6,-34);scene.add(rope);
 solid(-7,-34,5,1);
 // cemetery crosses
 for(let i=0;i<22;i++){const x=rand(-84,-56),z=rand(-6,22);addBox(x,0.7,z,0.18,1.4,0.18,0x8a8072);addBox(x,1,z,0.8,0.18,0.18,0x8a8072);
  if(i<6)interactables.push({kind:'grave',name:'Shallow grave '+(i+1),x,z,r:2.6,txt:'Bury / mourn (E)',id:'grave'+i});}
 // market stalls + crates (loot)
 const lootSpots=[[12,-2,'Market crate'],[26,-16,'Smith crate'],[-14,24,'Herb bundle'],[4,-44,'Manor chest'],[76,18,'Mission cache'],[10,72,'Swamp cache'],[-50,50,'Landing cache'],[-32,-8,'Chapel box'],[22,26,'Cabin chest'],[-70,10,'Grave goods'],[-57,45,'Tackle box'],[54,22,'Trap cache']];
 lootSpots.forEach(([x,z,nm])=>{const c=addBox(x,0.5,z,1.2,1,1.2,0x6a4a26);c.material.emissive=new THREE.Color(0x332200);
  interactables.push({kind:'loot',name:nm,x,z,r:2.8,txt:'Search '+nm});});
 // campfires / braziers
 [[-30,-6],[24,24],[10,70],[-48,48],[0,-38]].forEach(([x,z])=>{
  const st=addBox(x,0.3,z,1.6,0.6,1.6,0x5a5a5a);const fl=new THREE.PointLight(0xff8a3a,1.4,18);fl.position.set(x,1.6,z);scene.add(fl);
  const f=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.2,7),new THREE.MeshBasicMaterial({color:0xff9a3a}));f.position.set(x,1.2,z);scene.add(f);fires.push({x,z,flame:f,light:fl});glowAt(x,1.8,z,6,0.5);
  interactables.push({kind:'fire',name:'Campfire',x,z,r:3,txt:'Rest by fire (heal/sanity)'});});
 // chapel bell + brazier of ash
 addBox(-34,2.5,-16,0.4,5,0.4,0x3a2a1a);const bellm=new THREE.Mesh(new THREE.ConeGeometry(0.7,1,8),new THREE.MeshLambertMaterial({color:0xc9a227}));bellm.position.set(-34,5.4,-16);scene.add(bellm);
 interactables.push({kind:'bell',name:'Chapel bell',x:-34,z:-16,r:3,txt:'Ring the bell'});
 interactables.push({kind:'brazier',name:'Chapel brazier',x:-31,z:-14,r:2.6,txt:'Take consecrated ash'});
 // demon stain in swamp
 const stain=new THREE.Mesh(new THREE.CircleGeometry(4,20),new THREE.MeshBasicMaterial({color:0x5a0a00,transparent:true,opacity:0.75}));stain.rotation.x=-Math.PI/2;stain.position.set(14,0.09,84);scene.add(stain);
 interactables.push({kind:'stain',name:'Demon-stain',x:14,z:84,r:4,txt:'Cleanse the stain (needs 2 ash)'});
 // manor ledgers + market cross + shoe
 interactables.push({kind:'cross',name:'Market cross',x:14,z:-1,r:3,txt:'Read / deliver the debt-book'});
 // torch posts with lights
 [[6,4],[-28,-4],[20,-12],[-12,20],[48,40]].forEach(([x,z])=>{addBox(x,1.5,z,0.25,3,0.25,0x3a2a1a);
  const l=new THREE.PointLight(0xffa04a,1.0,20);l.position.set(x,3.4,z);scene.add(l);torches.push(l);
  const f=new THREE.Mesh(new THREE.SphereGeometry(0.25,8,6),new THREE.MeshBasicMaterial({color:0xffc46a}));f.position.set(x,3.3,z);scene.add(f);glowAt(x,3.4,z,3.5,0.5);});
 plantForage();spawnHorses();placeCarts();placeBeds();placeWorks();buildGraveyard();buildMansion();buildCottages();placeAltars();buildPigstye();buildTavern();
 // corral rails by the cabins
 [[26,34,8,0.3],[26,40,8,0.3]].forEach(([x,z,w,d])=>{addBox(x,0.6,z,w,1.0,d,0x5a4630);});
}
/* ============ WORK & PROFESSIONS ============ */
const TIER_NAMES=['Day-labourer','Apprentice','Journeyman','Master','Grandmaster'];
const TIER_XP=[0,8,20,40,70];
function tierFor(xp){let t=0;for(let i=0;i<TIER_XP.length;i++)if(xp>=TIER_XP[i])t=i;return t;}
const JOBS={
 carpenter:{n:'Carpenter',e:'🪚',pay:6,sanity:5,cd:60000,make:'plank',makeN:2,xp:1,karma:1,site:'Sawpit, cabin row',shift:['You rip cypress all shift. The sawdust smells like honesty.','Mortise, tenon, peg. The chapel door hangs true.','You square a beam the Seigneur will never pay for — and keep the offcuts.']},
 cook:{n:'Cook',e:'🍳',pay:4,sanity:6,cd:60000,make:'stew',makeN:1,xp:1,karma:1,site:'Cookfire, market row',shift:['You stir a pot big enough to baptise in.','Okra, pepper, patience. The row eats tonight.','You scrape the pot and feed the scraps to the thin ones first.']},
 pirate:{n:'Pirate',e:'🏴‍☠️',pay:12,sanity:4,cd:120000,xp:2,karma:-1,site:'Smuggler’s cache, bayou landing',shift:['Crates land with no names on them. Yours is the back that carries them.','Tafia in, muskets out. The taxman sees nothing.','You row past the survey stakes by moonlight, whistling.']},
 fisherman:{n:'Fisherman',e:'🎣',pay:4,sanity:7,cd:60000,make:'crawfish',makeN:1,xp:1,karma:1,site:'Fishing spots, bayou & swamp',shift:['You check the traps at grey dawn. The water pays.','A gar sulks past your lines. The crawfish do not sulk.','You mend nets and hum; the herons approve.']},
 hunter:{n:'Hunter',e:'🏹',pay:5,sanity:6,cd:75000,xp:1,karma:1,site:'Trapper’s post, east woods',table:[['rabbit',1,0.5],['squirrel',1,0.3],['turkey',1,0.15],['venison',1,0.08]],site2:'',shift:['You walk the trapline before the mist lifts.','Something rustles; supper volunteers.','You read tracks like parish registers.']},
 sheriff:{n:'Sheriff',e:'🤠',pay:7,sanity:5,cd:90000,xp:1,karma:2,site:'Watch post, gallows oak',shift:['You walk the rounds, lantern high. Doors unbar at your step.','You settle a dispute over a pig with Solomon’s patience.','The night shift tips its hat to you.']},
 soldier:{n:'Retired soldier',e:'🎖',pay:6,sanity:5,cd:75000,make:'ammo',makeN:2,xp:1,karma:1,site:'Drill yard, south gate',shift:['Left! Right! The militia learns to stand together.','You teach trigger discipline and latrine digging, in that order.','Old war stories for new recruits. The fear gets smaller.']},
 tavern:{n:'Tavern keeper',e:'🍺',pay:6,sanity:6,cd:60000,xp:1,karma:1,site:'Grog stall, market row',shift:['You pull tafia and pour out the news with it.','A song, a round, a shoulder. The stall glows.','You water nothing and short nobody. Saints drink here.']},
 smith:{n:'Smith',e:'⚒',pay:6,sanity:5,cd:60000,need:'plank',make:'nail',makeN:2,xp:1,karma:1,site:'Forge, smithy',shift:['Sparks write brief sermons on the dark.','You turn a plank’s worth of charcoal into honest nails.','Horseshoes by day, hinges for the chapel by night.']},
 farmer:{n:'Farmer',e:'🌾',pay:4,sanity:7,cd:60000,xp:1,karma:1,site:'Garden plots, cabin row',table:[['onion',1,0.4],['groundnut',1,0.35],['bread',1,0.25]],shift:['You hill the rows and curse the cutworms kindly.','Rain does half your work; you do it double anyway.','The commune’s acres, worked in common, green up.']},
 banker:{n:'Banker',e:'🏦',pay:8,sanity:3,cd:90000,xp:1,karma:1,site:'Counting desk, manor',shift:['You reconcile the ledger — and quietly forgive a cabin debt.','Interest compounds; so does your patience.','You count coin all day and wash your hands twice.']},
 tycoon:{n:'Tycoon',e:'💹',pay:2,sanity:3,cd:120000,stake:10,xp:2,karma:0,site:'Exchange corner, market',shift:['You corner the muscadine market by noon.','Buy low in the mud, sell high on the hill.','Risk, tells the pamphlet, is just labour that sweats.']},
 sewer:{n:'Sewer cleaner',e:'🧹',pay:9,sanity:2,cd:90000,xp:1,karma:2,risk:0.1,site:'Drainage ditches, swamp edge',shift:['Night-soil and glory, carted out before dawn.','The ditches run clear. The fever bidra — retreats.','Nobody claps, but everybody breathes easier.']},
 crier:{n:'Town cryer',e:'📯',pay:5,sanity:6,cd:60000,xp:1,karma:2,site:'Crier’s stone, market cross',shift:['“Hear ye!” The row gathers; the news is true for once.','You cry the lost, the found, and the price of bread.','Your lungs are the parish gazette.']},
};
function initWork(){if(!G.work)G.work={};for(const k in JOBS)if(!G.work[k])G.work[k]={xp:0,tier:0};}
function workShift(st){const J=JOBS[st.job];if(!J)return;const w=G.work[st.job];
 if(J.need&&!hasItem(J.need,1)){toast('Need 1 '+ITEMS[J.need].n+' to work this shift.','bad');return;}
 if(J.stake&&G.coins<J.stake){toast('Need a '+J.stake+'-livre stake to speculate.','bad');return;}
 if(J.need)takeItem(J.need,1);
 if(J.stake)G.coins-=J.stake;
 const mult=1+0.3*w.tier;
 let pay=Math.round(J.pay*mult*rand(0.9,1.25));
 if(J.stake)pay+=Math.round(J.stake*rand(1.15,1.6)*(1+0.1*w.tier));
 G.coins+=pay;
 if(J.make)addItem(J.make,J.makeN+(w.tier>=2?1:0));
 if(J.table){const r=Math.random();let acc=0;for(const [id,n,ch] of J.table){acc+=ch;if(r<acc){addItem(id,n+(w.tier>=2?1:0)+((st.job==='farmer')?Math.floor(skillLvl('farm')/3):0)+((st.job==='farmer'&&T('gardener'))?1:0));break;}}}
 w.xp+=J.xp||1;G.shifts=(G.shifts||0)+1;
 if(JOB_SKILL[st.job])gainXp(JOB_SKILL[st.job],2);
 const nt=tierFor(w.xp);
 if(nt>w.tier){w.tier=nt;notify('⚒','Promotion: '+J.n+' — '+TIER_NAMES[nt],'Better pay, better peace.',{major:true,action:{label:'Labours',fn:()=>togglePanel('panel-work',renderWork)}});AudioSys.sfx('quest');}
 const sg=J.sanity+Math.min(6,w.tier*2);G.sanity=clamp(G.sanity+sg,0,100);
 if(J.karma)addKarma(J.karma,J.n.toLowerCase()+'’s shift');
 if(J.risk&&Math.random()<J.risk*(T('prone')?2:1)){G.infected=1;toast('🤢 The ditch air gets in. Miasma fever! Herb or tonic.','bad');}
 st.cd=performance.now()+J.cd;AudioSys.sfx('craft');
 toast(J.e+' '+choice(J.shift)+'<br>(+'+pay+' 🪙, +'+sg+' 🕯, '+TIER_NAMES[w.tier]+')','good');
 workProgress(st.job);refreshHUD();refreshHotbar();refreshTracker();}
function workProgress(job){for(const id of [...G.qactive]){const q=qdef(id);if(!q.obj.some(o=>o.t==='work'))continue;const s=G.quests[id];s.have['w_'+job]=(s.have['w_'+job]||0)+1;
 let done=true;for(const o of q.obj){if(o.t==='work'&&(s.have['w_'+o.job]||0)<o.n)done=false;
  if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);if(h<o.n)done=false;}
  if(o.t==='kill'&&(s.have['k_'+o.foe]||0)<o.n)done=false;
  if(o.t==='forage'&&(s.have.forage||0)<o.n)done=false;if(o.t==='hunt'&&(s.have.hunt||0)<o.n)done=false;
  if(o.t==='bury'&&(s.have.bury||0)<o.n)done=false;if(o.t==='visit'&&!s.have['v_'+o.zone])done=false;
  if(o.t==='tax'&&!G.taxPaid)done=false;if(o.t==='torch'&&(G.planted||0)<o.n)done=false;
  if(o.t==='work'&&(s.have['w_'+o.job]||0)<o.n)done=false;if(o.t==='ritual'&&(s.have.ritual||0)<o.n)done=false;}
 if(done)completeQuest(id);}refreshTracker();}
function makeWorkMesh(job){const g=new THREE.Group();const J=JOBS[job];
 const top=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.18,0.9),mat(0x6a4a26));top.position.y=0.85;g.add(top);
 for(const [lx,lz] of [[-0.6,0.3],[-0.6,-0.3],[0.6,0.3],[0.6,-0.3]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.85,0.12),mat(0x4a3018));l.position.set(lx,0.42,lz);g.add(l);}
 if(job==='smith'){const a=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.4,0.4),mat(0x2a2a2e));a.position.y=1.15;g.add(a);}
 else if(job==='cook'){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.3,0.4,8),mat(0x1a1a1a));p.position.y=1.15;g.add(p);
  const f=new THREE.Mesh(new THREE.ConeGeometry(0.25,0.5,6),new THREE.MeshBasicMaterial({color:0xff8a3a}));f.position.set(0.9,0.3,0);g.add(f);}
 else if(job==='banker'||job==='tycoon'){const p=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.35,0.08),mat(0xe8e0cc));p.position.set(-0.3,1.2,0);p.rotation.y=0.4;g.add(p);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.3,8),mat(0xc9a227));c.position.set(0.4,1.1,0);g.add(c);}
 else if(job==='tavern'||job==='pirate'){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.7,9),mat(0x5a3a1a));b.position.set(0,1.3,0);g.add(b);}
 else if(job==='fisherman'){const r=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.2,5),mat(0x6a4a26));r.position.set(0.3,1.4,0);r.rotation.z=0.5;g.add(r);}
 else if(job==='crier'){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,2.4,6),mat(0x4a3018));p.position.set(-0.7,1.2,0);g.add(p);
  const b=new THREE.Mesh(new THREE.ConeGeometry(0.25,0.35,8),mat(0xc9a227));b.position.set(-0.7,2.5,0);g.add(b);}
 else if(job==='farmer'){const s=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.4),mat(0x2e2018));s.rotation.x=-Math.PI/2;s.position.set(0,0.06,1.4);g.add(s);
  for(let i=0;i<4;i++){const sp=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.5,5),mat(0x4a7a2e));sp.position.set(-0.8+i*0.5,0.3,1.4);g.add(sp);}}
 else if(job==='sewer'){const m=new THREE.Mesh(new THREE.SphereGeometry(0.4,7,5),mat(0x3a2e1e));m.position.set(0.9,0.2,0.6);m.scale.y=0.6;g.add(m);
  const s=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,1.6,5),mat(0x6a4a26));s.position.set(-0.7,0.8,0);s.rotation.z=0.4;g.add(s);}
 else if(job==='soldier'){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.8,5),mat(0x4a3018));p.position.set(-0.6,0.9,0);g.add(p);
  const c=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.15,0.15),mat(0x4a3018));c.position.set(-0.6,1.5,0);g.add(c);}
 else if(job==='sheriff'){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,2.2,5),mat(0x3a2a1a));p.position.set(-0.7,1.1,0);g.add(p);
  const l=new THREE.Mesh(new THREE.SphereGeometry(0.16,7,5),new THREE.MeshBasicMaterial({color:0xffc46a}));l.position.set(-0.7,2.2,0);g.add(l);}
 else if(job==='hunter'){for(const s of [-0.6,0.6]){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.8,5),mat(0x4a3018));p.position.set(s,0.9,0);g.add(p);}
  const b=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.5,5),mat(0x4a3018));b.rotation.z=Math.PI/2;b.position.set(0,1.6,0);g.add(b);}
 else{const l=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.25,0.25),mat(0x8a6a3a));l.position.set(0,1.1,0);g.add(l);}
 const lb=makeLabel(J.e+' '+J.n,0.45);lb.position.set(0,2.4,0);g.add(lb);
 return g;}
function buildGraveyard(){
 for(let x=-86;x<=-54;x+=3){for(const z of [-8,24])addBox(x,0.9,z,0.25,1.8,0.25,0x2a2a2e);}
 for(let z=-8;z<=24;z+=3){addBox(-86,0.9,z,0.25,1.8,0.25,0x2a2a2e);if(z<6||z>10)addBox(-54,0.9,z,0.25,1.8,0.25,0x2a2a2e);}
 addBox(-70,1.3,-8,32,0.12,0.12,0x2a2a2e);addBox(-70,1.3,24,32,0.12,0.12,0x2a2a2e);addBox(-86,1.3,8,0.12,0.12,32,0x2a2a2e);
 [[-80,-2],[-80,16],[-60,-4]].forEach(([x,z],i)=>{addBox(x,1.2,z,4,2.4,3,0x8a8072);addBox(x,2.7,z,4.6,0.5,3.6,0x6a6a6a);solid(x,z,4.4,3.4);
  if(i===0)interactables.push({kind:'loot',name:'Vault cache',x:x,z:z+2.6,r:2.6,txt:'Search Vault cache'});});
 addBox(-66,1.7,20,6,3.4,5,0x7a7a72);addRoof(-66,5.1,20,7.4,6.4,0x2a2a2a);solid(-66,20,6.6,5.6);
 const lb=makeLabel('Vault of the Unpaid',0.8);lb.position.set(-66,8,20);scene.add(lb);
 for(let i=0;i<14;i++){const x=rand(-84,-56),z=rand(-6,22);addBox(x,0.7,z,0.18,1.4,0.18,0x8a8072);addBox(x,1,z,0.8,0.18,0.18,0x8a8072);}
 const gl=makeLabel('☠ Graveyard of the Unpaid',1.1);gl.position.set(-70,9.5,8);scene.add(gl);}
function buildMansion(){
 const X=88,Z=-38;
 addBox(X,2.5,Z,20,5,12,0x9a8a6a);addBox(X,6.2,Z,18,2.4,10,0x8a7a5a);
 addRoof(X,9.0,Z,21.4,13.4,0x3a2018);
 addBox(X-14,1.7,Z,8,3.4,9,0x8a7a5a);addRoof(X-14,4.8,Z,9.4,10.4,0x3a2018);
 addBox(X+14,1.7,Z,8,3.4,9,0x8a7a5a);addRoof(X+14,4.8,Z,9.4,10.4,0x3a2018);
 for(let i=-3;i<=3;i++)addBox(X+i*2.4,1.5,Z+7,0.5,3,0.5,0xd8d0b8);
 addBox(X,3.4,Z+7,18,0.5,2,0x8a7a5a);
 solid(X,Z,20.6,12.6);solid(X-14,Z,8.6,9.6);solid(X+14,Z,8.6,9.6);
 for(const wx of [-5,5]){const w=addBox(X+wx,2.6,Z+6.1,1.4,1,0.15,0x9aff9a);w.material=new THREE.MeshBasicMaterial({color:0x9aff9a});}
 const lb=makeLabel('Maison Lament — the Widow’s Folly',1.0);lb.position.set(X,12.5,Z);scene.add(lb);
 interactables.push({kind:'door',name:'Maison Lament',x:X,z:Z+7.6,r:3,txt:'Enter Maison Lament'});
 for(let x=X-16;x<=X+16;x+=4)addBox(x,0.9,Z+14,0.25,1.8,0.25,0x2a2a2e);
 addBox(X,1.3,Z+14,32,0.12,0.12,0x2a2a2e);
 [['Cellar hatch',76,-30],['Carriage trunk',100,-32],['Study cache',88,-28]].forEach(([nm,lx,lz])=>{
  const c=addBox(lx,0.5,lz,1.2,1,1.2,0x4a2a1a);c.material.emissive=new THREE.Color(0x332200);
  interactables.push({kind:'loot',name:nm,x:lx,z:lz,r:2.8,txt:'Search '+nm});});
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=X+Math.cos(a)*rand(20,30),z=Z+Math.sin(a)*rand(20,30);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.65,6,6),mat(0x3a2c20));t.position.set(x,3,z);t.castShadow=true;scene.add(t);
  const c=new THREE.Mesh(new THREE.SphereGeometry(rand(2.5,4),8,7),mat(0x1e3a22));c.position.set(x,7.5,z);scene.add(c);}
 spawnFoe('vamp',80,-28);spawnFoe('ghost',96,-28);spawnFoe('ghost',88,-48);spawnFoe('skeleton',88,-24);}
function placeWorks(){[['carpenter',22,34],['cook',12,-11],['pirate',-46,56],['fisherman',-44,58],['fisherman',4,74],['hunter',48,8],['sheriff',-3,-34],['soldier',10,44],['tavern',24,-6],['smith',31,-20],['farmer',28,34],['farmer',16,32],['banker',12,-44],['tycoon',10,0],['sewer',0,60],['sewer',-20,44],['crier',16,1]].forEach(([job,x,z])=>{
 const m=makeWorkMesh(job);m.position.set(x,0,z);scene.add(m);
 interactables.push({kind:'work',job,name:JOBS[job].n+' — '+JOBS[job].site,x,z,r:3,txt:'⚒ Work: '+JOBS[job].n+' (E)'});});}
/* ============ BARRICADES & DEATH-DROPS ============ */
function placeBarricade(){const ry=playerMesh?playerMesh.rotation.y:0;
 const x=clamp(G.pos.x+Math.sin(ry)*2.2,-112,112),z=clamp(G.pos.z+Math.cos(ry)*2.2,-112,112);
 const g=new THREE.Group();
 for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.28,0.18),mat(0x6a4a26));p.position.set(0,0.5+i*0.45,0);p.rotation.z=(i-1)*0.18;g.add(p);}
 for(const s of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(0.22,1.7,0.22),mat(0x4a3018));post.position.set(s*1.1,0.85,0);g.add(post);}
 g.position.set(x,0,z);g.rotation.y=ry+Math.PI/2;scene.add(g);
 const coll={x0:x-1.2,x1:x+1.2,z0:z-1.2,z1:z+1.2};colliders.push(coll);
 const maxhp=60+((G.work&&G.work.carpenter?G.work.carpenter.tier:0)*15)+skillLvl('carp')*10+(T('handy')?20:0);
 const it={kind:'barr',name:'Barricade',x,z,r:2.6,txt:'Mend (plank) / tear down (E)',node:g};
 const b={x,z,hp:maxhp,maxhp,mesh:g,coll,inter:it};it.ref=b;
 interactables.push(it);barricades.push(b);
 AudioSys.sfx('craft');toast('🚧 Barricade raised ('+maxhp+' HP). The commune holds. (E: mend · E at full: tear down)','good');}
function breakBarricade(b){scene.remove(b.mesh);b.coll.dead=true;if(b.inter)b.inter.gone=true;
 barricades.splice(barricades.indexOf(b),1);AudioSys.sfx('hit');
 toast('🪵 A barricade gives way! The line is breached.','bad');}
function mendBarricade(b){if(b.hp>=b.maxhp){
  // tear down, refund
  scene.remove(b.mesh);b.coll.dead=true;if(b.inter)b.inter.gone=true;barricades.splice(barricades.indexOf(b),1);
  addItem('plank',2);toast('🪵 Torn down. 2 planks reclaimed.','good');return;}
 if(!hasItem('plank',1)){toast('Need 1 plank to mend.','bad');return;}
 takeItem('plank',1);b.hp=Math.min(b.maxhp,b.hp+25+8*skillLvl('smith')+(T('handy')?15:0));AudioSys.sfx('craft');
 toast('🔨 Mended ('+Math.round(b.hp)+'/'+b.maxhp+' HP).','good');refreshHotbar();}
function graveMarker(g){const m=new THREE.Group();
 const mound=new THREE.Mesh(new THREE.SphereGeometry(0.9,8,5),mat(0x3a2c1c));mound.scale.y=0.4;mound.position.y=0.1;m.add(mound);
 const post=new THREE.Mesh(new THREE.BoxGeometry(0.18,1.3,0.18),mat(0x4a3018));post.position.y=0.65;m.add(post);
 const cross=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.16,0.16),mat(0x4a3018));cross.position.set(0,1.0,0);m.add(cross);
 m.position.set(g.x,0,g.z);scene.add(m);
 const lb=makeLabel('⚰ your satchel',0.5);lb.position.set(0,2.2,0);m.add(lb);return m;}
function linkGrave(){interactables.push({kind:'grave2',name:'Muddy grave',x:G.grave.x,z:G.grave.z,r:3,txt:'Recover your satchel (E)',grave:G.grave});}
function dropSatchel(){const ids=Object.keys(G.inv);
 if(!ids.length&&G.coins<=0){toast('Nothing to lose but chains.','good');return;}
 const dropCoins=Math.floor(G.coins/2);G.coins-=dropCoins;
 G.grave={x:G.pos.x,z:G.pos.z,inv:{...G.inv},coins:dropCoins};G.inv={};
 G.grave.mesh=graveMarker(G.grave);linkGrave();
 refreshHUD();refreshHotbar();}
function recoverGrave(it){const gr=it.grave||G.grave;if(!gr){toast('Only mud.','bad');return;}
 for(const k in gr.inv)addItem(k,gr.inv[k]);G.coins+=gr.coins||0;
 if(gr.mesh)scene.remove(gr.mesh);it.gone=true;G.grave=null;
 AudioSys.sfx('quest');toast('🎒 Satchel recovered. The mud returns what it borrowed.','good');
 refreshHUD();refreshHotbar();refreshTracker();}
/* ============ LIVEABLE HOUSES ============ */
function claimHouse(it){const h=it.home;
 if(G.homeId!==h.id){G.homeId=h.id;G.home={x:h.x,z:h.z};
  notify('⌂','Safehouse claimed: '+h.nm,'You will wake here. Store goods inside. Bar the doorway with bundles.',{major:true});AudioSys.sfx('quest');}
 else{G.sanity=clamp(G.sanity+3,0,100);subtitle('Home. The walls know your name. (+3 🕯)');}refreshHUD();}
function buildCottage(x,z,nm,id){
 const W=0x9a8a68,WM=texed(W,TEX.daub);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(5,4),texed(0x6a5a40,TEX.wood));fl.rotation.x=-Math.PI/2;fl.position.set(x,0.06,z);fl.receiveShadow=true;scene.add(fl);
 addBox(x-1.8,1.3,z+2,1.4,2.6,0.3,W,0,WM);addBox(x+1.8,1.3,z+2,1.4,2.6,0.3,W,0,WM);
 addBox(x,2.4,z+2,1.4,0.4,0.3,W,0,WM);
 solid(x-1.8,z+2,1.4,0.3);solid(x+1.8,z+2,1.4,0.3);
 addBox(x,1.3,z-2,5,2.6,0.3,W,0,WM);solid(x,z-2,5,0.3);
 addBox(x-2.5,1.3,z-1.1,0.3,2.6,1.8,W,0,WM);addBox(x-2.5,1.3,z+1.1,0.3,2.6,1.8,W,0,WM);
 solid(x-2.5,z-1.1,0.3,1.8);solid(x-2.5,z+1.1,0.3,1.8);
 addBox(x+2.5,1.3,z-1.1,0.3,2.6,1.8,W,0,WM);addBox(x+2.5,1.3,z+1.1,0.3,2.6,1.8,W,0,WM);
 solid(x+2.5,z-1.1,0.3,1.8);solid(x+2.5,z+1.1,0.3,1.8);
 addRoof(x,4.3,z,6.4,5.4,0x5a4a2a,texed(0x5a4a2a,TEX.thatch));
 glowAt(x,3.0,z+2.4,3,0.4);
 const lb=makeLabel('⌂ '+nm,0.6);lb.position.set(x,6.4,z);scene.add(lb);
 interactables.push({kind:'hdoor',name:nm+' door',home:{id,x,z,nm},x:x,z:z+2.6,r:2.8,txt:'Claim cottage / rest (E)'});
 // interior: bed, table, stash chest, shelf loot
 const bed={kind:'bed',name:nm+' bed',x:x-1.4,z:z-1.0,r:2.4,txt:'Sleep (E)'};interactables.push(bed);
 addBox(x-1.4,0.35,z-1.0,1.0,0.4,2.0,0x5a4630);addBox(x-1.4,0.6,z-1.0,0.9,0.2,1.8,0x9a8a6a);
 solid(x-1.4,z-1.0,1.0,2.0);
 addBox(x+1.2,0.5,z-1.0,1.2,0.8,0.8,0x6a4a26);
 solid(x+1.2,z-1.0,1.2,0.8);
 interactables.push({kind:'stash',name:nm+' chest',stash:{},x:x+1.2,z:z+0.2,r:2.4,txt:'Store goods (E)'});
 addBox(x+1.2,1.05,z-1.0,1.2,0.15,0.8,0x4a3018);
 const c=addBox(x+1.2,0.5,z+0.2,1.1,0.9,1.0,0x6a4a26);c.material.emissive=new THREE.Color(0x221800);
 solid(x+1.2,z+0.2,1.1,1.0);
 interactables.push({kind:'loot',name:nm+' shelf',x:x-1.4,z:z+1.0,r:2.4,txt:'Search shelf'});
 addBox(x-1.4,0.5,z+1.0,1.0,0.9,0.6,0x6a4a26);}
function buildPigstye(){
 const X=-38,Z=-40;
 for(let x=X-6;x<=X+6;x+=2.4){addBox(x,0.5,Z-5,0.22,1.0,0.22,0x5a4630);if(x<X-2||x>X+2)addBox(x,0.5,Z+5,0.22,1.0,0.22,0x5a4630);}
 for(let z=Z-5;z<=Z+5;z+=2){addBox(X-6,0.5,z,0.22,1.0,0.22,0x5a4630);addBox(X+6,0.5,z,0.22,1.0,0.22,0x5a4630);}
 addBox(X,0.85,Z-5,12,0.14,0.14,0x4a3018);addBox(X,0.85,Z+5,8,0.14,0.14,0x4a3018);
 addBox(X-6,0.85,Z,0.14,0.14,10,0x4a3018);addBox(X+6,0.85,Z,0.14,0.14,10,0x4a3018);
 solid(X,Z-5,12,0.4);solid(X-2,Z+5,8,0.4);solid(X-6,Z,0.4,10);solid(X+6,Z,0.4,10);
 const mud=new THREE.Mesh(new THREE.CircleGeometry(2.2,14),new THREE.MeshLambertMaterial({color:0x2e2418}));mud.rotation.x=-Math.PI/2;mud.position.set(X+2,0.07,Z-1);scene.add(mud);
 addBox(X-2,0.3,Z+2,1.6,0.5,0.8,0x4a3018);
 for(const [px,pz] of [[-4,-4],[0,-4],[4,-4],[-4,0],[4,0]]){addBox(X+px,1.1,Z+pz,0.25,2.2,0.25,0x5a4630);}
 addBox(X,2.4,Z-2,10,0.3,6,0x4a3a22);
 const lb=makeLabel('🐷 Jean-Luc’s Pigstye',0.9);lb.position.set(X,7.5,Z);scene.add(lb);
 interactables.push({kind:'loot',name:'Feed sack',x:X-2,z:Z+3.4,r:2.6,txt:'Search Feed sack'});
 for(let i=0;i<4;i++)spawnCritter('pig',X+rand(-3,3),Z+rand(-3,3));}
function buildTavern(){
 const X=34,Z=-8,W=0x9a8a68,WM=texed(W,TEX.daub);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(12,8),texed(0x6a5a40,TEX.wood));fl.rotation.x=-Math.PI/2;fl.position.set(X,0.06,Z);fl.receiveShadow=true;scene.add(fl);
 addBox(X-3.6,1.5,Z+4,4.8,3,0.35,W,0,WM);addBox(X+3.6,1.5,Z+4,4.8,3,0.35,W,0,WM);addBox(X,2.75,Z+4,2.4,0.5,0.35,W,0,WM);
 solid(X-3.6,Z+4,4.8,0.35);solid(X+3.6,Z+4,4.8,0.35);
 addBox(X,1.5,Z-4,12,3,0.35,W,0,WM);solid(X,Z-4,12,0.35);
 addBox(X-6,1.5,Z-1.1,0.35,3,3.8,W,0,WM);addBox(X-6,1.5,Z+2.6,0.35,3,1.0,W,0,WM);
 solid(X-6,Z-1.1,0.35,3.8);solid(X-6,Z+2.6,0.35,1.0);
 addBox(X+6,1.5,Z-1.1,0.35,3,3.8,W,0,WM);addBox(X+6,1.5,Z+2.6,0.35,3,1.0,W,0,WM);
 solid(X+6,Z-1.1,0.35,3.8);solid(X+6,Z+2.6,0.35,1.0);
 addRoof(X,6.2,Z,13.4,9.4,0x4a2e18,texed(0x4a2e18,TEX.thatch));
 const lb=makeLabel('⚓ L’Ancre Noyée — tavern',1.0);lb.position.set(X,9.5,Z);scene.add(lb);
 interactables.push({kind:'door',name:'L’Ancre Noyée',x:X,z:Z+4.6,r:3,txt:'Enter the tavern'});
 addBox(X,0.55,Z-2.5,6,0.9,0.7,0x4a3018);solid(X,Z-2.5,6,0.7);
 addBox(X-2,1.15,Z-2.5,0.5,0.3,0.5,0x8a6a3a);addBox(X+2,1.15,Z-2.5,0.4,0.5,0.4,0x5a3a1a);
 for(const [tx,tz] of [[-2,0],[2,1]]){addBox(X+tx,0.45,Z+tz,1.4,0.7,1.4,0x6a4a26);solid(X+tx,Z+tz,1.4,1.4);}
 for(let i=0;i<3;i++){const bx=X-4.6,bz=Z-2+i*2;
  addBox(bx,0.35,bz,1.0,0.4,2.0,0x5a4630);addBox(bx,0.6,bz,0.9,0.2,1.8,0x9a8a6a);solid(bx,bz,1.0,2.0);
  interactables.push({kind:'bed',name:'Tavern bunk '+(i+1),x:bx,z:bz,r:2.6,txt:'Bunk (free, thin) — rent better from Mama'});}
 const hx=X+4.6,hz=Z+1;
 addBox(hx,0.3,hz,1.6,0.6,1.6,0x5a5a5a);
 const flame=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.2,7),new THREE.MeshBasicMaterial({color:0xff9a3a}));flame.position.set(hx,1.2,hz);scene.add(flame);
 const hl=new THREE.PointLight(0xff8a3a,1.6,20);hl.position.set(hx,1.8,hz);scene.add(hl);glowAt(hx,1.8,hz,6,0.5);
 fires.push({x:hx,z:hz,flame,light:hl});solid(hx,hz,1.6,1.6);
 interactables.push({kind:'fire',name:'Tavern hearth',x:hx,z:hz,r:3,txt:'Rest by the hearth (heal/sanity)'});}
function buildCottages(){buildCottage(36,28,'Cottage of Thorns','cot1');buildCottage(12,34,'Cottage of Eels','cot2');buildCottage(-24,34,'Cottage of Nails','cot3');}
/* ============ SONGBOOK: ten named songs ============ */
const SONGS={
 bamboula:{n:'Bamboula at Congo Square',note:'drums the Code Noir never banned',bpm:112,drum:'war',banjo:true,bass:[55,49,43.65,41.2],chords:[[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[164.81,207.65,246.94]]},
 thirteen:{n:'The Night the Bell Tolled Thirteen',note:'count them. count them again',bpm:58,drum:'dirge',banjo:false,reed:true,bass:[36.71,29.14,24.5,27.5],chords:[[146.83,174.61,220],[116.54,146.83,174.61],[98,123.47,146.83],[110,138.59,164.81]]},
 reel:{n:'Tafia Reel',note:'spilled rum keeps no time',bpm:128,drum:'train',banjo:true,bass:[73.42,49,55],chords:[[293.66,369.99,440],[196,246.94,293.66],[220,277.18,329.63]]},
 waltz:{n:'Grave-Digger’s Waltz',note:'one-two-three, one-two-three, rest',bpm:84,drum:'dirge',banjo:true,bass:[55,43.65,36.71,41.2],chords:[[220,261.63,329.63],[174.61,220,261.63],[146.83,174.61,220],[164.81,207.65,246.94]]},
 stomp:{n:'Loup-Garou Stomp',note:'run, harmonize, run',bpm:140,drum:'war',banjo:true,bass:[41.2,49,55],chords:[[164.81,207.65,246.94],[196,246.94,293.66],[220,277.18,329.63]]},
 hymn:{n:'Hymn of the Unpaid',note:'every verse ends in amen and arrears',bpm:66,drum:'none',banjo:false,reed:true,bass:[43.65,32.7,24.5,27.5],chords:[[174.61,220,261.63],[130.81,164.81,196],[98,123.47,146.83],[110,130.81,164.81]]},
 pirogue:{n:'Pirogue Song',note:'pole deep, mind the gators',bpm:100,drum:'brush',banjo:true,bass:[65.41,49,55,43.65],chords:[[261.63,329.63,392],[196,246.94,293.66],[220,261.63,329.63],[174.61,220,261.63]]},
 ledger:{n:'The Seigneur’s Ledger Burns',note:'warming every cabin in the parish',bpm:120,drum:'war',banjo:true,bass:[55,43.65,49,41.2],chords:[[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[164.81,207.65,246.94]]},
 lullaby:{n:'Manon’s Garden Lullaby',note:'sleep, the swamp is watching',bpm:72,drum:'brush',banjo:false,reed:true,bass:[43.65,32.7,49],chords:[[174.61,220,261.63],[130.81,164.81,196],[98,123.47,146.83]]},
 grisgris:{n:'Gris-gris Blues',note:'red flannel, blue note',bpm:88,drum:'train',banjo:true,bass:[41.2,55,61.74],chords:[[164.81,196,246.94],[220,261.63,329.63],[123.47,155.56,196]]},
};
function playSong(id,bars){const S=typeof id==='object'?id:SONGS[id];if(!S||!G.started)return;
 G.song={id:typeof id==='object'?'gen':id,cfg:typeof id==='object'?id:null,steps:0,left:(bars||4)*8};
 if(typeof id!=='object')G.lastSong=id;
 const mt=$('mus-title');if(mt)mt.textContent='♪ '+S.n;
 toast('♪ '+S.n+' — <i>'+S.note+'</i>','lore');}
function genSong(){const A=['Muddy','Hollow','Black','Lantern','Gravel','Cypress','Widow’s','Gator'];
 const B=['Reel','Dirge','Blues','Waltz','Stomp','Hymn'];
 const pool=[[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[164.81,196,246.94],[146.83,174.61,220],[130.81,164.81,196],[164.81,207.65,246.94],[196,233.08,293.66]];
 const roots=[55,49,43.65,41.2,36.71,65.41,58.27];
 const n=3+Math.floor(Math.random()*2),chords=[];for(let i=0;i<n;i++)chords.push(choice(pool));
 const bpm=choice([66,72,84,88,96,100,112,120,128]);
 const drum=bpm>=116?'war':(bpm>=92?'train':(bpm>=78?'brush':'dirge'));
 return {n:choice(A)+' '+choice(B)+' No.'+(1+Math.floor(Math.random()*12)),note:'the bayou improvises',bpm,drum,banjo:Math.random()<0.7,reed:Math.random()<0.4,bass:[choice(roots),choice(roots),choice(roots)],chords};}
function autoNext(){if(!G.started||G.musicHold)return;let id=null;
 if(Math.random()<0.5){const pool=Object.keys(SONGS).filter(k=>k!==G.lastSong);id=choice(pool);}
 if(id)playSong(id,4);else playSong(genSong(),4);}
function skipSong(){if(!AudioSys.ctx)return;AudioSys.fade(0.02,0.7,()=>{G.song=null;G.songGap=1;autoNext();AudioSys.fade((AudioSys.vol||0.6)*0.6,2);});}
function stopMusic(){G.musicHold=true;G.song=null;G.autoplay=false;const a=$('mus-auto');if(a)a.checked=false;const p=$('mus-play');if(p)p.textContent='▶';if(AudioSys.ctx)AudioSys.fade(0.0001,1.5);}
function startMusic(){G.musicHold=false;G.autoplay=true;const a=$('mus-auto');if(a)a.checked=true;const p=$('mus-play');if(p)p.textContent='⏸';G.songGap=2;if(AudioSys.ctx)AudioSys.fade((AudioSys.vol||0.6)*0.6,2.5);}
function renderSongs(){const l=$('song-list');if(!l)return;l.innerHTML='<p style="font-size:13px;color:#a89a76">Ten songs the parish sings to itself. They also find you: burials, taverns, boats, battles, rituals, dawn.</p>';
 for(const id in SONGS){const s=SONGS[id];const d=document.createElement('div');d.className='craft-row';
  d.innerHTML='<span>♪ <b>'+s.n+'</b><br><small><i>'+s.note+'</i> · '+s.bpm+' bpm</small></span>';
  const b=document.createElement('button');b.className='btn';b.textContent='Play';b.onclick=()=>{playSong(id,4);renderSongs();};d.appendChild(b);l.appendChild(d);}}
/* ============ VOODOO, HOODOO & ROOTWORK ============ */
const SPELLS=[
 {id:'ward',n:'Gris-gris Ward',e:'🛡',cost:20,key:'7',desc:'Loa at your shoulder: half damage, 30s.'},
 {id:'lantern',n:'Lantern Call',e:'🕯',cost:25,key:'8',desc:'Holy light burns the unquiet within 12 paces.'},
 {id:'haste',n:'Crossroads Haste',e:'💨',cost:15,key:'9',desc:'Roads open under you: +35% speed, 20s.'},
 {id:'communion',n:'Graveyard Communion',e:'⚱',cost:35,key:'0',desc:'Sit with the dead a minute: +30 ❤, +15 🕯.'},
 {id:'rebuke',n:'Loa’s Rebuke',e:'🔥',cost:50,key:'-',desc:'Heaven’s backhand: heavy hurt to all near horrors.'},
];
function castSpell(id){const s=SPELLS.find(s=>s.id===id);if(!s)return;
 if(!G.started||G.paused||G.dead||dlgOpen)return;
 const cost=Math.max(1,Math.round(s.cost*(1-0.03*skillLvl('root'))));
 if(G.mana<cost){toast('Not enough spirit (need '+cost+' 🌀). Work the altars.','bad');return;}
 G.mana-=cost;gainXp('root',2);AudioSys.sfx('pray');
 if(id==='ward'){G.wardUntil=performance.now()+30000;toast('🛡 The ward settles on your shoulders. (30s)','good');}
 else if(id==='lantern'){let hit=0;for(const f of [...foes]){if(!['ghost','vamp','risen'].includes(f.type))continue;
   if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<12){hurtFoe(f,f.type==='ghost'?45:30,false);hit++;}}
  for(let i=0;i<16;i++)spawnP(G.pos.x+rand(-2,2),rand(1,3),G.pos.z+rand(-2,2),rand(-2,2),rand(1,3),rand(-2,2),1,0xffe9a0);
  toast(hit?'🕯 '+hit+' unquiet burned in holy light.':'🕯 Light answers. Nothing near.',hit?'good':'');}
 else if(id==='haste'){G.hasteUntil=performance.now()+20000;toast('💨 Crossroads in your feet. (20s)','good');}
 else if(id==='communion'){G.hp=clamp(G.hp+30,0,G.maxhp);G.sanity=clamp(G.sanity+15,0,100);toast('⚱ Graveyard communion. (+30 ❤, +15 🕯)','good');}
 else if(id==='rebuke'){let hit=0;for(const f of [...foes]){if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<10){hurtFoe(f,f.boss?100:60,false);hit++;}}
  for(let i=0;i<24;i++)spawnP(G.pos.x+rand(-4,4),rand(0.5,3),G.pos.z+rand(-4,4),rand(-3,3),rand(1,4),rand(-3,3),1.2,0xff5a3a);
  toast('🔥 LOA’S REBUKE! '+hit+' horrors struck.',hit?'good':'bad');}
 refreshHUD();}
const RITUALS=[
 {site:'cross',n:'Crossroads Offering',e:'✝',need:{coin:3,candle:1},mana:35,sanity:6,karma:1,txt:'Coin and candle where the roads cross. Legba counts every one. (+35 🌀)'},
 {site:'ancestor',n:'Feed the Dead',e:'🍞',need:{bread:1,tafia:1},mana:40,sanity:8,karma:2,txt:'Bread for the bones, tafia for the thirsty. The cemetery votes its thanks. (+40 🌀)'},
 {site:'water',n:'Bayou Baptism',e:'🌊',need:{herb:1},mana:30,sanity:10,karma:1,txt:'Herbs to the water, head under the dark. You rise somebody else. (+30 🌀)'},
 {site:'chapel',n:'Candle Vigil',e:'🕯',need:{candle:1},mana:25,sanity:10,karma:1,txt:'One flame against the unconsecrated dark. Anselme pretends not to see. (+25 🌀)'},
];
function placeAltars(){[['cross',10,48],['ancestor',-70,14],['water',-46,52],['chapel',-27,-16]].forEach(([site,x,z])=>{
 const R=RITUALS.find(r=>r.site===site);
 const slab=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,1.0),texed(0x8a8072,TEX.stone));slab.position.set(x,0.25,z);slab.castShadow=true;scene.add(slab);
 for(const s of [-0.4,0.4]){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,0.5,6),mat(0xe8e0cc));c.position.set(x+s,0.75,z);scene.add(c);
  const f=new THREE.Mesh(new THREE.SphereGeometry(0.06,6,4),new THREE.MeshBasicMaterial({color:0xffc46a}));f.position.set(x+s,1.05,z);scene.add(f);}
 glowAt(x,1.2,z,3,0.35);
 const lb=makeLabel(R.e+' '+R.n,0.45);lb.position.set(x,2.6,z);scene.add(lb);
 interactables.push({kind:'altar',site,name:R.n,x,z,r:3,txt:R.e+' Work ritual: '+R.n+' (E)'});});}
function doRitual(it){const R=RITUALS.find(r=>r.site===it.site);if(!R)return;
 for(const k in R.need){if(!hasItem(k,R.need[k])){toast('The rite wants: '+Object.entries(R.need).map(([a,b])=>b+' '+(ITEMS[a]?ITEMS[a].n:a)).join(', ')+'.','bad');return;}}
 for(const k in R.need)takeItem(k,R.need[k]);
 G.mana=Math.min(G.maxmana,G.mana+Math.round(R.mana*(1+0.05*skillLvl('root'))));G.sanity=clamp(G.sanity+R.sanity,0,100);gainXp('root',3);
 if(R.karma)addKarma(R.karma,'the old ways');
 AudioSys.sfx('pray');toast(R.e+' '+R.txt,'good');
 ritualProgress();refreshHUD();refreshHotbar();}
function ritualProgress(){for(const id of [...G.qactive]){const q=qdef(id);if(!q.obj.some(o=>o.t==='ritual'))continue;const s=G.quests[id];s.have.ritual=(s.have.ritual||0)+1;
 let done=true;for(const o of q.obj){if(o.t==='ritual'&&(s.have.ritual||0)<o.n)done=false;
  if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);if(h<o.n)done=false;}
  if(o.t==='kill'&&(s.have['k_'+o.foe]||0)<o.n)done=false;
  if(o.t==='work'&&(s.have['w_'+o.job]||0)<o.n)done=false;
  if(o.t==='forage'&&(s.have.forage||0)<o.n)done=false;if(o.t==='hunt'&&(s.have.hunt||0)<o.n)done=false;
  if(o.t==='bury'&&(s.have.bury||0)<o.n)done=false;if(o.t==='visit'&&!s.have['v_'+o.zone])done=false;
  if(o.t==='tax'&&!G.taxPaid)done=false;if(o.t==='torch'&&(G.planted||0)<o.n)done=false;}
 if(done)completeQuest(id);}refreshTracker();}
/* ============ XP SKILLS (Zomboid-like, parish-flavoured) ============ */
const SKILLS={
 blade:{n:'Bladework',e:'🗡',d:'Smallsword and axe. +8% melee damage per level.'},
 musket:{n:'Musketry',e:'🔫',d:'Flintlock drill. +10% shot damage, faster reload per level.'},
 brawl:{n:'Brawling',e:'✊',d:'Fists (G to raise them). Faster hands, meaner knuckles.'},
 pick:{n:'Pickpocketing',e:'🤏',d:'Light fingers. +7% lift success per level.'},
 sneak:{n:'Sneaking',e:'🌙',d:'Soft feet. Horrors notice you later.'},
 forage:{n:'Foraging',e:'🌿',d:'Botany. Bonus yields from the commons.'},
 hunt:{n:'Hunting',e:'🏹',d:'Clean kills. +10% damage to game per level.'},
 cook:{n:'Cooking',e:'🍳',d:'The pot. +5% nourishment per level.'},
 carp:{n:'Carpentry',e:'🪚',d:'True joints. Tougher barricades per level.'},
 aid:{n:'First Aid',e:'🩹',d:'Clean rags, sure hands. +10% healing per level.'},
 root:{n:'Rootwork',e:'🧿',d:'The old ways. Cheaper spells, fatter rituals.'},
 farm:{n:'Farming',e:'🌾',d:'Common acres. Bonus harvests per level.'},
 axe:{n:'Woodcutting Axe',e:'🪓',d:'The axe. +8% axe damage per level.'},
 blunt:{n:'Cudgel & Torch',e:'🏏',d:'Blunt instruments. +8% per level.'},
 pike:{n:'Pikework',e:'🔱',d:'Boar spear, militia drill. +8% per level, long reach.'},
 smith:{n:'Smithing',e:'⚒',d:'Forge mastery. Better mends, bonus shot & nails.'},
 fish:{n:'Fishing',e:'🎣',d:'Water-reading. Extra shares from pools at level 3+.'},
 trap:{n:'Trapping',e:'🪤',d:'Snares. Second-chance drops from game.'},
 vigor:{n:'Vigor',e:'❤',d:'Fitness. Slower hunger, faster breath.'},
 might:{n:'Might',e:'💪',d:'Strength. +4% melee damage per level.'},
 run:{n:'Running',e:'👟',d:'Sprinting. +2% foot speed per level.'},
 foot:{n:'Footwork',e:'🌀',d:'Nimble. 2% dodge per level.'},
 tailor:{n:'Needlework',e:'🧵',d:'Tailoring. Bonus bandages & tonics from level 4.'},
 sail:{n:'Seamanship',e:'⛵',d:'Pirogue handling. +4% boat speed per level.'},
 powder:{n:'Blackpowder',e:'🧨',d:'Charcoal, brimstone, nitre. +10% blast damage per level; richer powder at 4/8.'},
};
const SKILL_MAX=10;
function skillNeed(l){return 25*l*(l+1);}
function skillLvl(id){return (G.skills&&G.skills[id]&&G.skills[id].lvl)||0;}
function gainXp(id,n){n=Math.max(1,Math.round(n*(T('fastlearner')?1.3:1)*(T('slowlearner')?0.7:1)));if(!G.skills)G.skills={};if(!G.skills[id])G.skills[id]={xp:0,lvl:0};const s=G.skills[id];s.xp+=n;
 let nl=s.lvl;while(nl<SKILL_MAX&&s.xp>=skillNeed(nl+1))nl++;
 if(nl>s.lvl){s.lvl=nl;notify(SKILLS[id].e,'Skill mastered deeper: '+SKILLS[id].n+' '+nl,SKILLS[id].d,{major:true});AudioSys.sfx('quest');}}
function initSkills(){if(!G.skills)G.skills={};for(const k in SKILLS)if(!G.skills[k])G.skills[k]={xp:0,lvl:0};}
const JOB_SKILL={carpenter:'carp',cook:'cook',smith:'smith',farmer:'farm',hunter:'hunt',fisherman:'fish',tavern:'cook',soldier:'blade',sheriff:'brawl',pirate:'sneak',sewer:'vigor'};
function renderSkills(){const l=$('skill-list');if(!l)return;l.innerHTML='<p style="font-size:13px;color:#a89a76">Level 10 in everything is sainthood. Pickpocket with 🤏 in talk, raise fists with G.</p>';
 for(const k in SKILLS){const sk=G.skills[k]||{xp:0,lvl:0};const next=sk.lvl<SKILL_MAX?skillNeed(sk.lvl+1):null;
  const d=document.createElement('div');d.className='craft-row';
  d.setAttribute('data-tip','skill:'+k);d.innerHTML='<span>'+SKILLS[k].e+' <b>'+SKILLS[k].n+'</b> — level '+sk.lvl+' ('+sk.xp+(next?' / '+next+' XP':' XP, peak')+')<br><small>'+SKILLS[k].d+'</small></span>';
  l.appendChild(d);}}
/* ============ TRAITS (chosen at the crossing) ============ */
const TRAITS={
 maroon:{n:'Maroon-Blooded',e:'⛓‍💥',cost:4,d:'Raised to run and endure. +30% stamina recovery, −10% hunger.'},
 coffin:{n:'Coffin-Ship Survivor',e:'⚓',cost:3,d:'Survived the crossing fever. Bite infection half as likely.'},
 smitharms:{n:'Blacksmith’s Arms',e:'💪',cost:3,d:'Apprenticed at the forge. +15% melee damage.'},
 rootwise:{n:'Rootwise',e:'🌿',cost:2,d:'Taught by Manon’s people. +15% bonus forage finds.'},
 pamphleteer:{n:'Pamphleteer',e:'📰',cost:2,d:'Reader of forbidden pages. Begin with +6 karma; recruits trust sooner.'},
 swampfoot:{n:'Swamp-Footed',e:'🐾',cost:2,d:'High roots, dry feet. +4% move speed.'},
 keen:{n:'Keen-Eyed',e:'👁',cost:2,d:'Customs-house eyes. +15% bonus loot from crates.'},
 consumption:{n:'Consumption',e:'🫁',cost:-4,d:'The wasting cough. −20 max health, +10% hunger.'},
 malaria:{n:'Malarial Humours',e:'🦟',cost:-3,d:'Bad air in the blood. +20% reason drain in darkness.'},
 clubfoot:{n:'Club-Footed',e:'🦶',cost:-3,d:'The foot turns in. −8% move speed.'},
 indebted:{n:'Indebted',e:'📜',cost:-2,d:'Your crossing is owned. Begin with no coin.'},
 superstitious:{n:'Superstitious',e:'🕯',cost:-2,d:'You know what walks. Apparitions drain +50% reason.'},
 nightblind:{n:'Night-Blind',e:'🌑',cost:-2,d:'Dusk steals your eyes. +30% reason drain in darkness.'},
 haunted:{n:'Haunted',e:'👻',cost:-2,d:'Something followed you off the ship. Whispers start early; begin shaken.'},
 athletic:{n:'Athletic',e:'🏃',cost:6,d:'A runner of levees. +50% stamina recovery, slower sprint hunger.'},
 strong:{n:'Strong',e:'💪',cost:5,d:'Dockhands’ back. +20% melee damage.'},
 fastheal:{n:'Fast Healer',e:'🩹',cost:4,d:'Clean blood. Health returns twice as fast when fed.'},
 fastlearner:{n:'Fast Learner',e:'📖',cost:5,d:'The pamphlets took. +30% all experience.'},
 slowlearner:{n:'Slow Student',e:'🐌',cost:-4,d:'Letters swim. −30% all experience.'},
 brave:{n:'Brave',e:'🦁',cost:3,d:'Seen worse. Terror takes a third off.'},
 cowardly:{n:'Cowardly',e:'🐔',cost:-3,d:'The knees know first. +50% fright. (Overcome it: face three wolves.)'},
 inconspicuous:{n:'Inconspicuous',e:'🌫',cost:3,d:'Forgettable face. Horrors notice 20% later.'},
 conspicuous:{n:'Conspicuous',e:'📯',cost:-2,d:'A face for wanted posters. Noticed 25% sooner.'},
 nightowl:{n:'Night Owl',e:'🦉',cost:2,d:'The dark shift feels like home. Darkness gnaws 40% less.'},
 nightvision:{n:'Night Eyes',e:'👁',cost:4,d:'Candleless sight. Darkness gnaws half.'},
 cateyes:{n:'Cat’s Eyes',e:'🐱',cost:2,d:'Dusk pupils. Darkness gnaws 30% less.'},
 outdoorsman:{n:'Outdoorsman',e:'🏕',cost:3,d:'Raised under sky. Finds a tenth more in the wild.'},
 herbalist:{n:'Herbalist',e:'🌿',cost:3,d:'Knows every leaf. Wormwood doubles half the time. (Unlocks a Manon errand.)'},
 handy:{n:'Handy',e:'🔨',cost:2,d:'Good with joints. +20 barricade strength, +15 mending.'},
 faider:{n:'First Aider',e:'⛑',cost:2,d:'War taught bandages. +20% healing.'},
 gardener:{n:'Gardener',e:'🌻',cost:2,d:'Green thumbs, black soil. Farm yields +1. (Unlocks a Seamus acre.)'},
 angler:{n:'Angler',e:'🎣',cost:2,d:'Reads water like print. Pools often double.'},
 hunter:{n:'Hunter-Born',e:'🏹',cost:3,d:'Raised on venison. +10% to game, slower to spook it. (Unlocks the big boar.)'},
 brawler:{n:'Brawler',e:'🥊',cost:3,d:'Tavern-educated fists. +4 fist damage.'},
 desens:{n:'Desensitized',e:'😐',cost:4,d:'Buried too many. Half fright, −30% gnawing.'},
 graceful:{n:'Graceful',e:'🦢',cost:2,d:'Soft feet. Noticed 15% later.'},
 gymnast:{n:'Gymnast',e:'🤸',cost:2,d:'Ship’s-rigging youth. +2% dodge, flat.'},
 cook:{n:'Cook-Born',e:'🍲',cost:2,d:'Raised over a pot. Dishes nourish 15% more.'},
 tailor:{n:'Needle-Born',e:'🧵',cost:2,d:'Sailmaker’s child. Healing crafts come easy.'},
 nutritionist:{n:'Nutritionist',e:'🥗',cost:1,d:'Reads food like scripture. +5% all nourishment.'},
 organized:{n:'Organized',e:'🗂',cost:2,d:'Everything labelled. Sells 10% dearer.'},
 packmule:{n:'Packmule',e:'🐴',cost:2,d:'Carried harvests for years. Sprinting sips stamina.'},
 lighteater:{n:'Light Eater',e:'🍽',cost:2,d:'Lives on air and spite. −15% hunger.'},
 hearty:{n:'Hearty Appetite',e:'🍖',cost:-2,d:'A hollow leg. +20% hunger.'},
 thickskin:{n:'Thick-Skinned',e:'🦏',cost:4,d:'Hide like cypress bark. −15% all damage taken.'},
 thinskin:{n:'Thin-Skinned',e:'🩸',cost:-2,d:'Paper skin. +15% all damage taken.'},
 weakstomach:{n:'Weak Stomach',e:'🤢',cost:-2,d:'Raw game may rebel. Cook it, cher.'},
 smoker:{n:'Pipe Smoker',e:'🚬',cost:-2,d:'Needs the leaf. Each dawn without tobacco costs 10 reason.'},
 clumsy:{n:'Clumsy',e:'🦶',cost:-2,d:'Two left feet. Swings sometimes hit only air.'},
 shortsighted:{n:'Short-Sighted',e:'👓',cost:-2,d:'The far is a rumour. Muskets reach shorter.'},
 hardhearing:{n:'Hard of Hearing',e:'🧏',cost:-3,d:'Cannon years. You shout twice as loud — everything hears.'},
 restless:{n:'Restless Sleeper',e:'🛏',cost:-2,d:'The bunk never fits. Rest restores half.'},
 prone:{n:'Prone to Illness',e:'🤒',cost:-3,d:'Every miasma finds you. Infections double.'},
 agora:{n:'Agoraphobic',e:'🌾',cost:-3,d:'Open sky presses down. Outside the palisade by day, reason bleeds.'},
 claustro:{n:'Claustrophobic',e:'📦',cost:-2,d:'Walls lean in. Indoors, reason bleeds.'},
 hemo:{n:'Hemophobic',e:'🩸',cost:-3,d:'Blood unmakes you. Heavy hits cost reason too.'},
 sunday:{n:'Sunday Driver',e:'🐢',cost:-1,d:'Gentle with reins. Carts and canoes go 15% slower.'},
 disorganized:{n:'Disorganized',e:'🧺',cost:-1,d:'Pockets like sieves. 5% worse prices both ways.'},
 adrenaline:{n:'Adrenaline Humours',e:'⚡',cost:4,d:'Near death you shine: faster feet, harder hands under 30% health.'},
 dextrous:{n:'Dextrous',e:'🤲',cost:2,d:'Quick fingers. Faster reloads, lighter lifts.'},
 stout:{n:'Stout Frame',e:'🧱',cost:2,d:'Built like a barrel. +10 max health.'},
 gaunt:{n:'Gaunt',e:'🎋',cost:-2,d:'All elbows. −10 max health, +5% speed.'},
};
function hasTrait(id){return (G.traits||[]).includes(id);}
const T=hasTrait;
function traitPoints(){return -((G.traits||[]).reduce((a,id)=>a+(TRAITS[id]?TRAITS[id].cost:0),0));}
function renderTraits(){const g=$('trait-grid');g.innerHTML='';
 for(const id in TRAITS){const t=TRAITS[id],on=(G.traits||[]).includes(id);
  const d=document.createElement('div');d.className='trait'+(on?' on':'')+(t.cost<0?' neg':'');d.setAttribute('data-tip','trait:'+id);
  d.innerHTML='<div class="tem">'+t.e+'</div><div><b>'+t.n+'</b> <span class="tcost">'+(t.cost>0?'−'+t.cost+' pts':'+'+(-t.cost)+' pts')+'</span><br><small>'+t.d+'</small></div>';
  d.onclick=()=>{const i=G.traits.indexOf(id);if(i>=0)G.traits.splice(i,1);else G.traits.push(id);AudioSys.sfx('pickup');renderTraits();};
  g.appendChild(d);}
 const p=traitPoints();$('trait-points').innerHTML='Points: <b>'+p+'</b> '+(p<0?'(take fewer blessings or more scars — balance must be ≥ 0)':'(the crossing is paid)');
 $('btn-traits-go').disabled=p<0;}
/* ============ BLACKPOWDER ============ */
function detonate(x,z,radius,dmg){AudioSys.sfx('shot');G.shake=0.5;
 for(let i=0;i<30;i++)spawnP(x+rand(-1,1),rand(0.5,2.5),z+rand(-1,1),rand(-6,6),rand(1,7),rand(-6,6),rand(0.6,1.4),choice([0xff5a3a,0xffc46a,0x555555]));
 let deafened=0;
 for(const f of [...foes]){if(dist2(x,z,f.mesh.position.x,f.mesh.position.z)<radius){hurtFoe(f,f.boss?dmg*1.6:dmg,false);f.cd=Math.max(f.cd,3);deafened++;}}
 for(const c of [...critters]){if(!c.d.flying&&dist2(x,z,c.mesh.position.x,c.mesh.position.z)<radius)hurtCritter(c,dmg);}
 const pd=dist2(x,z,G.pos.x,G.pos.z);if(pd<radius*0.7)hurtPlayer(Math.round(dmg*(1-pd/radius)),'own powder');
 if(deafened>0)toast('👂 '+deafened+' eardrum'+(deafened>1?'s':'')+' burst. They hear bells now.',deafened>2?'good':'');
 if(pd<radius&&!G.plugged&&Math.random()<0.5){G.deafT=20;toast('🧏 YOUR ears! Ringing, muffled wool. Wax plugs would have helped.','bad');subtitle('*EEEEEEEEEE*');}
 gainXp('powder',5);boomProgress();}
function boomProgress(){for(const id of [...G.qactive]){const q=qdef(id);if(!q.obj.some(o=>o.t==='boom'))continue;const s=G.quests[id];s.have.boom=(s.have.boom||0)+1;
 let done=true;for(const o of q.obj){if(o.t==='boom'&&(s.have.boom||0)<o.n)done=false;
  if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);if(h<o.n)done=false;}
  if(o.t==='kill'&&(s.have['k_'+o.foe]||0)<o.n)done=false;}if(done)completeQuest(id);}refreshTracker();}
function placeKeg(){const ry=playerMesh?playerMesh.rotation.y:0;
 const x=clamp(G.pos.x+Math.sin(ry)*2.2,-112,112),z=clamp(G.pos.z+Math.cos(ry)*2.2,-112,112);
 const g=new THREE.Group();
 const b=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.9,10),mat(0x5a3a1a));b.position.y=0.45;b.castShadow=true;g.add(b);
 for(const hy of [0.2,0.7]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(0.56,0.05,6,14),mat(0x2a2a2e));hoop.rotation.x=Math.PI/2;hoop.position.y=hy;g.add(hoop);}
 g.position.set(x,0,z);scene.add(g);
 const lb=makeLabel('🛢 powder keg',0.45);lb.position.set(0,1.8,0);g.add(lb);
 const it={kind:'keg',name:'Powder keg',x,z,r:3,txt:'Light the fuse (E) — then RUN'};
 const k={x,z,mesh:g,inter:it,fuse:-1};it.ref=k;interactables.push(it);kegs.push(k);
 AudioSys.sfx('craft');toast('🛢 Keg set. Light it and be elsewhere.','good');}
function lightKeg(k){if(k.fuse>=0){toast('Already hissing! RUN!','bad');return;}
 k.fuse=3;toast('🔥 FUSE LIT — three seconds!','bad');AudioSys.sfx('shot');}
/* ============ CANOES ============ */
function isWater(x,z){for(const w of WATER){const dx=(x-w.x)/w.rx,dz=(z-w.z)/w.rz;if(dx*dx+dz*dz<1)return true;}return false;}
function makeCanoeMesh(){const g=new THREE.Group();
 const hull=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.5,1.1),mat(0x5a3a20));hull.position.y=0.35;hull.castShadow=true;g.add(hull);
 for(const s of [-1.9,1.9]){const tip=new THREE.Mesh(new THREE.ConeGeometry(0.55,0.9,4),mat(0x5a3a20));tip.rotation.z=s>0?-Math.PI/2:Math.PI/2;tip.position.set(s,0.4,0);g.add(tip);}
 const rim=new THREE.Mesh(new THREE.BoxGeometry(3.0,0.12,0.9),mat(0x2a1a08));rim.position.y=0.62;g.add(rim);
 for(const s of [-0.8,0.8]){const bench=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.1,0.8),mat(0x8a6a3a));bench.position.set(s,0.5,0);g.add(bench);}
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,2.4,5),mat(0x6a4a26));pole.position.set(-1.2,0.9,0.3);pole.rotation.z=0.9;g.add(pole);
 return g;}
function launchCanoe(){const ry=playerMesh?playerMesh.rotation.y:0;
 let lx=G.pos.x,lz=G.pos.z;
 if(!isWater(lx,lz)){lx=clamp(G.pos.x+Math.sin(ry)*3,-112,112);lz=clamp(G.pos.z+Math.cos(ry)*3,-112,112);}
 if(!isWater(lx,lz)){toast('🛶 Needs water within a pole’s length to launch.','bad');addItem('canoe',1);return;}
 const m=makeCanoeMesh();m.position.set(lx,0,lz);m.rotation.y=ry;scene.add(m);
 const lb=makeLabel('🛶 pirogue',0.45);lb.position.set(0,1.8,0);m.add(lb);
 boats.push({kind:'boat',name:'pirogue',mesh:m});
 AudioSys.sfx('craft');toast('🛶 Launched! E boards; water flies, mud drags.','good');
 G.pos.x=lx;G.pos.z=lz;}
function boardBoat(b){G.mounted={kind:'boat',ref:b};G.pos.x=b.mesh.position.x;G.pos.z=b.mesh.position.z;
 toast('🛶 Aboard. Pole deep, mind the gators. (E to beach)','good');AudioSys.sfx('pickup');}
/* ============ PEOPLE ============ */
function makeHumanoid(coat,skin,hat){const g=new THREE.Group();
 const legs=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.8,0.4),mat(0x3a2f24));legs.position.y=0.4;g.add(legs);
 const torso=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.9,0.5),mat(coat));torso.position.y=1.25;torso.castShadow=true;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),mat(skin||0xd9b48f));head.position.y=2.0;g.add(head);
 let hw=null;if(hat==='tricorn'){hw=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.12,3),mat(0x1a1a1a));hw.position.y=2.28;hw.rotation.y=0.5;g.add(hw);}
 else if(hat==='coif'){hw=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6,0,Math.PI*2,0,1.4),mat(0xd8cdb4));hw.position.y=2.02;g.add(hw);}
 else if(hat==='hood'){hw=new THREE.Mesh(new THREE.ConeGeometry(0.34,0.7,8),mat(0x2a2a2a));hw.position.y=2.3;g.add(hw);}
 else if(hat==='wig'){hw=new THREE.Mesh(new THREE.SphereGeometry(0.32,8,6),mat(0xe8e0cc));hw.position.y=2.05;hw.scale.set(1.1,0.9,1.1);g.add(hw);}
 const arm=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.7,0.16),mat(coat));arm.position.set(0.5,1.3,0.2);g.add(arm);g.userData.arm=arm;
 return g;}
function buildPlayer(){playerMesh=makeHumanoid(0x4a3a5a,0xd9b48f,'tricorn');playerMesh.position.set(G.pos.x,0,G.pos.z);scene.add(playerMesh);
 const sw=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.1,0.2),mat(0xb0b0b0));sw.position.set(0.5,1.3,0.5);playerMesh.add(sw);playerMesh.userData.sword=sw;}
function spawnSkelFarmers(){[['Brother Rattle',22,35],['Sister Clatter',24,33],['Old Marrow',32,35]].forEach(([nm,x,z])=>{
 const m=makeHumanoid(0xe6dcc0,0xe6dcc0,'coif');m.position.set(x,0,z);scene.add(m);
 const hoe=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.4,0.08),mat(0x5a4630));hoe.position.set(0.5,1.0,0.3);hoe.rotation.x=0.3;m.add(hoe);
 const lb=makeLabel('💀 '+nm,0.5);lb.position.set(0,2.9,0);m.add(lb);
 npcs.push({id:'skel_'+nm,n:nm,role:'freed farmer, deceased — the union dead',e:'💀',x,z,c:0xe6dcc0,d:'Freed by shovel and solidarity. “We died in the Seigneur’s furrows, so we kept the furrows. No wages, no rest? No — we voted. We keep the harvest and we keep the hours. The living work beside us, or the dead work without them.” (Recruitable. Killable. The commune will remember either.)',mesh:m,wx:x,wz:z,tx:x,tz:z,wt:0,dead:false,follow:false,skeleton:true});});}
function spawnNPCs(){NPC_DEFS.forEach(d=>{const g=makeHumanoid(d.c,0xd9b48f,d.id==='taxman'?'wig':((d.id==='anselme'||d.id==='pelle')?'hood':((d.id==='odette'||d.id==='lucile'||d.id==='seraphine')?'coif':'tricorn')));
  g.position.set(d.x,0,d.z);scene.add(g);
  const lb=makeLabel(d.e+' '+d.n,0.55);lb.position.set(0,2.9,0);g.add(lb);
  npcs.push({...d,mesh:g,wx:d.x,wz:d.z,tx:d.x,tz:d.z,wt:0,dead:false,follow:false});});}
function spawnFoe(type,x,z){const d=FOE_DEFS[type];let g;
 if(type==='wolf'){g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.8,0.6),mat(0x3a3a3a));b.position.y=0.7;b.castShadow=true;g.add(b);
  const h=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.5),mat(0x2a2a2a));h.position.set(0.9,1.1,0);g.add(h);
  const e1=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,4),new THREE.MeshBasicMaterial({color:0xff2222}));e1.position.set(1.1,1.2,0.2);g.add(e1);
  const e2=e1.clone();e2.position.z=-0.2;g.add(e2);}
 else if(type==='ghost'){g=new THREE.Group();const b=new THREE.Mesh(new THREE.ConeGeometry(0.7,2.2,8),new THREE.MeshLambertMaterial({color:0x9ab0ff,transparent:true,opacity:0.55}));b.position.y=1.4;g.add(b);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,6),new THREE.MeshLambertMaterial({color:0xcdd8ff,transparent:true,opacity:0.6}));h.position.y=2.4;g.add(h);}
 else if(type==='vamp'){g=makeHumanoid(0x6a1a2e,0xe0c0a0,'wig');const cape=new THREE.Mesh(new THREE.PlaneGeometry(1,1.6),new THREE.MeshLambertMaterial({color:0x1a0a0a,side:THREE.DoubleSide}));cape.position.set(0,1.2,-0.35);g.add(cape);}
 else if(type==='demon'){g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,3,1.6),mat(0x5a1000));b.position.y=1.8;b.castShadow=true;g.add(b);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.7,8,6),mat(0x8a1a00));h.position.y=3.8;g.add(h);
  const h1=new THREE.Mesh(new THREE.ConeGeometry(0.25,0.9,6),mat(0x1a0a00));h1.position.set(-0.5,4.5,0);g.add(h1);const h2=h1.clone();h2.position.x=0.5;g.add(h2);
  const e1=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,4),new THREE.MeshBasicMaterial({color:0xffee00}));e1.position.set(-0.25,3.9,0.6);g.add(e1);const e2=e1.clone();e2.position.x=0.25;g.add(e2);
  const fl=new THREE.PointLight(0xff3a00,2,20);fl.position.y=3;g.add(fl);}
 else if(type==='skeleton'){g=makeHumanoid(0xe6dcc0,0xe6dcc0,null);
  const e1=new THREE.Mesh(new THREE.SphereGeometry(0.05,6,4),new THREE.MeshBasicMaterial({color:0xff2222}));e1.position.set(-0.1,2.02,0.24);g.add(e1);
  const e2=e1.clone();e2.position.x=0.1;g.add(e2);
  const ribs=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.3,0.4),mat(0xcabf9f));ribs.position.y=1.35;g.add(ribs);}
 else{g=makeHumanoid(0x5a6a4a,0x9aaa7a,null);g.rotation.z=0.08;}
 g.position.set(x,0,z);scene.add(g);
 const f={type,d:FOE_DEFS[type],mesh:g,hp:d.hp,maxhp:d.hp,cd:0,tx:x,tz:z,wt:rand(0,2),boss:type==='demon'};
 foes.push(f);return f;}
function nightSpawns(dt){spawnT-=dt;if(spawnT>0)return;const night=isNight();
 const cap=night?10:4;if(foes.length>=cap){spawnT=4;return;}
 spawnT=night?rand(3,7):rand(8,16);
 const a=rand(0,Math.PI*2),r=rand(30,70);const x=clamp(G.pos.x+Math.cos(a)*r,-110,110),z=clamp(G.pos.z+Math.sin(a)*r,-110,110);
 let t='risen';const roll=Math.random();
 if(isNight()){if(G.day>=3&&foes.filter(f=>f.boss).length===0&&Math.random()<0.06){bossSpawn();return;}
  if(roll<0.3)t='wolf';else if(roll<0.5)t='ghost';else if(roll<0.62)t='vamp';else if(roll<0.72)t='skeleton';}
 else if(roll<0.12)t='ghost';else if(roll<0.2)t='skeleton';
 if(t==='vamp'&&!isNight()&&Math.random()<0.7)t='risen';
 spawnFoe(t,x,z);}
function bossSpawn(){const f=spawnFoe('demon',14,70);notify('😈','THE BÊTE DE L’ABÎME rises','The mud splits. The swamp’s interest, come to collect.',{tone:'war',major:true});AudioSys.sfx('wolf');AudioSys.setMode('combat');
 $('boss-bar').classList.remove('hidden');subtitle('The swamp’s compound interest, come to collect. Bring silver, fire, and friends.');}
let spawnT=5;
function isNight(){return G.time>=20||G.time<5;}
function collide(x,z,r){for(const c of colliders){if(c.dead)continue;const nx=clamp(x,c.x0,c.x1),nz=clamp(z,c.z0,c.z1);
  const dx=x-nx,dz=z-nz,d=Math.hypot(dx,dz);if(d<r){if(d<0.001){return{x:x+(r),z};}return{x:nx+dx/d*r,z:nz+dz/d*r};}}return{x,z};}

/* ---- combat ---- */
let aiming=false,aimX=0,aimZ=0,shoveCd=0,shoutCd=0,runAcc=0;
const _ray=new THREE.Raycaster(),_ndc=new THREE.Vector2(),_plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function updateAim(cx,cy){if(typeof camera==='undefined')return;_ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);_ray.setFromCamera(_ndc,camera);
 const p=new THREE.Vector3();if(_ray.ray.intersectPlane(_plane,p)){aimX=p.x;aimZ=p.z;}}
function shout(){if(shoutCd>0||!G.started||G.paused||G.dead)return;shoutCd=5;AudioSys.sfx('shot');
 subtitle('“HEY! OVER HERE, YOU HUNGRY LEDGERS!”');
 for(const f of foes){if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<(T('hardhearing')?50:34)){f.tx=G.pos.x+rand(-2,2);f.tz=G.pos.z+rand(-2,2);f.wt=6;}}
 for(const c of critters){if(c.d.flying||c.d.hostile)continue;if(dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z)<20){c.tx=c.mesh.position.x*2-G.pos.x;c.tz=c.mesh.position.z*2-G.pos.z;c.wt=4;}}
 toast('📢 You shout. Everything hungry heard.','bad');}
function shove(){if(shoveCd>0||G.dead||G.paused||!G.started||dlgOpen)return;shoveCd=0.8;
 AudioSys.sfx('swing');let hit=false;
 for(const f of foes){if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<2.4){
  const dx=f.mesh.position.x-G.pos.x,dz=f.mesh.position.z-G.pos.z,d=Math.hypot(dx,dz)||1;
  const cc=collide(clamp(f.mesh.position.x+dx/d*2.5,-112,112),clamp(f.mesh.position.z+dz/d*2.5,-112,112),0.6);
  f.mesh.position.x=cc.x;f.mesh.position.z=cc.z;f.cd=Math.max(f.cd,0.9);
  hurtFoe(f,(3+2*skillLvl('brawl'))*(1+0.04*skillLvl('might')),false);hit=true;}}
 for(const c of [...critters]){if(c.d.flying)continue;if(dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z)<2.4){
  const dx=c.mesh.position.x-G.pos.x,dz=c.mesh.position.z-G.pos.z,d=Math.hypot(dx,dz)||1;
  c.mesh.position.x=clamp(c.mesh.position.x+dx/d*2.5,-112,112);c.mesh.position.z=clamp(c.mesh.position.z+dz/d*2.5,-112,112);
  hurtCritter(c,3+2*skillLvl('brawl'));hit=true;}}
 if(playerMesh.userData.arm){playerMesh.userData.arm.rotation.x=-1.2;setTimeout(()=>{if(playerMesh.userData.arm)playerMesh.userData.arm.rotation.x=0;},150);}
 if(hit)gainXp('brawl',1);}
let atkCd=0;
function playerAttack(){if(atkCd>0||G.dead||G.paused||!G.started)return;
 const w=ITEMS[G.weapon]||ITEMS.rapier;atkCd=w.ranged?Math.max(0.6,1.1-0.05*skillLvl('musket')-(T('dextrous')?0.15:0)):(G.weapon==='axe'?0.7:(G.weapon==='spear'?0.6:((G.weapon==='cudgel'||G.weapon==='fists')?0.32:0.42)));
 AudioSys.sfx(w.ranged?'shot':'swing');
 if(playerMesh.userData.arm)playerMesh.userData.arm.rotation.x=-1.6;
 setTimeout(()=>{if(playerMesh.userData.arm)playerMesh.userData.arm.rotation.x=0;},180);
 if(w.ranged){const needAmmo=G.weapon==='blunderbuss'?2:1;
  if((G.inv.ammo||0)<needAmmo){toast('No cartridge! Craft powder & ball (X).','bad');return;}
  for(let i=0;i<needAmmo;i++)takeItem('ammo',1);gainXp('powder',1);G.shake=Math.max(G.shake||0,0.25);
  for(let i=0;i<10;i++)spawnP(G.pos.x,1.5,G.pos.z,rand(-4,4),rand(1,4),rand(-4,4),0.5,0xffc46a);
  if(G.weapon==='blunderbuss'){let hit=0;const bdmg=(w.dmg+rand(0,8))*(1+0.1*skillLvl('musket'))*(aiming?1.25:1);
   for(const f of [...foes]){if(dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<13){hurtFoe(f,bdmg,true);hit++;}}
   for(const c of [...critters]){if(!c.d.flying&&dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z)<13)hurtCritter(c,bdmg);}
   gainXp('musket',3);toast('📯 The trumpet speaks! '+hit+' horrors peppered.');return;}
  let best=null,bd=T('shortsighted')?20:28,bestC=null;
  for(const f of foes){const d=dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z);if(d<bd){bd=d;best=f;bestC=null;}}
  for(const c of critters){if(c.d.flying)continue;const d=dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z);if(d<bd){bd=d;bestC=c;best=null;}}  if(best){hurtFoe(best,(w.dmg+rand(0,10))*(1+0.1*skillLvl('musket'))*(aiming?1.25:1),true);gainXp('musket',3);}else if(bestC)hurtCritter(bestC,(w.dmg+rand(0,10))*(1+0.1*skillLvl('musket')));return;}
 for(const f of foes){const d=dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z);
  if(d<3.0){const wt=G.weapon==='fists'?'brawl':(G.weapon==='axe'?'axe':(G.weapon==='spear'?'pike':((G.weapon==='cudgel'||G.weapon==='torch')?'blunt':'blade')));
   let dmg=(w.dmg+rand(-2,4))*(1+0.08*skillLvl(wt))*(1+0.04*skillLvl('might'))*(T('smitharms')?1.15:1)*(aiming?1.25:1)*(T('strong')?1.2:1);
   if(wt==='brawl')dmg+=2*skillLvl('brawl')+(T('brawler')?4:0);
   if(G.weapon==='silver'&&f.type==='wolf')dmg*=3;
   if(G.inv.bible&&['ghost','vamp'].includes(f.type))dmg*=1.6;
   if(T('clumsy')&&Math.random()<0.08){toast('🦶 Clumsy swing — air wins.','bad');}else{hurtFoe(f,dmg,false);gainXp(wt,2);}}}
 for(const c of [...critters]){if(c.d.flying)continue;const d=dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z);
  if(d<3.0){const wt2=G.weapon==='fists'?'brawl':(G.weapon==='axe'?'axe':(G.weapon==='spear'?'pike':((G.weapon==='cudgel'||G.weapon==='torch')?'blunt':'blade')));
   hurtCritter(c,(w.dmg+rand(-2,4))*(1+0.08*skillLvl(wt2))*(1+0.04*skillLvl('might')));gainXp(wt2,2);}}}
function hurtFoe(f,dmg,ranged){f.hp-=dmg;AudioSys.sfx('hit');blood(f.mesh.position.x,f.mesh.position.z);
 subtitle(f.d.n+': '+choice(['“Pay us.”','“The ledger bleeds.”','“Mud to mud, debt to debt.”','“Hssss.”','“You weigh nothing.”']));
 if(f.hp<=0)killFoe(f);}
function blood(x,z){const p=new THREE.Mesh(new THREE.SphereGeometry(0.16,6,4),new THREE.MeshBasicMaterial({color:0x8a1010}));
 p.position.set(x,rand(0.5,1.5),z);scene.add(p);setTimeout(()=>scene.remove(p),600);
 for(let i=0;i<8;i++)spawnP(x,1,z,rand(-3,3),rand(1,5),rand(-3,3),rand(0.4,0.9),0xaa1818);}
function killFoe(f){scene.remove(f.mesh);foes.splice(foes.indexOf(f),1);
 G.kills++;G.killsByFoe[f.type]=(G.killsByFoe[f.type]||0)+1;
 addKarma(2,'the commune breathes easier');gainXp('might',2);
 notify('☠',f.d.n+' laid to rest','The commune breathes easier. ('+G.kills+' total)');
 if(f.type==='wolf'&&Math.random()<0.8)dropLoot(f,'pelt',1);
 if(f.type==='vamp'){dropLoot(f,'fang',1);if(Math.random()<0.5)dropLoot(f,'coin',8);}
 if(f.type==='skeleton'){dropLoot(f,'bone',1);if(Math.random()<0.4)dropLoot(f,'coin',4);}
 if(f.type==='ghost'&&Math.random()<0.5)dropLoot(f,'ash',1);
 if(f.type==='risen'&&Math.random()<0.4)dropLoot(f,'bread',1);
 if(f.type==='demon'){onBossDead();}
 AudioSys.sfx('hurt');checkQuestKill(f.type);}
function dropLoot(f,item,n){addItem(item,n);toast(f.d.e+' dropped: '+ITEMS[item].n+' ×'+n);}
function hurtPlayer(dmg,why){if(G.dead||!G.started||G.paused||dlgOpen)return;
 if(G.wardUntil&&performance.now()<G.wardUntil)dmg*=0.5;
 if(T('thickskin'))dmg*=0.85;if(T('thinskin'))dmg*=1.15;
 if(T('hemo')&&dmg>=5){G.sanity=Math.max(0,G.sanity-4);toast('🩸 Blood. Too much blood. (−4 🕯)','bad');}
 G.hp-=dmg;AudioSys.sfx('hurt');
 const df=$('damage-flash');df.style.opacity=0.9;setTimeout(()=>df.style.opacity=0,300);
 if(G.hp<=0){G.hp=0;die(why||'the bayou took its tithe');}refreshHUD();}
/* ---- foe AI ---- */
function foeUpdate(f,dt){const m=f.mesh;f.cd-=dt;
 const px=G.pos.x,pz=G.pos.z;const d=dist2(m.position.x,m.position.z,px,pz);
 const sanctuary=dist2(px,pz,-34,-12)<13;
 let spd=f.d.spd;
 if(f.type==='wolf'&&!isNight())spd*=0.55;
 if(f.type==='vamp'&&!isNight()){spd*=0.4;f.hp-=dt*2;if(f.hp<=0){killFoe(f);subtitle('Dawn unmakes the vain. The Sang-Mêlé is ash.');return;}}
 if(f.type==='ghost'&&sanctuary)spd*=0.5;
 if(f.type==='demon'){const bf=$('boss-fill');if(bf)bf.style.width=(100*f.hp/f.maxhp)+'%';}
 const aggroR=(G.sneaking?0.5:1)*Math.max(12,26-1.5*skillLvl('sneak'))*(T('inconspicuous')?0.8:1)*(T('conspicuous')?1.25:1)*(T('graceful')?0.85:1);
 if(d<aggroR||f.hp<f.maxhp){ // aggro
  const dx=(px-m.position.x)/d,dz=(pz-m.position.z)/d;
  let nx=m.position.x+dx*spd*dt,nz=m.position.z+dz*spd*dt;
  let bar=null,bd=2.6;for(const b of barricades){if(b.hp<=0)continue;const dd=dist2(m.position.x,m.position.z,b.x,b.z);if(dd<bd){bd=dd;bar=b;}}
  if(bar){if(f.cd<=0){f.cd=1.4;bar.hp-=f.d.dmg+rand(0,4);AudioSys.sfx('hit');bar.mesh.rotation.y+=0.2;bar.mesh.position.y=Math.max(-0.4,(bar.mesh.position.y||0)-0.06);
   if(bar.hp<=0)breakBarricade(bar);else toast('🚧 The dead gnaw the barricade ('+Math.round(bar.hp)+'/'+bar.maxhp+').');}}
  else{const c=collide(nx,nz,0.6);m.position.x=c.x;m.position.z=c.z;}
  m.lookAt(px,0,pz);
  if(f.type==='ghost')m.position.y=0.4+Math.sin(performance.now()/400)*0.3;
  if(f.type==='demon'&&Math.random()<dt*0.8){hurtPlayer(12,'demon-fire');toast('🔥 The Bête breathes furnace-air!','bad');}
  if(d<(f.boss?3.2:1.8)&&f.cd<=0){f.cd=f.boss?1.2:1.5;
   let dmg=f.d.dmg+rand(-3,4);if(f.type==='ghost')dmg=8+G.infected*2;
   if(Math.random()<0.02*skillLvl('foot')){toast('🌀 You slip the blow clean.','good');gainXp('foot',2);}
   else{hurtPlayer(dmg,f.d.n);
   const fright=({risen:3,wolf:5,ghost:8,vamp:6,demon:10,skeleton:5}[f.type]||3)*(T('brave')?0.7:1)*(T('cowardly')?1.5:1)*(T('desens')?0.5:1);
   G.sanity=Math.max(0,G.sanity-fright);if(G.sanity<=10)subtitle('🕯 Your hands will not stop shaking.');
   toast(f.d.e+' '+f.d.n+' wounds you (−'+Math.round(dmg)+' HP, −'+fright+' 🕯)','bad');}}
 } else {f.wt-=dt;if(f.wt<=0){f.wt=rand(2,5);f.tx=m.position.x+rand(-14,14);f.tz=m.position.z+rand(-14,14);}
  const dx=f.tx-m.position.x,dz=f.tz-m.position.z,dd=Math.hypot(dx,dz);
  if(dd>1){const c=collide(m.position.x+dx/dd*spd*0.4*dt,m.position.z+dz/dd*spd*0.4*dt,0.6);m.position.x=c.x;m.position.z=c.z;}}
 if(m.position.y>0&&f.type!=='ghost')m.position.y=0;}
/* ---- npc AI ---- */
function npcUpdate(n,dt){if(n.dead)return;const m=n.mesh;
 if(n.follow&&!G.dead){const d=dist2(m.position.x,m.position.z,G.pos.x,G.pos.z);
  if(d>3){const dx=(G.pos.x-m.position.x)/d,dz=(G.pos.z-m.position.z)/d;const c=collide(m.position.x+dx*3.4*dt,m.position.z+dz*3.4*dt,0.6);m.position.x=c.x;m.position.z=c.z;m.lookAt(G.pos.x,0,G.pos.z);}
  // companions fight
  for(const f of [...foes]){if(dist2(m.position.x,m.position.z,f.mesh.position.x,f.mesh.position.z)<2.2&&Math.random()<dt*1.2){hurtFoe(f,8+rand(0,6),false);}}
  return;}
 n.wt-=dt;if(n.wt<=0){n.wt=rand(4,10);n.tx=n.wx+rand(-8,8);n.tz=n.wz+rand(-8,8);}
 const dx=n.tx-m.position.x,dz=n.tz-m.position.z,dd=Math.hypot(dx,dz);
 if(dd>0.6){const c=collide(m.position.x+dx/dd*1.2*dt,m.position.z+dz/dd*1.2*dt,0.5);m.position.x=c.x;m.position.z=c.z;m.lookAt(n.tx,0,n.tz);}}
/* ============ QUESTS ============ */
function unlockQuests(){qdefAll().forEach(q=>{if(!G.quests[q.id])G.quests[q.id]={st:'lock',have:{}};const s=G.quests[q.id];if(s.st!=='lock')return;
 if(q.chain==='main'){const order=['q_bread','q_dead','q_ghost','q_tax','q_manor','q_level'];
  const i=order.indexOf(q.id);if(i===0||G.quests[order[i-1]].st==='done'){s.st='open';}}
 else{if(q.trait&&!hasTrait(q.trait))return;s.st='open';}});}
function qdefAll(){return QUESTS;}
function acceptQuest(id){const s=G.quests[id];if(s.st!=='open')return;s.st='active';G.qactive.push(id);
 AudioSys.sfx('quest');notify('📜','New directive: '+qdef(id).n,'The ledger remembers. The mud watches.',{tone:'lore',major:true,action:{label:'Ledger',fn:()=>togglePanel('panel-quests',renderQuests)}});renderQuests();checkQuestItem();}
function checkQuestItem(){for(const id of [...G.qactive]){const q=qdef(id),s=G.quests[id];let done=true;
 for(const o of q.obj){if(o.t==='collect'){const have=o.item==='coin'?G.coins:(G.inv[o.item]||0);s.have[o.item]=Math.min(have,o.n);if(have<o.n)done=false;}else done=false;}
 if(done)completeQuest(id);}refreshTracker();}
function checkQuestKill(type){for(const id of [...G.qactive]){const q=qdef(id),s=G.quests[id];
 for(const o of q.obj){if(o.t==='kill'&&o.foe===type){s.have['k_'+o.foe]=(s.have['k_'+o.foe]||0)+1;}}
 let done=true;for(const o of q.obj){if(o.t==='kill'&&(s.have['k_'+o.foe]||0)<o.n)done=false;if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);if(h<o.n)done=false;}if(o.t!=='kill'&&o.t!=='collect')done=false;}
 if(done)completeQuest(id);}refreshTracker();}
function checkQuestVisit(){for(const id of [...G.qactive]){const q=qdef(id),s=G.quests[id];
 for(const o of q.obj){if(o.t==='visit'){const z=ZONES.find(z=>z.id===o.zone);if(dist2(G.pos.x,G.pos.z,z.x,z.z)<z.r){s.have['v_'+o.zone]=1;toast('❖ Charted: '+z.n);AudioSys.sfx('pickup');}}}
 let done=q.obj.every(o=>o.t!=='visit'||s.have['v_'+o.zone]);const othersDone=q.obj.filter(o=>o.t!=='visit').every(o=>{if(o.t==='collect')return (o.item==='coin'?G.coins:(G.inv[o.item]||0))>=o.n;return false;});
 if(done&&othersDone&&q.obj.some(o=>o.t==='visit'))completeQuest(id);}refreshTracker();}
function buryAt(){G.buried++;addKarma(4,'the dead rest easier');
 for(const id of [...G.qactive]){const q=qdef(id),s=G.quests[id];for(const o of q.obj){if(o.t==='bury'){s.have.bury=(s.have.bury||0)+1;
  if(s.have.bury>=o.n)completeQuest(id);}}}
 AudioSys.sfx('pray');subtitle(choice(['“Dust you were, ledger you are not.”','“No rent in this grave.”','“Rest, worker. The strike continues.”']));refreshTracker();}
function completeQuest(id){const q=qdef(id),s=G.quests[id];if(s.st==='done')return;
 for(const o of q.obj){if(o.t==='collect'&&ITEMS[o.item]&&!ITEMS[o.item].quest)takeItem(o.item,o.n);}
 s.st='done';G.qactive=G.qactive.filter(x=>x!==id);
 if(id==='q_t_coward'){G.traits=G.traits.filter(t=>t!=='cowardly');toast('🦁 The fear leaves you at the third pelt. You stand straighter.','good');}
 if(id==='q_t_haunt'){G.traits=G.traits.filter(t=>t!=='haunted');toast('👻 Unaccompanied at last. The ship is finally behind you.','good');}
 if(q.rw){for(const k in q.rw){if(k==='karma')addKarma(q.rw[k],q.n);else if(k==='coin'){G.coins+=q.rw[k];}else if(q.rw[k]>0)addItem(k,q.rw[k]);}}
 if(id==='q_tax')G.taxPaid=true;
 AudioSys.sfx('quest');notify('✔','Decision resolved: '+q.n,'The ledger remembers. The commune nods.',{major:true,action:{label:'Ledger',fn:()=>togglePanel('panel-quests',renderQuests)}});
 subtitle('“'+choice(['The commune nods.','The mud approves.','Even the bell sounds pleased.','Debts burned, page by page.'])+'”');
 unlockQuests();renderQuests();refreshHUD();checkEnding();}
function onBossDead(){$('boss-bar').classList.add('hidden');AudioSys.bell();
 notify('⚜','The Bête is leveled','The swamp steams. The ledgers burn. History holds its breath.',{major:true});
 for(const id of [...G.qactive]){const q=qdef(id);if(q.obj.some(o=>o.t==='kill'&&o.foe==='demon'))completeQuest(id);}
 if(!G.endingShown){G.endingShown=true;showEnding();}}
function checkEnding(){const l=G.quests['q_level'];if(l&&l.st==='done')return;
 if(G.day>=3&&(G.quests['q_manor'].st==='done')){if(l.st==='open'){acceptQuest('q_level');subtitle('The bell tolls thirteen. All debts come due at once.');AudioSys.bell();}}}
/* ============ SURVIVAL + TIME ============ */
function survival(dt){const night=isNight();
 G.hunger=Math.max(0,G.hunger-dt*(100/420)*(night?1.25:1)*(1-0.03*skillLvl('vigor'))*(T('consumption')?1.1:1)*(T('maroon')?0.9:1)*(T('lighteater')?0.85:1)*(T('hearty')?1.2:1));
 G.mana=Math.min(G.maxmana,G.mana+dt*0.8);
 if(G.hunger<=0){G.hp-=dt*3;}
 if(G.infected>0){G.hp-=dt*1.6;G.infected-=dt/90;if(G.infected<=0){G.infected=0;toast('The fever breaks.','good');}}
 if(G.hunger>60&&G.hp<G.maxhp&&G.infected<=0)G.hp+=dt*0.8*(T('fastheal')?2:1);
 const dark=night&&!G.lantern;let nearFire=false;for(const f of fires){if(dist2(G.pos.x,G.pos.z,f.x,f.z)<6){nearFire=true;break;}}
 const chap=dist2(G.pos.x,G.pos.z,-34,-12)<13;
 if(dark&&!nearFire&&!chap)G.sanity-=dt*2.2*(T('nightblind')?1.3:1)*(T('malaria')?1.2:1)*(T('nightowl')?0.6:1)*(T('nightvision')?0.5:1)*(T('cateyes')?0.7:1);else if(nearFire||chap||G.lantern)G.sanity=Math.min(100,G.sanity+dt*3);
 if(G.sanity<=0){G.hp-=dt*2;if(Math.random()<dt*0.2)subtitle('The faces in the mist wear your outstanding debts.');}
 if(G.sanity<(T('haunted')?45:30)&&Math.random()<dt*0.06)subtitle('🕯 '+choice(['“Pay us…” breathes the dark.','Something counts your debts aloud.','The mist wears a face you buried.','Thirteen bells. Twelve were real.','Your shadow arrives a moment late.']));
 if(G.hp<=0){G.hp=0;die('hunger, fever and the dark together');}
 const INDOORS=[[36,28],[12,34],[-24,34],[34,-8],[0,-46]];
 if(T('agora')&&Math.hypot(G.pos.x,G.pos.z)>58&&G.time>=6&&G.time<20)G.sanity=Math.max(0,G.sanity-dt*1.0);
 if(T('claustro')&&INDOORS.some(([ix,iz])=>dist2(G.pos.x,G.pos.z,ix,iz)<4.5))G.sanity=Math.max(0,G.sanity-dt*1.2);
 if(G.deafT>0){G.deafT-=dt;if(AudioSys.master)AudioSys.master.gain.value=0;if(Math.random()<dt*0.1)subtitle('*muffled ringing*');}
 else if(AudioSys.master&&!AudioSys.muted)AudioSys.master.gain.value=0.7;
 // lantern drains nothing (pine is cheap); sprint drains stam
 refreshHUD();}
function sanityDesc(s){return s>80?'Steadfast':s>55?'Steady':s>30?'Shaken':s>10?'Unraveling':'Gone to the mist';}
/* every horror in the parish gnaws at reason */
function sanityAura(dt){if(G.dead||!G.started||G.paused)return;
 const chap=dist2(G.pos.x,G.pos.z,-34,-12)<13;
 let nearFire=false;for(const f of fires){if(dist2(G.pos.x,G.pos.z,f.x,f.z)<6){nearFire=true;break;}}
 const ward=(G.lantern||nearFire||chap)?0.5:1;
 for(const f of foes){const d=dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z);
  let rate=0,r=0;
  if(f.type==='risen'){rate=1.0;r=8;}else if(f.type==='wolf'){rate=isNight()?3.0:1.6;r=12;}
  else if(f.type==='ghost'){rate=3.5;r=14;if(chap)rate*=0.4;if(T('superstitious'))rate*=1.5;}
  else if(f.type==='vamp'){rate=2.5;r=12;}else if(f.type==='demon'){rate=4.0;r=24;}
  else if(f.type==='skeleton'){rate=1.4;r=9;}
  if(rate>0&&d<r)G.sanity=Math.max(0,G.sanity-rate*ward*(1-d/(r*1.5))*dt*1.5*(T('desens')?0.7:1));}}
function advanceTime(dt){const prev=G.time;G.time+=dt*(24/480);
 if(G.time>=24){G.time-=24;G.day++;AudioSys.bell();toast('☀ Day '+G.day+' — the bell counts what the Seigneur cannot.','good');
  if(T('smoker')&&!hasItem('tobacco',1)){G.sanity=clamp(G.sanity-10,0,100);toast('🚬 Dawn and no leaf. The hands shake till noon. (−10 🕯)','bad');}
  if(G.day===3){subtitle('The air tastes of iron. Tonight the bell will toll thirteen.');AudioSys.setMode('night');}
  unlockQuests();}
 // weather drift
 if(Math.random()<dt*0.02)G.weather=choice(['mist','mist','rain','clear','mosquitoes','dead-calm']);
 // music mode
 if(!G.dead){if(foes.some(f=>dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z)<14))AudioSys.setMode('combat');
  else if(dist2(G.pos.x,G.pos.z,-34,-12)<16)AudioSys.setMode('chapel');
  else if(isNight())AudioSys.setMode('night');else AudioSys.setMode('day');}}
function updateSky(){const t=G.time;let dayAmt=clamp(1-Math.abs(t-13)/8,0,1);
 const night=isNight();
 const dawnAmt=clamp(1-Math.abs(t-6.5)/1.8,0,1),duskAmt=clamp(1-Math.abs(t-18.8)/1.8,0,1);
 const lowSun=Math.max(dawnAmt,duskAmt);
 const sky=new THREE.Color().setHSL(0.58,0.32,night?0.035:0.24+dayAmt*0.32);
 if(!night&&lowSun>0)sky.lerp(new THREE.Color(0xd86a2a),lowSun*0.55);
 if(G.weather==='rain')sky.multiplyScalar(0.7);
 scene.background=sky;scene.fog.color.copy(sky).multiplyScalar(0.95);
 sun.intensity=night?0:(0.5+dayAmt*1.2)*(G.weather==='rain'?0.55:1);
 sun.color.setHex(lowSun>0.25?0xff9a5a:(dayAmt>0.5?0xfff2dd:0xffd9a0));
 moon.intensity=night?(G.weather==='rain'?0.15:0.6):0;
 const ang=(t/24)*Math.PI*2;
 sun.position.set(G.pos.x+50*Math.cos(ang),Math.max(8,60*Math.sin(ang)+18),G.pos.z+30);
 moon.position.set(G.pos.x-30,50,G.pos.z-20);
 hemi.intensity=night?0.34:0.95;
 if(scene.userData.amb)scene.userData.amb.intensity=night?0.5:0.32;
 renderer.toneMappingExposure=(night?1.25:1.1)*(G.weather==='rain'?0.9:1);
 const flick=1+Math.sin(performance.now()/90)*0.12;
 torchLight.intensity=G.lantern?2.2*flick:0;torchLight.position.set(G.pos.x,2.5,G.pos.z);
 lanternLight.intensity=night?0.6:0;lanternLight.position.set(G.pos.x,6,G.pos.z);
 fires.forEach(f=>{f.light.intensity=(night?1.6:0.7)*flick;f.flame.scale.setScalar(night?1.2:0.8);});
 // rain visual: simple particles skip; tint
}
function die(why){if(G.dead)return;G.dead=true;AudioSys.sfx('hurt');AudioSys.setMode('menu');AudioSys.fade(0.03,2.5);
 document.exitPointerLock&&document.exitPointerLock();
 dropSatchel();
 $('death-text').textContent='“'+why+'.” Day '+G.day+', '+fmtT(G.time)+'. '+(G.grave?'Your satchel lies where you fell — marked ⚰ on the ring.':'')+' Karma: '+G.karma+' ('+karmaTitle(G.karma)+'). Kills: '+G.kills+'. Buried: '+G.buried+'.';
 $('death-stats').innerHTML='The Risen get +1 coworker. The commune gets +1 martyr. Press wake to continue the Requiem.';
 $('death').classList.remove('hidden');}
/* ============ UI helpers ============ */
/* CK3-style notifications: right-side court feed, majors persist, minors fade */
function notify(icon,title,body,opts){opts=opts||{};const feed=$('ck3-feed');if(!feed)return null;
 const d=document.createElement('div');d.className='notif '+(opts.tone||'info')+(opts.major?' major':'');
 const b=document.createElement('span');b.className='nbody';b.innerHTML='<b>'+title+'</b><span>'+body+'</span>';
 d.innerHTML='<span class="nicon">'+icon+'</span>';d.appendChild(b);
 if(opts.action){const a=document.createElement('button');a.className='nact';a.textContent=opts.action.label;
  a.onclick=e=>{e.stopPropagation();opts.action.fn();if(!opts.major)d.remove();};d.appendChild(a);}
 if(opts.major){const x=document.createElement('span');x.className='nx';x.textContent='✕';x.title='dismiss';
  x.onclick=e=>{e.stopPropagation();d.remove();};d.appendChild(x);AudioSys.bell();}
 else setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),600);},9000);
 feed.prepend(d);
 while(feed.children.length>7){const kids=[...feed.children].reverse();(kids.find(k=>!k.classList.contains('major'))||kids[0]).remove();}
 return d;}
function tipFor(key){const pc=(v,m)=>'<span class="tpct">'+Math.max(0,Math.round(v))+' / '+m+' ('+Math.max(0,Math.round(100*v/m))+'%)</span>';
 switch(key){
  case 'hp':return '<b>❤ Health</b><br>'+pc(G.hp,G.maxhp)+'<br><small>Empty bellies bleed it. Bite fever spends it. Bandages, stew and sleep buy it back. At zero: the chapel steps.</small>';
  case 'hunger':return '<b>🍖 Belly</b><br>'+pc(G.hunger,100)+'<br><small>Burns over ~7 minutes, faster running or freezing. At zero your health drains. Forage, hunt, cook, buy.</small>';
  case 'stam':return '<b>⚡ Stamina</b><br>'+pc(G.stam,100)+'<br><small>Sprinting spends it; standing still refunds it. Empty lungs mean slow feet.</small>';
  case 'sanity':return '<b>🕯 Reason</b><br>'+pc(G.sanity,100)+' — '+sanityDesc(G.sanity)+'<br><small>Every horror gnaws it. Wine, smoke, sleep, confession and company restore it. Below 30 the dark talks back.</small>';
  case 'mana':return '<b>🌀 Spirit</b><br>'+pc(G.mana,G.maxmana)+'<br><small>Fuel for conjure. Trickles back slowly; rituals at altars restore floods. Gris-gris raises the maximum.</small>';
  case 'karma':return '<b>⚖ Karma — '+karmaTitle(G.karma)+'</b><br><span class="tpct">'+G.karma+' (−100 … +100)</span><br><small>Kindness, graves and honest work raise it; murder, theft and lies lower it. Saints get discounts and volunteers.</small>';
  case 'clock':return '<b>🕰 The bell</b><br>Day '+G.day+' · '+fmtT(G.time)+'<br><small>A full day turns in 8 minutes. Night (20:00–05:00) belongs to the dead shift. The Leveling Night comes on Night 3.</small>';
  default:break;}
 if(key.startsWith('hot:')){const it=ITEMS[key.slice(4)];if(!it)return null;
  return '<b>'+it.e+' '+it.n+'</b><br><small>'+it.d+'</small>'+(it.dmg?'<br><span class="tpct">Damage '+it.dmg+'</span>':'');}
 if(key.startsWith('skill:')){const s=SKILLS[key.slice(6)];if(!s)return null;const sk=(G.skills&&G.skills[key.slice(6)])||{xp:0,lvl:0};
  return '<b>'+s.e+' '+s.n+' — level '+sk.lvl+'</b><br>'+pc(sk.xp,sk.lvl<SKILL_MAX?skillNeed(sk.lvl+1):sk.xp)+'<br><small>'+s.d+'</small>';}
 if(key.startsWith('trait:')){const t=TRAITS[key.slice(6)];if(!t)return null;
  return '<b>'+t.e+' '+t.n+'</b> <small>'+(t.cost>0?'blessing, −'+t.cost+' pts':'scar, +'+(-t.cost)+' pts')+'</small><br><small>'+t.d+'</small>';}
 if(key.startsWith('work:')){const J=JOBS[key.slice(5)];if(!J)return null;const w=(G.work&&G.work[key.slice(5)])||{xp:0,tier:0};
  return '<b>'+J.e+' '+J.n+' — '+TIER_NAMES[w.tier]+'</b><br>'+pc(w.xp,w.tier<4?TIER_XP[w.tier+1]:w.xp)+'<br><small>~'+Math.round(J.pay*(1+0.3*w.tier))+' 🪙 · +'+(J.sanity+Math.min(6,w.tier*2))+' 🕯 · '+J.site+'</small>';}
 if(key.startsWith('spell:')){const s=SPELLS.find(s=>s.id===key.slice(6));if(!s)return null;
  return '<b>'+s.e+' '+s.n+'</b> <span class="tpct">'+s.cost+' 🌀</span><br><small>'+s.desc+'</small>';}
 return null;}
function bootTips(){const tip=document.getElementById('tooltip');if(!tip)return;
 document.addEventListener('mouseover',e=>{const t=e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
  if(!t){tip.classList.add('hidden');return;}const h=tipFor(t.getAttribute('data-tip'));if(!h){tip.classList.add('hidden');return;}
  tip.innerHTML=h;tip.classList.remove('hidden');});
 document.addEventListener('mousemove',e=>{if(tip.classList.contains('hidden'))return;
  tip.style.left=Math.min(innerWidth-290,e.clientX+16)+'px';tip.style.top=Math.min(innerHeight-140,e.clientY+14)+'px';});
 document.addEventListener('mouseout',e=>{const r=e.relatedTarget;if(!r||!r.closest||!r.closest('[data-tip]'))tip.classList.add('hidden');});}
function toast(msg,cls,major){const m={bad:['⚠','Peril','war'],good:['⚜','Good news','good'],lore:['📜','Chronicle','lore']}[cls]||['🔔','Notice','info'];
 notify(m[0],m[1],msg,{tone:m[2],major:!!major});}
const AL={};
function alertOnce(key,triggered,cleared,make){if(triggered&&!AL[key]){AL[key]=true;make();}else if(cleared&&AL[key]){AL[key]=false;}}
function ck3alerts(){alertOnce('starve',G.hunger<=10,G.hunger>30,()=>notify('🍖','The belly rebels','Starvation gnaws. Eat, or the mud eats you.',{tone:'war',major:true,action:{label:'Satchel',fn:()=>togglePanel('panel-inventory',renderInventory)}}));
 alertOnce('bleed',G.hp<=G.maxhp*0.25,G.hp>G.maxhp*0.6,()=>notify('🩸','Bleeding out','Bind it, brew it, or pray over it.',{tone:'war',major:true,action:{label:'Satchel',fn:()=>togglePanel('panel-inventory',renderInventory)}}));
 alertOnce('fever',G.infected>0,G.infected<=0,()=>notify('🤢','Fever in the blood','Wormwood or tonic. Now.',{tone:'war',major:true}));
 alertOnce('mind',G.sanity<=15,G.sanity>40,()=>notify('🕯','The mind frays','Whispers, then teeth. Wine, smoke, sleep, confession.',{tone:'war',major:true,action:{label:'Soul',fn:()=>togglePanel('panel-char',renderChar)}}));
 alertOnce('dusk'+G.day,G.time>=19&&G.time<20.5,G.time<12,()=>notify('🌙','The dead shift approaches','Bar the doors. Trim the lantern. The bell counts down.',{tone:'war',major:true}));
 alertOnce('boss'+G.day,G.day>=3&&foes.some(f=>f.boss),G.day<3,()=>notify('😈','THE BÊTE IS ABROAD','The swamp’s interest, come to collect.',{tone:'war',major:true}));}
let subT=null;function subtitle(msg,ms){const s=$('subtitle');s.innerHTML=msg;s.classList.remove('hidden');
 if(subT)clearTimeout(subT);subT=setTimeout(()=>s.classList.add('hidden'),ms||4200);}
function refreshHUD(){$('bar-hp').style.width=clamp(100*G.hp/G.maxhp,0,100)+'%';$('txt-hp').textContent=Math.max(0,Math.ceil(G.hp));
 $('bar-hunger').style.width=G.hunger+'%';$('txt-hunger').textContent=Math.ceil(G.hunger);
 $('bar-stam').style.width=G.stam+'%';$('txt-stam').textContent=Math.ceil(G.stam);
 $('bar-sanity').style.width=clamp(G.sanity,0,100)+'%';$('txt-sanity').textContent=Math.max(0,Math.ceil(G.sanity));
 $('bar-mana').style.width=clamp(100*G.mana/G.maxmana,0,100)+'%';$('txt-mana').textContent=Math.max(0,Math.floor(G.mana));
 $('bar-karma').style.width=((G.karma+100)/2)+'%';$('txt-karma').textContent=G.karma;
 $('karma-title').textContent='⚖ '+karmaTitle(G.karma);
 $('clock-day').textContent='Day '+G.day+' · 1666';
 $('clock-time').textContent=(isNight()?'☾ ':'☀ ')+fmtT(G.time);
 $('clock-phase').textContent=G.time<5?'Witching hour':G.time<8?'Morning mists':G.time<12?'Labour bell':G.time<17?'Heavy heat':G.time<20?'Dusk parley':'The dead shift';
 $('weather-line').textContent={mist:'🌫 bayou mist',rain:'🌧 black rain',clear:'🌤 pale sun',mosquitoes:'🦟 mosquito psalm','dead-calm':'🕯 dead-calm air'}[G.weather]||'🌫 bayou mist';
 $('inv-count').textContent='· '+Object.values(G.inv).reduce((a,b)=>a+b,0)+' things · '+G.coins+' livres';}
const HOT=['rapier','axe','musket','torch','bread','tonic'];
function refreshHotbar(){const h=$('hotbar');h.innerHTML='';HOT.forEach((id,i)=>{const it=ITEMS[id];const d=document.createElement('div');
 d.className='slot'+(G.weapon===id?' active':'');d.setAttribute('data-tip','hot:'+id);d.innerHTML='<span class="key">'+(i+1)+'</span><span class="em">'+it.e+'</span><span class="nm">'+it.n.split(' ')[0]+'</span><span class="ct">'+(G.inv[id]||'')+'</span>';
 d.title=it.n+' — '+it.d;d.onclick=()=>useItem(id);h.appendChild(d);});}
function useItem(id){const it=ITEMS[id];if(!it)return;if(!hasItem(id,1)){toast('None left: '+it.n,'bad');return;}
 if(it.use==='eat'){takeItem(id,1);if(T('weakstomach')&&['rabbit','venison','pork','bearmeat','snakemeat','coon','possum','duck','turkey','squirrel','gator','turtle','froglegs','crawfish','catfish'].includes(id)&&Math.random()<0.2){G.hp=Math.max(1,G.hp-5);toast('🤢 Raw and wriggling. Cook it next time, cher.','bad');}G.hunger=clamp(G.hunger+it.hunger*(1+0.05*skillLvl('cook'))*(T('cook')?1.15:1)*(T('nutritionist')?1.05:1),0,100);if(it.hp)G.hp=clamp(G.hp+it.hp,0,G.maxhp);if(id==='yaupon'){G.sanity=clamp(G.sanity+12,0,100);toast('🍃 Cassina clarity. (+12 🕯)','good');}AudioSys.sfx('eat');toast(it.e+' You eat: '+it.n+' (+'+it.hunger+' 🍖)');}
 else if(it.use==='heal'){takeItem(id,1);const amt=Math.round(it.hp*(1+0.1*skillLvl('aid'))*(T('faider')?1.2:1)*(T('tailor')?1.1:1));G.hp=clamp(G.hp+amt,0,G.maxhp);gainXp('aid',2);if(it.cure)G.infected=0;AudioSys.sfx('eat');toast(it.e+' '+it.n+' (+'+it.hp+' ❤)'+(it.cure?' · fever broken':''),'good');}
 else if(it.use==='equip'){G.weapon=id;if(id==='torch')G.lantern=true;AudioSys.sfx('pickup');toast(it.e+' Wielding: '+it.n);refreshHotbar();}
 else if(it.use==='bless'){toast('📖 The Geneva bible rides in your pocket. Apparitions & vampires fear its margins.','good');}
 else if(it.use==='drink'){takeItem(id,1);G.hunger=clamp(G.hunger+(it.hunger||0),0,100);G.sanity=clamp(G.sanity+(it.sanity||10),0,100);if(it.hp)G.hp=clamp(G.hp+it.hp,1,G.maxhp);AudioSys.sfx('eat');toast(it.e+' '+it.n+' (+'+(it.sanity||10)+' 🕯)'+(id==='tafia'?' — fire all the way down.':''),'good');}
 else if(it.use==='smoke'){takeItem(id,1);G.sanity=clamp(G.sanity+(it.sanity||10),0,100);G.hp=clamp(G.hp+it.hp,1,G.maxhp);AudioSys.sfx('pray');toast('🚬 You smoke a slow bowl. The mist keeps its distance. (+'+(it.sanity||10)+' 🕯)','good');}
 else if(it.use==='place'){if(!takeItem(id,1))return;placeBarricade();refreshHotbar();}
 else if(it.use==='launch'){if(!takeItem(id,1))return;launchCanoe();refreshHotbar();}
 else if(it.use==='bomb'){let tgt=null,bd=22;for(const f of foes){const d=dist2(G.pos.x,G.pos.z,f.mesh.position.x,f.mesh.position.z);if(d<bd){bd=d;tgt=f;}}
  if(!tgt){toast('💣 No horror in throw — hold it.','bad');return;}
  if(!takeItem(id,1))return;AudioSys.sfx('swing');
  detonate(tgt.mesh.position.x,tgt.mesh.position.z,5,Math.round(70*(1+0.1*skillLvl('powder'))));refreshHotbar();}
 else if(it.use==='keg'){if(!takeItem(id,1))return;placeKeg();refreshHotbar();}
 else if(it.use==='charm'){if(G.charm){toast('🧿 The gris-gris already rides with you.','good');return;}G.charm=true;G.maxmana=120;G.mana=Math.min(120,G.mana+20);AudioSys.sfx('pray');toast('🧿 Gris-gris on. +20 max spirit. (+20 🌀 now)','good');}
 else toast(it.d);refreshHUD();}
function refreshTracker(){const t=$('quest-tracker');t.innerHTML='';
 G.qactive.slice(0,4).forEach(id=>{const q=qdef(id),s=G.quests[id];const d=document.createElement('div');d.className='qtask';
  let objs=q.obj.map(o=>{if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);return Math.min(h,o.n)+'/'+o.n+' '+o.label;}
   if(o.t==='kill')return (s.have['k_'+o.foe]||0)+'/'+o.n+' '+o.label;
   if(o.t==='bury')return (s.have.bury||0)+'/'+o.n+' '+o.label;
   if(o.t==='forage')return (s.have.forage||0)+'/'+o.n+' '+o.label;
   if(o.t==='hunt')return (s.have.hunt||0)+'/'+o.n+' '+o.label;
   if(o.t==='torch')return (G.planted||0)+'/'+o.n+' '+o.label;
   if(o.t==='work')return (s.have['w_'+o.job]||0)+'/'+o.n+' '+o.label;
   if(o.t==='ritual')return (s.have.ritual||0)+'/'+o.n+' '+o.label;
   if(o.t==='wife')return o.label;
   if(o.t==='tax')return G.taxPaid?'✔ settled':'○ unsettled';
   if(o.t==='visit')return (s.have['v_'+o.zone]?'✔ ':'○ ')+o.label;
   return o.label;}).join(' · ');
  d.innerHTML='<b>'+q.n+'</b><div class="obj">'+objs+'</div>';t.appendChild(d);});}
function closePanels(){['panel-inventory','panel-craft','panel-quests','panel-char','panel-map','panel-work','panel-spells','panel-skills','panel-songs'].forEach(p=>{const el=document.getElementById(p);if(el)el.classList.add('hidden');});}
function togglePanel(id,render){const el=document.getElementById(id);if(!el)return;const was=el.classList.contains('hidden');closePanels();if(was){if(render)render();el.classList.remove('hidden');AudioSys.sfx('pickup');}}
function renderInventory(){const g=$('inv-grid');g.innerHTML='';const ids=Object.keys(G.inv);
 if(!ids.length)g.innerHTML='<i>Empty satchel. The mud provides — search crates (E).</i>';
 ids.forEach(id=>{const it=ITEMS[id];if(!it)return;const d=document.createElement('div');d.className='inv-item'+(G.weapon===id?' equipped':'');
  d.innerHTML='<div class="em">'+it.e+'</div><div>'+it.n+'</div><div>×'+G.inv[id]+'</div>';
  d.onclick=()=>{useItem(id);renderInventory();$('inv-detail').textContent=it.n+': '+it.d;};
  d.oncontextmenu=e=>{e.preventDefault();takeItem(id,1);addKarma(-1,'littering the commons');renderInventory();refreshHotbar();};
  g.appendChild(d);});
 $('inv-detail').textContent='Click: use/equip · Right-click: drop (−1 karma, the commune dislikes waste). Coins: '+G.coins+' livres.';}
function nearFire(){for(const f of fires){if(dist2(G.pos.x,G.pos.z,f.x,f.z)<7)return true;}return false;}
function renderCraft(){const l=$('craft-list');l.innerHTML='';
 ['field','cook'].forEach(cat=>{if(cat==='cook'){const h=document.createElement('h4');h.style.color='#c9a227';h.style.margin='10px 0 4px';h.textContent='🍳 Cookery — hot dishes want a campfire close, skill opens the rest';l.appendChild(h);}
 RECIPES.filter(r=>(r.cat||'field')===cat).forEach(r=>{const w=G.work.cook||{xp:0,tier:0};
  const can=Object.entries(r.need).every(([k,n])=>n===0||hasItem(k,n))&&(!r.cost||G.coins>=r.cost)&&(!r.cookTier||w.tier>=r.cookTier);
  const d=document.createElement('div');d.className='craft-row';
  d.innerHTML='<span>'+(r.cat==='cook'?'🍳':'🔨')+' <b>'+r.n+'</b><br><small>'+r.txt+'</small></span>';
  const b=document.createElement('button');b.className='btn';b.textContent=r.cookTier&&w.tier<r.cookTier?TIER_NAMES[r.cookTier]+'+':(can?'Make':'—');b.disabled=!can;
  b.onclick=()=>{if(r.fire&&!nearFire()){toast('🔥 This wants a campfire within a few paces.','bad');return;}
   for(const [k,n] of Object.entries(r.need)){if(n>0)takeItem(k,n);}if(r.cost)G.coins-=r.cost;
   if(r.id==='plankwall'){addItem('barricade',1);G.hp=clamp(G.hp+10,0,G.maxhp);toast('🪵 Barricade bundled. Use it from your satchel to raise it. (+10 ❤)','good');}
   else for(const k in r.make)if(r.make[k]>0)addItem(k,r.make[k]);
   if(r.id==='silver')toast('🔪 Blessed silver dirk. Loups, beware.','good');
   if((r.id==='bandage'||r.id==='tonic')&&skillLvl('tailor')>=4){for(const k in r.make)addItem(k,1);toast('🪡 Clean stitches: bonus share.','good');}
   if((r.id==='bandage'||r.id==='tonic'))gainXp('tailor',2);
   if(r.id==='ammo'&&skillLvl('smith')>=3){addItem('ammo',1);toast('⚒ True-cast balls: bonus cartridge.','good');}
   if(r.cat==='cook'){initWork();const cw=G.work.cook;cw.xp+=2;const nt=tierFor(cw.xp);
    if(nt>cw.tier){cw.tier=nt;notify('🍳','Promotion: Cook — '+TIER_NAMES[nt],'The pot respects you now.',{major:true});}
    toast('🍳 '+r.n+' — the commune will eat tonight. (Cook +2 XP)','good');}
   AudioSys.sfx('craft');addKarma(1,'honest labour');renderCraft();renderInventory();refreshHUD();refreshHotbar();};
  d.appendChild(b);l.appendChild(d);});});}
function renderQuests(){const l=$('quest-list');l.innerHTML='';
 const open=QUESTS.filter(q=>G.quests[q.id].st==='open'),act=QUESTS.filter(q=>G.quests[q.id].st==='active'),done=QUESTS.filter(q=>G.quests[q.id].st==='done');
 if(!open.length&&!act.length)l.innerHTML='<i>No 重庆 ledger entries. Talk to townsfolk (E) — grief is generous with work.</i>';
 act.forEach(q=>{l.appendChild(qCard(q,'active-q','● ACTIVE — '+q.n));});
 open.forEach(q=>{const d=qCard(q,'','○ AVAILABLE — '+q.n+' (from '+npcName(q.giver)+')');const b=document.createElement('button');b.className='btn';b.textContent='Take up';b.onclick=()=>{acceptQuest(q.id);renderQuests();};d.appendChild(b);l.appendChild(d);});
 done.forEach(q=>{l.appendChild(qCard(q,'done-q','✔ DONE — '+q.n));});}
function qCard(q,cls,title){const d=document.createElement('div');d.className='q '+cls;const s=G.quests[q.id]; d.innerHTML='<h4>'+title+'</h4><p>'+q.desc+'</p><p><small>Reward: '+Object.entries(q.rw||{}).map(([k,v])=>k==='karma'?v+' karma':(ITEMS[k]?ITEMS[k].n+(v>1?' ×'+v:''):v+' '+k)).join(', ')+'</small></p>';return d;}
function npcName(id){const n=NPC_DEFS.find(n=>n.id===id)||npcs.find(n=>n.id===id);return n?n.n:id;}
function renderChar(){$('char-body').innerHTML=
 '<div class="char-row"><span>⚖ Karma</span><b>'+G.karma+' — '+karmaTitle(G.karma)+'</b></div>'+
 '<div class="char-row"><span>🪙 Haggling</span><b>'+HAGGLE_NAMES[(G.haggle&&G.haggle.tier)||0]+' ('+((G.haggle&&G.haggle.xp)||0)+' deals)</b></div>'+
 '<div class="char-row"><span>☩ Scars</span><b>'+((G.traits||[]).map(id=>TRAITS[id]?TRAITS[id].e+' '+TRAITS[id].n:id).join(', ')||'none yet')+'</b></div>'+
 '<div class="char-row"><span>❤ Health</span><b>'+Math.ceil(G.hp)+' / '+G.maxhp+'</b></div>'+
 '<div class="char-row"><span>🍖 Belly</span><b>'+Math.ceil(G.hunger)+'</b></div>'+
 '<div class="char-row"><span>🕯 Reason</span><b>'+Math.ceil(Math.max(0,G.sanity))+' — '+sanityDesc(G.sanity)+'</b></div>'+
 '<div class="char-row"><span>🩸 Bite fever</span><b>'+(G.infected>0?'INFECTED — herb/tonic!':'clean')+'</b></div>'+
 '<div class="char-row"><span>🗡 Weapon</span><b>'+ITEMS[G.weapon].n+'</b></div>'+
 '<div class="char-row"><span>☠ Kills</span><b>'+G.kills+' '+Object.entries(G.killsByFoe).map(([k,v])=>FOE_DEFS[k].e+v).join(' ')+'</b></div>'+
 '<div class="char-row"><span>⚰ Buried</span><b>'+G.buried+'</b></div>'+
 '<div class="char-row"><span>🤝 Companions</span><b>'+(G.companions.map(npcName).join(', ')||'none yet — karma 10+ recruits')+'</b></div>'+
 '<p style="font-style:italic;color:#a89a76">Saints get −20% prices, chapel sanctuary, and volunteers. Butchers pay +30%, are refused recruits, and the Bête hunts them first.</p>';}
function renderWork(){const l=$('work-list');l.innerHTML='<p style="font-size:13px;color:#a89a76">Honest labour steadies the hands and the head: every shift pays coin, restores 🕯, and climbs its trade toward Grandmaster (better pay, better peace). Find the stations by their floating signs.</p>';
 for(const k in JOBS){const J=JOBS[k],w=G.work[k]||{xp:0,tier:0};const next=w.tier<4?TIER_XP[w.tier+1]:null;
  const d=document.createElement('div');d.className='craft-row';d.setAttribute('data-tip','work:'+k);
  d.innerHTML='<span>'+J.e+' <b>'+J.n+'</b> — '+TIER_NAMES[w.tier]+' ('+w.xp+(next?' / '+next+' XP':' XP,max')+')<br><small>~'+Math.round(J.pay*(1+0.3*w.tier))+' 🪙 · +'+(J.sanity+Math.min(6,w.tier*2))+' 🕯 · '+J.site+(J.need?' · needs 1 '+ITEMS[J.need].n:'')+(J.stake?' · '+J.stake+' stake':'')+'</small></span>';
  l.appendChild(d);}
 const t=document.createElement('div');t.style.cssText='font-size:13px;color:#c9a227;margin-top:8px;';t.textContent='Shifts worked in total: '+(G.shifts||0);l.appendChild(t);}
function renderSpells(){const l=$('spell-list');l.innerHTML='<p style="font-size:13px;color:#a89a76">Spirit (🌀) trickles back slowly; rituals at altars (✝ crossroads, cemetery, bayou, chapel) restore it in floods. Carry a gris-gris for +20 max.</p>';
 SPELLS.forEach(s=>{const can=G.mana>=s.cost;const d=document.createElement('div');d.className='craft-row';d.setAttribute('data-tip','spell:'+s.id);
  d.innerHTML='<span>'+s.e+' <b>'+s.n+'</b> <small>[key '+s.key+']</small><br><small>'+s.desc+' — <b>'+s.cost+' 🌀</b> (you: '+Math.floor(G.mana)+')</small></span>';
  const b=document.createElement('button');b.className='btn';b.textContent=can?'Cast':'—';b.disabled=!can;
  b.onclick=()=>{castSpell(s.id);renderSpells();};d.appendChild(b);l.appendChild(d);});}
/* ---- maps ---- */
function drawMini(){const c=$('minimap'),x=c.getContext('2d');x.clearRect(0,0,168,168);
 x.fillStyle='#0d0b08';x.beginPath();x.arc(84,84,80,0,7);x.fill();
 const px=v=>84+v*0.62;
 x.strokeStyle='#3a2d18';x.beginPath();x.arc(84,84,58*0.62,0,7);x.stroke();
 ZONES.forEach(z=>{x.fillStyle=z.id==='swamp'?'#1d3a3a':z.id==='cemetery'?'#4a4a55':'#4a3a22';x.fillRect(px(z.x)-2,px(z.z)-2,4,4);});
 foes.forEach(f=>{x.fillStyle='#ff3333';x.fillRect(px(f.mesh.position.x)-1.5,px(f.mesh.position.z)-1.5,3,3);});
 critters.forEach(c=>{x.fillStyle=c.type==='gator'?'#ff8833':'#8a6a4a';x.fillRect(px(c.mesh.position.x)-1,px(c.mesh.position.z)-1,2,2);});
 horses.forEach(h=>{x.fillStyle='#7db8ff';x.fillRect(px(h.mesh.position.x)-1.5,px(h.mesh.position.z)-1.5,3,3);});
 carts.forEach(c=>{x.fillStyle='#c98a3a';x.fillRect(px(c.mesh.position.x)-1.5,px(c.mesh.position.z)-1.5,3,3);});
 boats.forEach(b=>{x.fillStyle='#7db8ff';x.fillRect(px(b.mesh.position.x)-1.5,px(b.mesh.position.z)-1.5,3,3);});
 for(const it of interactables){if(it.kind!=='forage')continue;if(it.cd&&performance.now()<it.cd)continue;
  x.fillStyle='#5fd06f';x.fillRect(px(it.x)-1,px(it.z)-1,2,2);}
 barricades.forEach(b=>{x.fillStyle='#c98a3a';x.fillRect(px(b.x)-1.5,px(b.z)-1.5,3,3);});
 if(G.home){x.fillStyle='#ffd76a';x.fillRect(px(G.home.x)-2.5,px(G.home.z)-2.5,5,5);}
 if(G.grave){x.fillStyle='#fff';x.fillRect(px(G.grave.x)-2,px(G.grave.z)-2,4,4);}
 npcs.forEach(n=>{if(n.dead)return;x.fillStyle='#c9a227';x.beginPath();x.arc(px(n.mesh.position.x),px(n.mesh.position.z),2.4,0,7);x.fill();});
 x.fillStyle='#fff';x.beginPath();x.arc(px(G.pos.x),px(G.pos.z),3.4,0,7);x.fill();}
function drawBig(){const c=$('bigmap'),x=c.getContext('2d');x.fillStyle='#0d0b08';x.fillRect(0,0,520,520);
 const px=v=>260+v*2;
 x.strokeStyle='#4a3a22';x.lineWidth=2;x.beginPath();x.arc(260,260,58*2,0,7);x.stroke();
 ZONES.forEach(z=>{x.fillStyle='#c9a227';x.font='13px Georgia';x.fillText(z.n,px(z.x)-40,px(z.z)-8);x.strokeStyle=z.id==='swamp'?'#2e6a6a':'#6b5626';x.beginPath();x.arc(px(z.x),px(z.z),z.r*2,0,7);x.stroke();});
 npcs.forEach(n=>{if(n.dead)return;x.fillStyle='#fff';x.fillText(n.e+' '+n.n,px(n.mesh.position.x)-30,px(n.mesh.position.z)-6);});
 foes.forEach(f=>{x.fillStyle='#ff5555';x.fillText(f.d.e,px(f.mesh.position.x)-8,px(f.mesh.position.z)-6);});
 x.fillStyle='#7dff7d';x.font='bold 16px Georgia';x.fillText('❖ YOU',px(G.pos.x)-22,px(G.pos.z)-10);}
/* ============ DIALOGUE + TRADE ============ */
let dlgOpen=null;
function openDialogue(n){dlgOpen=n;$('dialogue').classList.remove('hidden');
 if(G.sanity<60){G.sanity=Math.min(100,G.sanity+2);refreshHUD();} // a human voice steadies
 $('dlg-portrait').textContent=n.e;$('dlg-name').textContent=n.n;$('dlg-role').textContent=n.role;
 $('dlg-karma').textContent='⚖ '+G.karma+' · '+(G.dispo[n.id]||0)+' ♥';const [pg,ch]=mainPage(n);showDlgPage(pg,ch);}
function showDlgPage(text,choices){$('dlg-text').innerHTML=text;const c=$('dlg-choices');c.innerHTML='';
 choices.forEach(ch=>{const b=document.createElement('button');b.className='choice '+(ch.cls||'');b.innerHTML=ch.label;
  b.onclick=()=>{AudioSys.sfx('pickup');ch.fn&&ch.fn();};c.appendChild(b);});}
function closeDialogue(){dlgOpen=null;$('dialogue').classList.add('hidden');}
function mainPage(n){const disp=G.dispo[n.id]||0;
 const questsHere=QUESTS.filter(q=>q.giver===n.id&&['open','active'].includes(G.quests[q.id].st));
 let t='“'+n.d+'”';
 if(n.id==='taxman')t='“Ah, another arrear with legs. The Seigneur’s patience is a ledger, citizen. Thirty livres for the cabins — or I take the Irishman. Which entry shall I ink?”';
 if(n.id==='anselme')t='“Child of the mud. The dead queue at my door longer than the living. Bury them, banish them, and never — <i>never</i> — trust a sealed pew. What weighs on you?”';
 if(n.id==='manon')t='“Mm. You smell of fever and iron. Sit. The swamp provides what the Seigneur withholds — if you know where to kneel. What ails the commune today?”';
 if(n.id==='seraphine')t='“Oh, a live one, and trembling. Come in, cher — the night is for the dead, but the lamp is for us. Talk, confession, or the full forgetfulness?”';
 const ch=[];
 questsHere.forEach(q=>{const s=G.quests[q.id];
  if(s.st==='open')ch.push({label:'📜 “'+q.n+'” — hear the need',cls:'good',fn:()=>{acceptQuest(q.id);showDlgPage('“'+q.desc+'”<br><br><i>Quest taken. The ledger remembers.</i>',[{label:'“Done. I’ll go.” (leave)',fn:closeDialogue}]);}});
  else{let prog=q.obj.map(o=>{if(o.t==='collect'){const h=o.item==='coin'?G.coins:(G.inv[o.item]||0);return Math.min(h,o.n)+'/'+o.n+' '+o.label;}if(o.t==='kill')return (s.have['k_'+o.foe]||0)+'/'+o.n+' '+o.label;if(o.t==='bury')return (s.have.bury||0)+'/'+o.n;if(o.t==='forage')return (s.have.forage||0)+'/'+o.n+' '+o.label;if(o.t==='hunt')return (s.have.hunt||0)+'/'+o.n+' '+o.label;if(o.t==='work')return (s.have['w_'+o.job]||0)+'/'+o.n+' '+o.label;if(o.t==='ritual')return (s.have.ritual||0)+'/'+o.n+' '+o.label;if(o.t==='wife')return o.label;return o.label;}).join(' · ');
   ch.push({label:'📜 “'+q.n+'” — progress: '+prog,fn:()=>showDlgPage('“'+q.desc+'”<br><br><i>'+prog+'</i>',[{label:'Back',fn:()=>openDialogue(n)}])});}});
 ch.push({label:'💬 “Talk — what is this place, truly?”',fn:()=>lorePage(n)});
 if(['baptiste','manon','doctor','odette','seraphine','jeanluc','mama','nine'].includes(n.id))ch.push({label:'⚖ “Trade.”',fn:()=>openTrade(n)});
 if(n.id!=='taxman'&&!n.follow)ch.push({label:'🤝 “Walk with me. The commune defends itself.” (recruit)',cls:'good',fn:()=>recruit(n)});
 if(n.id==='anselme')ch.push({label:'🕯 “Bless me, Father — the dark gets in.” (confess, +reason)',cls:'good',fn:()=>shrive(n)});
 if(n.id==='jeanluc'){const wqs=G.quests['q_pig_wife'];
  if(wqs&&wqs.st==='active'&&wqs.have['v_bayou']){
   ch.push({label:'💔 “Babette lives free at the Landing. Let her.” (settle, kindly)',cls:'good',fn:()=>{wqs.have.wife=1;addKarma(4,'her freedom, his grief');completeQuest('q_pig_wife');showDlgPage('Jean-Luc stares into the trough a long while. “Free,” he says at last. “Aye. She always did hate fences worse than I did.” He pays, and does not meet your eye.<br><i>(+4 ⚖)</i>',[{label:'Leave him to the pigs.',fn:closeDialogue}]);}});
   ch.push({label:'💍 “She misses the pigs. Fetch her home.” (settle, practically)',fn:()=>{wqs.have.wife=1;completeQuest('q_pig_wife');showDlgPage('“The pigs!” Jean-Luc brightens. “She does love the pigs.” Whether Babette agrees is left, delicately, unexamined. He pays in full.<br><i>Settled, after a fashion.</i>',[{label:'Leave them to it.',fn:closeDialogue}]);}});}}
 if(n.id==='seraphine')ch.push({label:'💋 “Company, conversation, forgetfulness.” (4 livres, +peace)',fn:()=>comfort(n)});
 if(n.id==='mama'){ch.push({label:'🛏 “A bunk for the night.” (6 livres, supper & rest)',cls:'good',fn:()=>rentSleep(false)});
  ch.push({label:'🕯 “A bunk — and company.” (12 livres, best rest)',fn:()=>rentSleep(true)});}
 if(n.id==='celestin')ch.push({label:'🎻 “Play us something, Célestin.”',fn:()=>fiddle()});
 if(n.id==='eustache')ch.push({label:'👂 “What’s the word?” (5 livres of truth)',fn:()=>rumor()});
 if(!n.dead&&n.id!=='taxman')ch.push({label:'🤏 Lift something ('+Math.round((0.5+0.07*skillLvl('pick')+0.03*skillLvl('sneak')+(T('dextrous')?0.05:0))*100)+'% — pickpocket)',fn:()=>pickpocket(n)});
 ch.push({label:'🎭 “Surely you can bend the truth, for a friend…” (deceive)',fn:()=>deceive(n)});
 if(n.id==='taxman')ch.push({label:'💰 Pay the tithe — 30 livres (save Seamus)',cls:'good',fn:()=>payTax(n)});
 if(n.id==='taxman')ch.push({label:'🗡 “The ledger ends here, leech.” (drive him off / fight)',cls:'danger',fn:()=>fightTax(n)});
 ch.push({label:'🗡 Attack ('+n.n+')',cls:'danger',fn:()=>killNPC(n)});
 ch.push({label:'Leave — “The bell calls.”',fn:closeDialogue});
 return[t,ch];}
function lorePage(n){const L={
 anselme:'“They call this Gothic Marxism in the pamphlets? I call it arithmetic. The Seigneur owns the mill, the ferry, the coffins. He sells the cure and the disease. The Risen? They are evictions that learned to walk. Bury them — every grave is a cancelled debt.”',
 manon:'“1666 clothes? Look at us: Baptiste in a leather apron over a linen shirt, me in a headwrap and wool petticoat, you in a patched justaucorps and cavalier hat. Timber colombage, thatch, palisade — French poor building with swamp timber. The style is Southern Gothic because the damp never lets the past dry.”',
 baptiste:'“Iron doesn’t lie. A musket ball is a vote. Bring me planks and nails and I’ll bar every chapel door in the seigneurie. The Seigneur taxes iron because he fears what it builds.”',
 jean:'“The swamp is a commons the Seigneur cannot drain — he tries, with your backs. I know the high roots. Walk the water with respect and it carries you. The Bête lives where they tried to survey the un-surveyable.”',
 jeanluc:'“Pigs is honest. Pigs don’t sign, pigs don’t tithe, pigs don’t read the notices nailed to the cross. My Babette — she married down, marrying me, and up, marrying out of the Seigneur’s arithmetic. If you see her at the Landing, tell her the trough is full and the gate is open.”',
 mama:'“Beds, bowls, and blessed forgetfulness. My tafia never waters, my stew never thins, and what’s said at my bar stays under it. The Seigneur drinks elsewhere — says my prices are a sermon.”',
 nine:'“Questions cost extra. Answers cost double. Powder’s honest, shot’s honest, and this —” he taps a fang “— this is currency where we’re going.”',
 celestin:'“Reel or dirge, cher? The reel for the living, the dirge for the audience. My fiddle’s seen three wrecks; the parish’ll be the fourth, and I’ll play it down.”',
 eustache:'“I hear the mud talk. Mud says: the manor lies, the swamp remembers, and somebody in this room ain’t who they’re drinking as. Five livres and I’ll tell you which.”',
 taxman:'“You mistake me for cruel. I am merely <i>accurate</i>. Sixty souls at twelve livres the head, passage plus interest, minus Sundays. The arithmetic is Gothic; the swamp is merely the margin.”'};
 showDlgPage('“'+(L[n.id]||'“Live kindly, die loudly, and never sign anything by candlelight.”')+'”',[{label:'Back',fn:()=>openDialogue(n)}]);}
function recruit(n){if(n.follow){closeDialogue();return;}
 if(G.karma>=(T('pamphleteer')?6:8)||(G.dispo[n.id]||0)>0){n.follow=true;G.companions.push(n.id);G.dispo[n.id]=(G.dispo[n.id]||0)+1;addKarma(2,'no one walks alone');
  showDlgPage('“Then we walk together. You carry the pamphlet; I’ll carry the club.”<br><br><i>'+n.n+' joins you (fights beside you). J to track, K to see standing.</i>',[{label:'“To the barricades.”',fn:closeDialogue}]);}
 else showDlgPage('“Walk with you? The mud speaks well of you, but not <i>that</i> well. Raise your standing (karma 8+, or do my quest first).”',[{label:'Back',fn:()=>openDialogue(n)}]);}
function shrive(n){const now=performance.now();
 if(n.calmCd&&now<n.calmCd){showDlgPage('“Easy, child. Grace, like soup, must be taken one bowl at a time. Come back later.”',[{label:'Bow.',fn:()=>openDialogue(n)}]);return;}
 n.calmCd=now+150000;G.sanity=clamp(G.sanity+16,0,100);addKarma(1,'a clean breast');AudioSys.sfx('pray');refreshHUD();
 showDlgPage('You kneel on the cold mud. Out it comes — the bell, the teeth, the arithmetic. Anselme listens the way the swamp holds water: completely. “Ego te absolvo,” he says, “and mind the tithe-man on your way out.”<br><br><i>(+16 🕯, +1 ⚖)</i>',[{label:'“Amen. I feel human again.”',fn:closeDialogue}]);}
function comfort(n){const now=performance.now();
 if(n.calmCd&&now<n.calmCd){showDlgPage('“Patience, cher. Even forgetfulness must rest between customers.”',[{label:'Smile.',fn:()=>openDialogue(n)}]);return;}
 if(G.coins<4){G.sanity=clamp(G.sanity+4,0,100);refreshHUD();
  showDlgPage('You haven’t four livres to rub together. Séraphine sees it, pours you water anyway, and talks about Saumur in springtime until your hands stop shaking.<br><br><i>(+4 🕯, charity of the oldest profession)</i>',[{label:'“Merci.”',fn:closeDialogue}]);return;}
 G.coins-=4;n.calmCd=now+150000;G.sanity=clamp(G.sanity+20,0,100);AudioSys.sfx('pray');refreshHUD();
 showDlgPage('An hour of lamplight, laughter, and strictly no talk of debts or teeth. Séraphine declares you “cured of respectability, which was the disease.”<br><br><i>(−4 livres, +20 🕯)</i>',[{label:'“The parish owes you a bell.”',fn:closeDialogue}]);}
function rentSleep(company){const cost=company?12:6;
 if(G.coins<cost){toast('Bunks are '+cost+' livres. The floor is free, and cold.','bad');return;}
 if(G.time>=6&&G.time<18){subtitle('Beds rent by night. Come back at dusk.');return;}
 G.coins-=cost;
 const lt=$('letterbox-top'),lb=$('letterbox-bot');lt.style.height='12vh';lb.style.height='12vh';
 setTimeout(()=>{lt.style.height='0';lb.style.height='0';},1400);
 if(G.time>=6.2){G.day++;AudioSys.bell();toast('☀ Day '+G.day+' — the bell counts what the Seigneur cannot.','good');
  if(G.day===3)subtitle('The air tastes of iron. Tonight the bell will toll thirteen.');
  unlockQuests();}
 G.time=6.2;G.hunger=100;
 if(company){G.sanity=clamp(G.sanity+(T('restless')?40:80),0,100);G.hp=clamp(G.hp+(T('restless')?20:40),0,G.maxhp);
  if(Math.random()<0.2){G.coins=Math.max(0,G.coins-8);toast('🕯 Lamplight, laughter, forgetfulness… and lighter pockets (−8). Mostly worth it.','bad');}
  else toast('🕯 Company, supper, and a real mattress. (+80 🕯, +40 ❤)','good');
  subtitle('“Stay,” says the dark, “or go wealthy in sleep.” You choose sleep.');}
 else{if(Math.random()<0.1){G.sanity=clamp(G.sanity+20,0,100);subtitle('You dream of ledgers written in teeth. The bunk holds you anyway.');toast('Restless night. (+20 🕯 only)','bad');}
  else{G.sanity=clamp(G.sanity+(T('restless')?30:60),0,100);G.hp=clamp(G.hp+(T('restless')?17:35),0,G.maxhp);toast('🛏 Rented bunk, hot supper. (+'+(T('restless')?30:60)+' 🕯)','good');}}
 refreshHUD();checkEnding();}
const RUMORS=['The taxman keeps a second ledger. Red cover. Manor study, loose brick.','Lucile’s cousin isn’t the only moon-changed soul in the cabins.','Pelle digs an extra grave every month. “For the future,” he says.','The Bête fears chapel bells the way the Seigneur fears arithmetic.','Nine-Fingers buys fangs, no questions — and sells the answers.','Babette Porcher was seen laughing at the Landing. Laughing.','The swamp stain pulses when the bell tolls. Count it sometime.','Manon’s tonic cures more than fever, or so the drinkers claim.'];
function rumor(){if(G.coins<5){showDlgPage('“Five livres buys the hearing. Ears ain’t charity, cher.”',[{label:'Back',fn:()=>openDialogue(dlgOpen)}]);return;}
 G.coins-=5;AudioSys.sfx('gold');refreshHUD();
 showDlgPage('Eustache leans in, breath of tafia and conspiracy: “'+choice(RUMORS)+'”<br><br><i>(−5 livres, +1 useful truth)</i>',[{label:'“Worth every sou.”',fn:closeDialogue}]);}
function fiddle(){playSong(choice(Object.keys(SONGS)),4);addKarma(1,'beauty, unlicensed');
 showDlgPage('Célestin rosins up and sawbones a reel that makes the candles lean. Even the mosquitoes dance at a respectful distance.<br><br><i>The parish approves. (+1 ⚖)</i>',[{label:'Toss 2 livres in the hat',fn:()=>{if(G.coins>=2){G.coins-=2;addKarma(1,'patron of the arts');toast('🎻 The hat fills. Art survives another night.','good');}closeDialogue();refreshHUD();}},{label:'Slip out.',fn:closeDialogue}]);}
function deceive(n){if(Math.random()<0.55){const gain=randi(4,10);G.coins+=gain;addKarma(-4,'a lie, sweetly told');
  showDlgPage('You spin a tale of drowned tolls and vanished receipts. '+n.n+' blinks — and your purse grows heavier by '+gain+' livres.<br><i>(−4 karma. Lies compound like interest.)</i>',[{label:'Smile.',fn:closeDialogue}]);}
 else{G.dispo[n.id]=(G.dispo[n.id]||0)-1;addKarma(-2,'caught lying');
  showDlgPage('“...” '+n.n+' stares through your story like chapel glass. “The swamp hears everything, liar.”<br><i>Disposition down.</i>',[{label:'Back away.',fn:closeDialogue}]);}refreshHUD();}
function pickpocket(n){const now=performance.now();
 if(n.ppCd&&now<n.ppCd){showDlgPage('“...” '+n.n+' is watching their pockets — and you. Come back later.',[{label:'Back',fn:()=>openDialogue(n)}]);return;}
 n.ppCd=now+120000;
 const ch=0.5+0.07*skillLvl('pick')+0.03*skillLvl('sneak')+(T('dextrous')?0.05:0);
 if(Math.random()<ch){const take=choice(['coin','coin','bread','tobacco','wine','herb','nail']);
  if(take==='coin'){const c=randi(4,10)+skillLvl('pick')*3;G.coins+=c;toast('🪙 Lifted '+c+' livres. Silent as rent day.','good');}
  else{addItem(take,1);toast(ITEMS[take].e+' Lifted: '+ITEMS[take].n+'.','good');}
  gainXp('pick',4);gainXp('sneak',2);
  showDlgPage('Your fingers remember older hungers. '+n.n+' suspects nothing — the parish provides.',[{label:'Pocket it.',fn:closeDialogue}]);}
 else{G.dispo[n.id]=(G.dispo[n.id]||0)-2;addKarma(-3,'caught with fingers in the till');
  toast('“THIEF!” '+n.n+' catches your wrist.','bad');
  showDlgPage('“THIEF!” '+n.n+' catches your wrist before the whole row. You smile the smile of the innocent and walk very quickly away.<br><i>(−3 ⚖)</i>',[{label:'Walk quickly away.',fn:closeDialogue}]);}
 refreshHUD();refreshHotbar();}
function killNPC(n){n.dead=true;scene.remove(n.mesh);G.companions=G.companions.filter(x=>x!==n.id);
 addKarma(-25,'blood on the commons — '+n.n+' slain');AudioSys.sfx('hit');
 addItem('coin',randi(3,9));closeDialogue();
 toast('🩸 You slew '+n.n+'. The bell sounds… disappointed. (−25 ⚖)','bad');
 subtitle('“Even the mosquitoes fall silent. The commune will remember this.”');}
function payTax(n){if(G.coins<30){showDlgPage('“Thirty livres, citizen. You carry lint and intentions.”',[{label:'Back',fn:()=>openDialogue(n)}]);return;}
 G.coins-=30;G.taxPaid=true;addKarma(6,'the cabins breathe');
 const s=G.quests['q_tax'];if(s.st==='active')completeQuest('q_tax');else if(s.st==='open'){acceptQuest('q_tax');completeQuest('q_tax');}
 showDlgPage('Poulain counts, twice. “...Paid in full. The Irishman keeps his knees. How <i>inefficient</i> of you.” He leaves, ink intact, soul adjustable.<br><i>Quest settled in coin.</i>',[{label:'“The commune thanks no one.”',fn:closeDialogue}]);refreshHUD();}
function fightTax(n){n.dead=true;scene.remove(n.mesh);G.taxPaid=true;addKarma(-6,'violence against the ledger — but the cabins are free');
 const s=G.quests['q_tax'];if(s.st==='active')completeQuest('q_tax');else if(s.st==='open'){acceptQuest('q_tax');completeQuest('q_tax');}
 addItem('coin',20);closeDialogue();toast('🗡 Poulain flees without wig or ledger. The cabins cheer. (−6 ⚖, +20 livres)','good');}
/* trade */
const STOCKS={baptiste:['rapier','axe','ammo','nail','plank','tobacco','blackpowder','charcoal'],manon:['herb','tonic','bandage','stew'],doctor:['tonic','bandage','fang','tafia','wine','candle'],odette:['bread','stew','herb','plank','wine','tobacco','candle'],seraphine:['tobacco','wine','stew'],jeanluc:['pork','bread','onion','acorn'],mama:['stew','bread','wine','tafia','tobacco'],nine:['ammo','blackpowder','charcoal','venom','fang']};
let tradeNPC=null;
const HAGGLE_NAMES=['Stranger','Known Face','Haggler','Merchant','Factor of the Bayou'];
function gainHaggle(){if(!G.haggle)G.haggle={xp:0,tier:0};G.haggle.xp++;const nt=tierFor(G.haggle.xp);
 if(nt>G.haggle.tier){G.haggle.tier=nt;notify('⚖','Trading renown: '+HAGGLE_NAMES[nt],'Better prices everywhere.',{major:true,action:{label:'Soul',fn:()=>togglePanel('panel-char',renderChar)}});AudioSys.sfx('gold');}}
function priceOf(n,buying){const base=(ITEMS[n]||{price:5}).price||5;let p=base*(buying?1.3:0.6);
 if(G.karma>=35)p*=buying?0.8:1.2;else if(G.karma<=-12)p*=buying?1.3:0.8;
 const hg=(G.haggle&&G.haggle.tier)||0;p*=buying?(1-0.05*hg):(1+0.08*hg);
 if(T('disorganized'))p*=buying?1.05:0.95;
 if(T('organized'))p*=buying?1:1.1;
 return Math.max(1,Math.round(p));}
function openTrade(n){tradeNPC=n;$('trade').classList.remove('hidden');$('trade-with').textContent='— '+n.n;renderTrade();}
function renderTrade(){const n=tradeNPC;const T=$('trade-theirs'),Y=$('trade-yours');T.innerHTML='';Y.innerHTML='';
 (STOCKS[n.id]||['bread','herb']).forEach(id=>{const it=ITEMS[id];const d=document.createElement('div');d.className='trade-item';
  d.innerHTML='<span>'+it.e+' '+it.n+'</span><span>'+priceOf(id,true)+' 🪙</span>';
  d.onclick=()=>{const p=priceOf(id,true);if(G.coins<p){toast('Not enough livres.','bad');return;}G.coins-=p;addItem(id,1);gainHaggle();AudioSys.sfx('gold');renderTrade();refreshHUD();refreshHotbar();};
  T.appendChild(d);});
 Object.keys(G.inv).forEach(id=>{const it=ITEMS[id];if(!it||it.quest)return;const d=document.createElement('div');d.className='trade-item';
  d.innerHTML='<span>'+it.e+' '+it.n+' ×'+G.inv[id]+'</span><span>+'+priceOf(id,false)+' 🪙</span>';
  d.onclick=()=>{if(!takeItem(id,1))return;G.coins+=priceOf(id,false);gainHaggle();AudioSys.sfx('gold');renderTrade();refreshHUD();refreshHotbar();};
  Y.appendChild(d);});
 $('trade-info').textContent='Your purse: '+G.coins+' livres · '+(G.karma>=35?'Saint’s discount 20%':G.karma<=-12?'Butcher’s surcharge +30%':'fair parish prices');}
function showEnding(){G.ending=true;AudioSys.bell();AudioSys.setMode('chapel');
 const k=G.karma;let title,txt;
 if(k>=40){title='❦ Ending — The Commune of the Dead and the Living';txt='You stood on the drowned field with Manon’s tea in your veins and Seamus at your shoulder, and when the Bête offered you the manor’s keys, you threw them into the water. The graves opened — not to devour, but to vote. The Seigneur’s ledgers burned for three nights and warmed every cabin. The bell tolled thirteen, then fourteen: a new hour, unowned. The mud remembers — and this time, fondly.';}
 else if(k>=-10){title='❦ Ending — The Grey Parish';txt='The Bête is leveled, the swamp steams, and you walk home neither saint nor butcher. The manor stands; the cabins stand. Something was survived, nothing yet transformed. The pamphlet ends mid-sentence, awaiting a second hand.';}
 else{title='❦ Ending — The New Seigneur';txt='You slew the Bête and took its shape — or the manor’s. Debts re-inked in your own hand, the bell tolls when you permit it. The Risen salute you on their rounds. The swamp keeps its ledger, and your name is now its heaviest entry.';}
 $('ending-title').textContent=title;$('ending-text').textContent=txt;
 $('ending-stats').innerHTML='Days: '+G.day+' · Kills: '+G.kills+' · Buried: '+G.buried+' · Karma: '+k+' ('+karmaTitle(k)+') · Companions: '+(G.companions.map(npcName).join(', ')||'none');
 $('ending').classList.remove('hidden');}
/* ============ INTERACTION ============ */
function nearestInteract(){let best=null,bd=1e9;
 for(const n of npcs){if(n.dead)continue;const d=dist2(G.pos.x,G.pos.z,n.mesh.position.x,n.mesh.position.z);if(d<3.4&&d<bd){bd=d;best={kind:'npc',npc:n,txt:'Talk — '+n.n};}}
 if(!G.mounted){
  for(const h of horses){const d=dist2(G.pos.x,G.pos.z,h.mesh.position.x,h.mesh.position.z);if(d<3.2&&d<bd){bd=d;best={kind:'horse',horse:h,txt:'🐎 Mount '+h.name+' (E)'};}}
  for(const c of carts){const d=dist2(G.pos.x,G.pos.z,c.mesh.position.x,c.mesh.position.z);if(d<3.6&&d<bd){bd=d;best={kind:'cart',cart:c,txt:'🛒 Drive '+c.name+' (E) · stash (V)'};}}
  for(const b of boats){const d=dist2(G.pos.x,G.pos.z,b.mesh.position.x,b.mesh.position.z);if(d<3.2&&d<bd){bd=d;best={kind:'boat',boat:b,txt:'🛶 Board pirogue (E)'};}}
 }
 for(const it of interactables){if(it.gone)continue;if(it.cd&&performance.now()<it.cd)continue;const d=dist2(G.pos.x,G.pos.z,it.x,it.z);if(d<(it.r||3)&&d<bd){bd=d;best=it;}}
 return best;}
function doInteract(it){if(!it)return;AudioSys.sfx('pickup');
 if(it.kind==='npc'){openDialogue(it.npc);return;}
 if(it.kind==='horse'){mountHorse(it.horse);return;}
 if(it.kind==='cart'){mountCart(it.cart);return;}
 if(it.kind==='boat'){boardBoat(it.boat);return;}
 if(it.kind==='forage'){gatherForage(it);return;}
 if(it.kind==='bed'){doSleep(it);return;}
 if(it.kind==='work'){workShift(it);return;}
 if(it.kind==='barr'&&it.ref){mendBarricade(it.ref);return;}
 if(it.kind==='grave2'){recoverGrave(it);return;}
 if(it.kind==='stash'){openStash({name:it.name,stash:it.stash||(it.stash={})});return;}
 if(it.kind==='hdoor'){claimHouse(it);return;}
 if(it.kind==='altar'){doRitual(it);return;}
 if(it.kind==='keg'&&it.ref){lightKeg(it.ref);return;}
 if(it.kind==='grave'){if(G.looted[it.id]){subtitle('A tended mound. Someone scratched: “PAID IN FULL.”');return;}
  G.looted[it.id]=1;buryAt();if(Math.random()<0.4){addItem('coin',2);toast('Among the roots: 2 forgotten livres.','good');}return;}
 if(it.kind==='fire'){G.hp=clamp(G.hp+8,0,G.maxhp);G.sanity=clamp(G.sanity+14,0,100);G.hunger=Math.max(0,G.hunger-4);
  toast('🔥 You breathe by the fire. (+8 ❤, +14 🕯)','good');
  const wq=G.quests['q_ward'];
  if(wq&&wq.st==='active'&&G.planted<2&&hasItem('torch',1)){takeItem('torch',1);G.planted++;
   toast('🔥 Lantern planted ('+G.planted+'/2). The gravediggers can see.','good');if(G.planted>=2)completeQuest('q_ward');refreshTracker();}
  return;}
 if(it.kind==='bell'){AudioSys.bell();const s=G.quests['q_ghost'];
  if(s&&s.st==='active'&&(s.have['k_ghost']||0)>=3&&!G.bellRung){G.bellRung=true;completeQuest('q_ghost');subtitle('The bell tolls thirteen — and holds. The yard exhales.');}
  else{subtitle('The bell answers with iron. In the swamp, something answers back.');if(isNight()&&Math.random()<0.6){spawnFoe('risen',G.pos.x+rand(-14,14),G.pos.z+rand(-14,14));}}
  it.cd=performance.now()+5000;return;}
 if(it.kind==='brazier'){if((G.inv.ash||0)>=2){subtitle('Your pockets already leak consecrated ash.');return;}
  addItem('ash',1);toast('⚱ You pocket consecrated ash. The brazier hisses approval.','good');it.cd=performance.now()+25000;checkQuestItem();return;}
 if(it.kind==='stain'){if((G.inv.ash||0)<2){subtitle('The stain drinks lantern-light. Manon said: two pinches of chapel ash, then the words.');return;}
  takeItem('ash',2);AudioSys.sfx('pray');addKarma(8,'the swamp exhales');
  const s=G.quests['q_seal'];if(s&&s.st==='active')completeQuest('q_seal');
  subtitle('Ash hisses. The stain pales like a paid debt.');spawnFoe('ghost',18,80);return;}
 if(it.kind==='cross'){const s=G.quests['q_manor'];
  if(s&&s.st==='active'&&(G.inv.deed||0)>=2){takeItem('deed',2);completeQuest('q_manor');subtitle('You nail the debt-book to the market cross. By noon, everyone has read it. By dusk, no one admits it.');checkEnding();}
  else subtitle('Market cross, scarred with old nails and older notices. A good place for a debt-book to be read aloud.');
  it.cd=performance.now()+3000;return;}
 if(it.kind==='door'){subtitle('“'+it.name+'” — '+doorLore(it.name));it.cd=performance.now()+4000;return;}
 if(it.kind==='loot'){lootCrate(it);return;}}
function doorLore(nm){return{'Seigneur’s Manor':'candlelight, ledgers, and a locked chest behind (search it).','Chapel of St. Mud':'sanctuary. Apparitions weaken; reason returns.','Market Row':'bread has a price; gossip is free.','Smithy':'the forge is the commune’s argument.','Herbalist Hut':'knock twice; Manon hears the first.','Ruined Mission':'dusk parley ground. Bring spite and silver.','Maison Lament':'sugar money built it; debt emptied it. The green windows watch.'}[nm]||'timber, thatch, and other men’s labour.';}
function lootCrate(it){const nm=it.name;
 const once=k=>{if(G.looted[k])return false;G.looted[k]=1;return true;};
 if(nm==='Grave goods'&&once('q_rosary')){addItem('rosary',1);toast('📿 Bog-oak rosary, cold as a kept promise. Bring it to Odette.','good');checkQuestItem();it.cd=performance.now()+60000;return;}
 if(nm==='Manor chest'&&once('q_deed1')){addItem('deed',2);addItem('coin',12);toast('📜 The debt-book! 60 souls at 12 livres the head. To the market cross!','good');addKarma(4,'evidence liberated');checkQuestItem();it.cd=performance.now()+60000;return;}
 if(nm==='Study cache'&&once('q_lock0')){addItem('locket',1);toast('💠 A silver locket, miniatures inside. Odette’s mother, unmistakably.','good');checkQuestItem();it.cd=performance.now()+60000;return;}
 if(nm==='Cabin chest'&&once('q_shoe')){addItem('deed',1);toast('🧦 A child’s shoe — and a scrap: “took the shortcut by the oak”. To Lucile, quickly!','good');checkQuestItem();it.cd=performance.now()+60000;return;}
 if(nm==='Mission cache'){if(once('q_fang0')){addItem('fang',1);toast('🦷 An ivory fang in a snuffbox. The Sang-Mêlé supped here.','good');}else genericLoot();}
 else genericLoot();it.cd=performance.now()+90000;
 function genericLoot(){const r=Math.random();
  if(r<0.25){addItem('bread',1);toast('🍞 Found black bread.','good');}
  else if(r<0.4){addItem('herb',1);toast('🌿 Found herbs.','good');}
  else if(r<0.55){addItem('plank',randi(1,2));toast('🪵 Cypress planks.','good');}
  else if(r<0.65){addItem('nail',randi(1,2));toast('📌 Nails.','good');}
  else if(r<0.75){addItem('coin',randi(2,7));AudioSys.sfx('gold');toast('🪙 Livres!','good');}
  else if(r<0.83){addItem('ammo',randi(1,3));toast('🧨 Cartridges.','good');}
  else if(r<0.88){addItem('powder_herb',1);toast('🧂 Brimstone.','good');}
  else if(r<0.92){addItem('tobacco',1);toast('🚬 Pipe tobacco. The mist fears it.','good');}
  else if(r<0.94){addItem('wine',1);toast('🍷 A bottle of claret, cellared through the crossing.','good');}
  else if(r<0.97){addItem('candle',1);toast('🕯 A tallow candle. Somebody’s prayer, unlit.','good');}
  if(T('keen')&&Math.random()<0.15){addItem(choice(['bread','herb','nail']),1);toast('👁 Keen eyes: something extra in the crate.','good');}
  else{addItem('stew',1);toast('🍲 Bayou stew, still warm. Suspicious. Delicious.','good');}
  if(Math.random()<0.12){G.infected=1;toast('🤢 Something bit you in the crate-shadow. Fever rises — herb/tonic!','bad');}}
 refreshHUD();refreshHotbar();}
/* bite infection patch */
const _hurtPlayer=hurtPlayer;
hurtPlayer=function(dmg,why){_hurtPlayer(dmg,why);if(/Risen/i.test(why||'')&&Math.random()<(0.18*(T('coffin')?0.5:1)*(T('prone')?2:1))&&G.infected<=0){G.infected=1;toast('🤢 The bite festers. Bite fever! Eat wormwood/tonic.','bad');}};
/* movable + resizable windows, Zomboid-style */
const WIN_GEOM_KEY='bayou-requiem-windows';
function loadWinGeom(){try{const g=JSON.parse(localStorage.getItem(WIN_GEOM_KEY)||'{}');
 for(const id in g){const el=document.getElementById(id);if(!el)continue;const r=g[id];
  el.style.transform='none';el.style.right='auto';el.style.bottom='auto';
  if(r.left!=null){el.style.left=r.left+'px';el.style.top=r.top+'px';}
  if(r.w){el.style.width=r.w+'px';el.style.minHeight=r.h+'px';}}}catch(e){}}
function saveWinGeom(){try{const g={};document.querySelectorAll('.panel').forEach(el=>{if(!el.id)return;const r=el.getBoundingClientRect();g[el.id]={left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};});
 ['trade','dialogue'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const r=el.getBoundingClientRect();g[id]={left:Math.round(r.left),top:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)};});
 localStorage.setItem(WIN_GEOM_KEY,JSON.stringify(g));}catch(e){}}
function makeMovable(el,h){if(!el||!h)return;h.style.cursor='move';h.style.touchAction='none';
 h.addEventListener('mousedown',e=>{if(e.button!==0)return;if(/INPUT|BUTTON|TEXTAREA|SELECT|A/.test(e.target.tagName))return;
  const r=el.getBoundingClientRect();el.style.transform='none';el.style.left=r.left+'px';el.style.top=r.top+'px';el.style.right='auto';el.style.bottom='auto';
  const ox=e.clientX-r.left,oy=e.clientY-r.top;
  const mv=ev=>{el.style.left=Math.min(innerWidth-60,Math.max(-r.width+120,ev.clientX-ox))+'px';el.style.top=Math.max(0,Math.min(innerHeight-50,ev.clientY-oy))+'px';};
  const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);saveWinGeom();};
  window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);e.preventDefault();});}
function bootWindows(){document.querySelectorAll('.panel').forEach(p=>makeMovable(p,p.querySelector('h3')));
 makeMovable($('trade'),$('trade')&&$('trade').querySelector('h3'));makeMovable($('dialogue'),$('dialogue')&&document.getElementById('dlg-head'));
 loadWinGeom();document.addEventListener('mouseup',()=>{try{saveWinGeom();}catch(e){}});}
/* ============ INPUT ============ */
const keys={};let dragging=false,lastMX=0,movedPx=0;
function bindInput(){window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();
 if([' ','tab'].includes(k))e.preventDefault();keys[k]=true;
 if(!G.started||$('menu').offsetParent)return;
 if(k==='escape'||k==='p'){if(dlgOpen){closeDialogue();return;}if(!$('trade').classList.contains('hidden')){$('trade').classList.add('hidden');return;}
  const anyPanel=['panel-inventory','panel-craft','panel-quests','panel-char','panel-map','panel-work','panel-spells','panel-skills','panel-songs'].some(p=>{const el=$(p);return el&&!el.classList.contains('hidden');});
  if(anyPanel){closePanels();return;}togglePause();return;}
 if(G.paused||G.dead)return;
 if(k==='e'){if(G.mounted){dismount();return;}doInteract(nearestInteract());}
 if(k==='v'){const c=nearestCart();if(c)openStash(c);else if(G.mounted&&G.mounted.kind==='cart')openStash(G.mounted.ref);}
 if(k==='f'){if(hasItem('torch',1)){G.lantern=!G.lantern;toast(G.lantern?'🔥 Lantern high. The dark steps back.':'Lantern doused.');}else toast('No torch. Craft one (X): 2 planks.','bad');}
 if(k==='tab'||k==='i')togglePanel('panel-inventory',renderInventory);
 if(k==='x')togglePanel('panel-craft',renderCraft);
 if(k==='c'){G.sneaking=!G.sneaking;toast(G.sneaking?'🌙 Sneaking — slow and soft. (C to stand)':'You stand tall again.');AudioSys.sfx('pickup');}
 if(k==='q')shout();
 if(k==='g'){G.weapon='fists';toast('✊ Fists up. Irish diplomacy.');refreshHotbar();}
 if(k==='j')togglePanel('panel-quests',renderQuests);
 if(k==='k')togglePanel('panel-char',renderChar);
 if(k==='m')togglePanel('panel-map',drawBig);
 if(k==='b')togglePanel('panel-work',renderWork);
 if(k==='y')togglePanel('panel-skills',renderSkills);
 if(k==='n')togglePanel('panel-songs',renderSongs);
 if(k==='r')togglePanel('panel-spells',renderSpells);
 if(k==='7')castSpell('ward');if(k==='8')castSpell('lantern');if(k==='9')castSpell('haste');if(k==='0')castSpell('communion');if(k==='-')castSpell('rebuke');
 if(k===' '){shove();}
 if(k>='1'&&k<='6'){useItem(HOT[+k-1]);}});
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
 const cv=$('game-canvas');
 cv.addEventListener('mousedown',e=>{if(e.button===2){aiming=true;document.getElementById('crosshair').classList.remove('hidden');updateAim(e.clientX,e.clientY);return;}dragging=true;lastMX=e.clientX;movedPx=0;});
 window.addEventListener('mousemove',e=>{updateAim(e.clientX,e.clientY);if(!dragging)return;movedPx+=Math.abs(e.clientX-lastMX);lastMX=e.clientX;});
 window.addEventListener('mouseup',e=>{if(e.button===2){aiming=false;document.getElementById('crosshair').classList.add('hidden');return;}
  if(dragging&&movedPx<6&&G.started&&!G.paused&&!dlgOpen){const el=document.elementFromPoint(lastMX,innerHeight/2);if(el===cv)playerAttack();}dragging=false;});
 cv.addEventListener('wheel',e=>{camDist=clamp(camDist+e.deltaY*0.02,14,46);},{passive:true});
 window.addEventListener('contextmenu',e=>{if(e.target===cv)e.preventDefault();});}
function togglePause(){G.paused=!G.paused;$('pause').classList.toggle('hidden',!G.paused);AudioSys.sfx('pickup');}
/* ============ SAVE ============ */
function save(){try{const d={day:G.day,time:G.time,hp:G.hp,hunger:G.hunger,sanity:G.sanity,karma:G.karma,coins:G.coins,
 inv:G.inv,weapon:G.weapon,maxhp:G.maxhp,quests:Object.fromEntries(Object.entries(G.quests).map(([k,v])=>[k,v.st])),
 have:Object.fromEntries(Object.entries(G.quests).map(([k,v])=>[k,v.have])),qactive:G.qactive,buried:G.buried,kills:G.kills,
 looted:G.looted,work:G.work,shifts:G.shifts||0,haggle:G.haggle||{xp:0,tier:0},skills:G.skills||{},traits:G.traits||[],homeId:G.homeId||null,home:G.home||null,mana:Math.floor(G.mana),maxmana:G.maxmana,charm:!!G.charm,grave:G.grave?{x:G.grave.x,z:G.grave.z,inv:G.grave.inv,coins:G.grave.coins}:null,npc:npcs.map(n=>({id:n.id,dead:n.dead,follow:n.follow}))};
 localStorage.setItem('bayou-requiem-save',JSON.stringify(d));toast('💾 Soul recorded in the parish register.','good');}catch(e){toast('Save failed: '+e,'bad');}}
function load(){try{const raw=localStorage.getItem('bayou-requiem-save');if(!raw)return false;const d=JSON.parse(raw);
 Object.assign(G,{day:d.day,time:d.time,hp:d.hp,hunger:d.hunger,sanity:d.sanity,karma:d.karma,coins:d.coins,inv:d.inv,weapon:d.weapon,maxhp:d.maxhp,qactive:d.qactive||[],buried:d.buried||0,kills:d.kills||0,looted:d.looted||{}});
 for(const k in d.quests)if(G.quests[k])G.quests[k].st=d.quests[k];
 initWork();if(d.work)for(const k in d.work)if(G.work[k])G.work[k]=d.work[k];G.shifts=d.shifts||0;if(d.haggle)G.haggle=d.haggle;if(d.traits)G.traits=d.traits;initSkills();if(d.skills)for(const k in d.skills)if(G.skills[k])G.skills[k]=d.skills[k];G.homeId=d.homeId||null;G.home=d.home||null;if(typeof d.mana==='number')G.mana=d.mana;if(d.maxmana)G.maxmana=d.maxmana;G.charm=!!d.charm;G.wardUntil=0;G.hasteUntil=0;
 if(d.grave){G.grave={x:d.grave.x,z:d.grave.z,inv:d.grave.inv||{},coins:d.grave.coins||0};G.grave.mesh=graveMarker(G.grave);linkGrave();}
 for(const k in d.have)if(G.quests[k])G.quests[k].have=d.have[k];
 (d.npc||[]).forEach(s=>{const n=npcs.find(n=>n.id===s.id);if(n){n.dead=s.dead;n.follow=s.follow;if(n.dead)scene.remove(n.mesh);if(s.follow)G.companions.push(n.id);}});
 return true;}catch(e){return false;}}
/* ============ CODEX ============ */
function renderCodex(key){const tabs=$('codex-tabs');tabs.innerHTML='';const body=$('codex-body');
 Object.keys(CODEX).forEach(k=>{const b=document.createElement('button');b.className='tab'+(k===key?' active':'');b.textContent=CODEX[k].t;b.onclick=()=>renderCodex(k);tabs.appendChild(b);});
 body.innerHTML='<h3>'+CODEX[key].t+'</h3>'+CODEX[key].b;}
/* ============ BOOT + LOOP ============ */
function wireButtons(){
 if(localStorage.getItem('bayou-requiem-save'))$('btn-continue').style.display='';else $('btn-continue').style.display='none';
 $('btn-new').onclick=()=>{AudioSys.init();AudioSys.sfx('quest');$('menu').classList.add('hidden');$('intro').classList.remove('hidden');};
 $('btn-continue').onclick=()=>{AudioSys.init();if(load()){startGame(true);}else toast('No soul in the register.','bad');};
 $('btn-codex').onclick=()=>{$('menu').classList.add('hidden');$('codex').classList.remove('hidden');renderCodex('History');};
 $('btn-help').onclick=()=>{$('menu').classList.add('hidden');$('help').classList.remove('hidden');};
 $('btn-music').onclick=()=>{AudioSys.init();AudioSys.toggle();};
 AudioSys.vol=0.6;
 $('mus-vol').oninput=e=>{AudioSys.init();AudioSys.setVol(e.target.value/100);};
 $('mus-next').onclick=()=>{AudioSys.init();skipSong();};
 $('mus-prev').onclick=()=>{AudioSys.init();if(G.song){G.song.steps=0;G.song.left=32;toast('♪ again, from the top.','lore');}};
 $('mus-play').onclick=()=>{AudioSys.init();if(G.musicHold)startMusic();else stopMusic();};
 $('mus-auto').onchange=e=>{G.autoplay=e.target.checked;if(G.autoplay)G.songGap=Math.min(G.songGap,3);};
 document.querySelectorAll('.btn-back').forEach(b=>b.onclick=()=>{$(b.dataset.back).classList.add('hidden');$('menu').classList.remove('hidden');
  if(localStorage.getItem('bayou-requiem-save'))$('btn-continue').style.display='';});
 $('btn-start').onclick=()=>{AudioSys.init();G.traits=[];$('intro').classList.add('hidden');$('traits').classList.remove('hidden');renderTraits();};
 $('btn-traits-go').onclick=()=>{if(traitPoints()<0){toast('The manifest must balance (≥ 0).','bad');return;}
  AudioSys.init();$('traits').classList.add('hidden');
  if(T('indebted'))G.coins=0;if(T('pamphleteer'))G.karma=6;
  if(T('consumption'))G.maxhp=80;if(T('stout'))G.maxhp+=10;if(T('gaunt'))G.maxhp-=10;if(T('haunted'))G.sanity=60;
  startGame(false);};
 $('btn-resume').onclick=togglePause;$('btn-save').onclick=save;
 $('btn-full').onclick=()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();};
 $('btn-quit').onclick=()=>{save();location.reload();};
 $('btn-respawn').onclick=()=>{G.dead=false;G.hp=G.maxhp*0.6;G.hunger=60;G.sanity=60;G.infected=0;G.coins=Math.floor(G.coins*0.7);
  G.pos={x:(G.home?G.home.x:-30),z:(G.home?G.home.z:-6)};playerMesh.position.set(G.pos.x,0,G.pos.z);$('death').classList.add('hidden');
  subtitle(G.home?'You wake in your own bed. The walls kept you.':'You wake on the chapel steps. Someone left bread. Someone left a pamphlet.');addItem('bread',1);AudioSys.fade((AudioSys.vol||0.6)*0.6,3);
  if(G.grave)toast('⚰ Your satchel waits where you fell — find the ⚰ mark on the ring.','good');refreshHUD();};
 $('btn-dead-menu').onclick=()=>location.reload();
 $('btn-ending-menu').onclick=()=>{$('ending').classList.add('hidden');G.ending=false;};
 $('trade-x').onclick=()=>$('trade').classList.add('hidden');}
function startGame(continued){G.started=true;G.paused=false;
 $('hud').classList.remove('hidden');$('loading').style.display='none';
 if(!continued){unlockQuests();acceptQuest('q_bread');
  subtitle('Find Seamus in the cabin row (gold ring on the map). WASD to walk. E to talk.',7000);
  setTimeout(()=>toast('⚜ Survive the nights. The Leveling Night comes on <b>Night 3</b> — finish the debt-book quest to face it.'),2500);}
 else{unlockQuests();subtitle('The mud kept your place. Day '+G.day+', '+fmtT(G.time)+'.');}
 refreshHUD();refreshHotbar();renderQuests();refreshTracker();
 G.songGap=6;if(AudioSys.ctx)AudioSys.fade((AudioSys.vol||0.6)*0.6,3);}
let lastT=0,miniT=0;
function animate(t){requestAnimationFrame(animate);const dt=Math.min(0.05,(t-lastT)/1000||0.016);lastT=t;
 if(!G.started||G.paused){renderer&&renderer.render(scene,camera);return;}
 atkCd-=dt;shoveCd-=dt;shoutCd-=dt;
 // movement
 let mx=0,mz=0;if(!dlgOpen&&!G.dead){if(keys['w']||keys['arrowup'])mz-=1;if(keys['s']||keys['arrowdown'])mz+=1;
  if(keys['a']||keys['arrowleft'])mx-=1;if(keys['d']||keys['arrowright'])mx+=1;}
 const mount=G.mounted;
 const sprint=(keys['shift'])&&G.stam>1&&(mx||mz)&&!G.sneaking;
 let sp=sprint?6.4:3.8,rad=0.7;
 sp*=((1+0.02*skillLvl('run'))*(T('swampfoot')?1.04:1)*(T('clubfoot')?0.92:1));
 if(mount)sp=mount.kind==='cart'?(sprint?8:6):(sprint?11:8);
 if(G.hasteUntil&&performance.now()<G.hasteUntil)sp*=1.35;
 sp*=1+0.02*skillLvl('run');
 if(G.hp<G.maxhp*0.3&&T('adrenaline'))sp*=1.2;
 if(T('gaunt'))sp*=1.05;
 if(G.sneaking)sp*=0.55;if(aiming)sp*=0.6;
 if(mount&&mount.kind==='boat')sp=isWater(G.pos.x,G.pos.z)?(sprint?10:7)*(1+0.04*skillLvl('sail')):1.6;
 if(mount&&(mount.kind==='cart'||mount.kind==='boat')&&T('sunday'))sp*=0.85;
 if(mount)rad=mount.kind==='cart'?1.5:1.0;
 if(mx||mz){const l=Math.hypot(mx,mz);mx/=l;mz/=l;
  const s=Math.sin(camYaw),c=Math.cos(camYaw);const wx=mx*c-mz*s,wz=mx*s+mz*c;
  let nx=G.pos.x+wx*sp*dt,nz=G.pos.z+wz*sp*dt;
  nx=clamp(nx,-112,112);nz=clamp(nz,-112,112);
  const cc=collide(nx,nz,rad);G.pos.x=cc.x;G.pos.z=cc.z;
  if(mount){mount.ref.mesh.position.set(G.pos.x,0,G.pos.z);mount.ref.mesh.rotation.y=Math.atan2(wx,wz);
   playerMesh.position.set(G.pos.x,0,G.pos.z);playerMesh.position.y=mount.kind==='cart'?1.35:(mount.kind==='boat'?1.0:2.0);playerMesh.rotation.y=Math.atan2(wx,wz);}
  else{playerMesh.position.set(G.pos.x,0,G.pos.z);playerMesh.rotation.y=Math.atan2(wx,wz);
   playerMesh.position.y=Math.abs(Math.sin(t/130))*(sprint?0.12:0.06);}
  if(sprint){G.stam=Math.max(0,G.stam-dt*16*(T('packmule')?0.75:1)*(T('athletic')?0.8:1));runAcc+=dt;if(runAcc>4){runAcc=0;gainXp('run',1);gainXp('vigor',1);if(mount&&mount.kind==='boat')gainXp('sail',2);}}else G.stam=Math.min(100,G.stam+dt*10*(T('maroon')?1.3:1)*(1+0.1*skillLvl('vigor')));
  G.hunger=Math.max(0,G.hunger-dt*(sprint?0.5:0.2));}
 else G.stam=Math.min(100,G.stam+dt*14*(T('maroon')?1.3:1)*(1+0.1*skillLvl('vigor')));
 playerMesh.scale.y=G.sneaking?0.78:1;
 if(aiming&&!G.dead&&!dlgOpen)playerMesh.rotation.y=Math.atan2(aimX-G.pos.x,aimZ-G.pos.z);
 // (fixed camera — no rotation keys)
 camera.position.set(G.pos.x+Math.sin(camYaw)*camDist+(G.shake>0?rand(-1,1)*G.shake:0),camH+G.pos.z*0+camDist*0.62,G.pos.z+Math.cos(camYaw)*camDist);
 camera.lookAt(G.pos.x,1.5,G.pos.z);
 torchLight.position.set(G.pos.x,2.5,G.pos.z);
 // systems
 advanceTime(dt);survival(dt);sanityAura(dt);updateSky();nightSpawns(dt);
 foes.forEach(f=>foeUpdate(f,dt));npcs.forEach(n=>npcUpdate(n,dt));
 critters.forEach(c=>critterUpdate(c,dt));critterSpawns(dt);horses.forEach(h=>horseUpdate(h,dt));
 fires.forEach(f=>{f.flame.rotation.y+=dt*3;});forageUpdate();updateParticles(dt);
 for(const k of [...kegs]){if(k.fuse<0)continue;k.fuse-=dt;
  if(Math.random()<dt*8)spawnP(k.x,1,k.z,rand(-1,1),rand(1,3),rand(-1,1),0.4,0xffc46a);
  if(k.fuse<=0){kegs.splice(kegs.indexOf(k),1);scene.remove(k.mesh);if(k.inter)k.inter.gone=true;
   detonate(k.x,k.z,8,Math.round(120*(1+0.1*skillLvl('powder'))));}}
 if(G.shake>0)G.shake=Math.max(0,G.shake-dt*1.2);
 waterTex.offset.x+=dt*0.02;waterTex.offset.y+=dt*0.013;
 for(const m of mists){m.position.x+=dt*0.4;if(m.position.x>45)m.position.x=-95;m.material.opacity=(isNight()?0.17:0.07)*(G.weather==='rain'?1.5:1);}
 // interact prompt
 const ni=nearestInteract();const ip=$('interact-prompt');
 if(G.mounted&&!G.dead&&!dlgOpen){ip.classList.remove('hidden');
  $('interact-text').textContent=G.mounted.kind==='horse'?'🐎 Riding '+G.mounted.ref.name+' — E dismount':(G.mounted.kind==='boat'?'🛶 Pirogue — E beach'+(isWater(G.pos.x,G.pos.z)?'':' (dragging mud)'):'🛒 Driving '+G.mounted.ref.name+' — E park · V stash');}
 else if(ni&&!G.dead&&!dlgOpen){ip.classList.remove('hidden');$('interact-text').textContent=ni.txt||ni.name;}
 else ip.classList.add('hidden');
 if(keys['e']&&dlgOpen==null){/* camera handled above; interact on keydown event */}
 // quest visits + tracker throttle
 miniT-=dt;if(miniT<=0){miniT=1;checkQuestVisit();drawMini();refreshTracker();ck3alerts();
  $('clock-day').textContent='Day '+G.day+' · 1666';$('clock-time').textContent=(isNight()?'☾ ':'☀ ')+fmtT(G.time);}
 renderer.render(scene,camera);}
function boot(){initThree();buildWorld();initParticles();initMist();bootWindows();bootTips();buildPlayer();spawnNPCs();
 const autoMus=()=>{try{if(!AudioSys.ctx)AudioSys.init();if(AudioSys.ctx&&AudioSys.ctx.state==='suspended')AudioSys.ctx.resume();}catch(e){}};
 window.addEventListener('pointerdown',autoMus);window.addEventListener('keydown',autoMus);bindInput();wireButtons();
 spawnFoe('risen',40,10);spawnFoe('risen',-50,30);spawnFoe('ghost',-66,10);
 spawnCritter('rabbit',34,10);spawnCritter('rabbit',-44,30);spawnCritter('squirrel',50,-14);spawnCritter('deer',64,24);
 spawnCritter('turkey',40,36);spawnCritter('duck',-46,50);spawnCritter('gator',12,78);spawnCritter('gator',-38,60);
 spawnCritter('snake',-40,58);spawnCritter('snake',20,74);spawnCritter('snapper',8,84);spawnCritter('boxturtle',44,8);
 spawnCritter('hog',58,-20);spawnCritter('hog',-66,-8);spawnCritter('bobcat',70,30);spawnCritter('bear',-80,-30);
 spawnCritter('raccoon',24,32);spawnCritter('opossum',-20,20);spawnCritter('frog',4,72);spawnCritter('frog',-44,60);
 spawnCritter('heron',-40,56);spawnCritter('otter',14,80);
 spawnCritter('eagle',10,70);spawnCritter('eagle',-60,0);
 spawnSkelFarmers();spawnFoe('skeleton',-64,16);
 initWork();initSkills();
 unlockQuests();refreshHUD();refreshHotbar();
 $('loading').style.display='none';
 // expose for tests
 window.__game={G,foes,npcs,critters,horses,carts,boats,barricades,interactables,spawnFoe,spawnCritter,acceptQuest,completeQuest,addItem,useItem,startGame,mountHorse,mountCart,dismount,openStash,boardBoat};
 requestAnimationFrame(animate);}
boot();





