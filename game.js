/* BLOODFIELD MANAGER — Football Manager x Blood Bowl mechanics (2D, desktop-first)
   Vanilla JS. Static hosting friendly. Save in localStorage.
   Board: 26 x 15. Player attacks RIGHT (x=25 endzone), AI attacks LEFT (x=0). */
(function(){
'use strict';
var FW = 26, FH = 15, TURNS_PER_HALF = 8, PITCH_SIZE = 7;
var SAVE_KEY = 'bloodfield-manager-v1';

/* ---------------- DATA ---------------- */
var ROSTERS = {
  Corpo: [
    {pos:'Intern', ma:6, st:3, ag:3, av:8, cost:50, skills:[], icon:'💼'},
    {pos:'Associate', ma:6, st:3, ag:3, av:8, cost:70, skills:['Pass','Sure Hands','Hail Mary'], icon:'📊'},
    {pos:'VP', ma:7, st:2, ag:2, av:7, cost:80, skills:['Catch','Dodge'], icon:'💎'},
    {pos:'Middle Manager', ma:7, st:3, ag:3, av:8, cost:90, skills:['Block'], icon:'👔'},
    {pos:'Cyborg Enforcer', ma:5, st:5, ag:4, av:9, cost:140, skills:['Mighty Blow','Thick Skull'], icon:'🦾'}
  ],
  Venom: [
    {pos:'Juve', ma:6, st:3, ag:3, av:7, cost:40, skills:[], icon:'🏃'},
    {pos:'Chemist', ma:6, st:2, ag:3, av:7, cost:70, skills:['Pass','Sure Hands','Hail Mary'], icon:'🧪'},
    {pos:'Death-Dancer', ma:8, st:2, ag:2, av:7, cost:90, skills:['Catch','Dodge'], icon:'💃'},
    {pos:'Matriarch', ma:7, st:3, ag:2, av:8, cost:100, skills:['Block','Dodge'], icon:'👸'},
    {pos:'Phyrr Cat', ma:6, st:5, ag:4, av:8, cost:150, skills:['Mighty Blow'], icon:'🐆'}
  ],
  Forge: [
    {pos:'Vat-Juve', ma:5, st:3, ag:3, av:9, cost:50, skills:[], icon:'⛏️'},
    {pos:'Stimmer', ma:5, st:3, ag:3, av:8, cost:70, skills:['Pass'], icon:'💉'},
    {pos:'Bully', ma:6, st:3, ag:3, av:9, cost:80, skills:['Block'], icon:'🏋️'},
    {pos:'Alpha', ma:4, st:4, ag:4, av:9, cost:90, skills:[], icon:'🪖'},
    {pos:'Servitor-Ogryn', ma:4, st:5, ag:5, av:9, cost:140, skills:['Mighty Blow','Thick Skull'], icon:'🏗️'}
  ],
  Ash: [
    {pos:'Duster', ma:6, st:3, ag:3, av:8, cost:50, skills:[], icon:'🌵'},
    {pos:'Runner', ma:6, st:3, ag:3, av:8, cost:70, skills:['Pass','Sure Hands','Hail Mary'], icon:'🛞'},
    {pos:'Gunner', ma:7, st:3, ag:3, av:8, cost:90, skills:['Block'], icon:'🔫'},
    {pos:'Road Boss', ma:7, st:2, ag:2, av:7, cost:80, skills:['Catch','Dodge'], icon:'🧢'},
    {pos:'War Rig', ma:5, st:5, ag:4, av:9, cost:140, skills:['Mighty Blow','Thick Skull'], icon:'🚚'}
  ],
  Static: [
    {pos:'Neophyte', ma:6, st:3, ag:3, av:8, cost:55, skills:[], icon:'🔌'},
    {pos:'Augur', ma:6, st:3, ag:2, av:8, cost:75, skills:['Pass'], icon:'🖥️'},
    {pos:'Phantom', ma:7, st:2, ag:2, av:7, cost:85, skills:['Catch','Dodge'], icon:'🌐'},
    {pos:'Lumen', ma:6, st:3, ag:3, av:9, cost:95, skills:['Block'], icon:'💡'},
    {pos:'Aegis-Prime', ma:4, st:5, ag:4, av:9, cost:145, skills:['Mighty Blow','Thick Skull'], icon:'🌀'}
  ],
  Rust: [
    {pos:'Pilgrim', ma:5, st:3, ag:3, av:8, cost:45, skills:[], icon:'🕯️'},
    {pos:'Deacon', ma:5, st:3, ag:3, av:8, cost:65, skills:['Pass'], icon:'📿'},
    {pos:'Redeemer', ma:6, st:3, ag:3, av:8, cost:75, skills:['Block'], icon:'🔔'},
    {pos:'Confessor', ma:6, st:2, ag:3, av:7, cost:70, skills:['Catch','Dodge'], icon:'📯'},
    {pos:'Crusader', ma:4, st:4, ag:4, av:9, cost:120, skills:['Mighty Blow'], icon:'🔨'}
  ],
  Ghost: [
    {pos:'Whisper', ma:6, st:3, ag:3, av:8, cost:50, skills:[], icon:'🤫'},
    {pos:'Wiretap', ma:6, st:3, ag:2, av:8, cost:75, skills:['Pass'], icon:'🎧'},
    {pos:'Shade', ma:8, st:2, ag:3, av:7, cost:85, skills:['Catch','Dodge'], icon:'🌑'},
    {pos:'Null', ma:7, st:3, ag:3, av:8, cost:95, skills:['Block'], icon:'🕳️'},
    {pos:'Phase Horror', ma:5, st:4, ag:4, av:8, cost:130, skills:['Mighty Blow'], icon:'🦑'}
  ],
  Khorne: [
    {pos:'Blood Pup', ma:5, st:3, ag:3, av:8, cost:50, skills:[], icon:'🩸'},
    {pos:'Brass Herald', ma:5, st:3, ag:3, av:8, cost:70, skills:['Pass'], icon:'🎺'},
    {pos:'Skull Collector', ma:6, st:3, ag:3, av:9, cost:85, skills:['Block'], icon:'💀'},
    {pos:'Render', ma:7, st:2, ag:3, av:7, cost:75, skills:['Catch'], icon:'🥩'},
    {pos:'Daemon Engine', ma:4, st:5, ag:4, av:9, cost:150, skills:['Mighty Blow','Thick Skull'], icon:'🏭'}
  ],
  Nurgle: [
    {pos:'Pox Pup', ma:4, st:3, ag:4, av:9, cost:50, skills:[], icon:'🤢'},
    {pos:'Snot Slinger', ma:4, st:3, ag:4, av:8, cost:65, skills:['Pass'], icon:'🧫'},
    {pos:'Blight Guard', ma:4, st:3, ag:4, av:9, cost:80, skills:['Block'], icon:'🦠'},
    {pos:'Fly Swarm', ma:5, st:2, ag:4, av:7, cost:75, skills:['Catch','Dodge'], icon:'🪰'},
    {pos:'Great Bloater', ma:3, st:5, ag:5, av:10, cost:160, skills:['Mighty Blow','Thick Skull'], icon:'🐌'}
  ],
  Tzeentch: [
    {pos:'Fate Juve', ma:6, st:2, ag:3, av:7, cost:55, skills:[], icon:'🔮'},
    {pos:'Warp Herald', ma:6, st:2, ag:2, av:7, cost:80, skills:['Pass'], icon:'🌠'},
    {pos:'Flux Dancer', ma:8, st:2, ag:2, av:7, cost:90, skills:['Catch','Dodge'], icon:'🎲'},
    {pos:'Fateweaver', ma:7, st:3, ag:3, av:8, cost:100, skills:['Block'], icon:'🧿'},
    {pos:'Vortex Beast', ma:5, st:5, ag:4, av:9, cost:150, skills:['Mighty Blow'], icon:'🌪️'}
  ],
  Slaanesh: [
    {pos:'Devotee', ma:7, st:2, ag:3, av:7, cost:50, skills:[], icon:'💅'},
    {pos:'Sonic Herald', ma:6, st:2, ag:2, av:7, cost:75, skills:['Pass','Catch'], icon:'🎸'},
    {pos:'Bliss Dancer', ma:8, st:2, ag:2, av:7, cost:95, skills:['Catch','Dodge'], icon:'🪩'},
    {pos:'Tormentor', ma:7, st:3, ag:2, av:8, cost:100, skills:['Block','Dodge'], icon:'🥀'},
    {pos:'Fiend', ma:6, st:4, ag:3, av:8, cost:140, skills:['Mighty Blow','Block'], icon:'🐍'}
  ],
  Skaven: [
    {pos:'Clanrat', ma:7, st:2, ag:3, av:7, cost:40, skills:[], icon:'🐀'},
    {pos:'Warlock', ma:7, st:2, ag:3, av:7, cost:70, skills:['Pass'], icon:'⚡'},
    {pos:'Gutter Runner', ma:9, st:2, ag:3, av:7, cost:90, skills:['Catch','Dodge'], icon:'🌙'},
    {pos:'Stormvermin', ma:7, st:3, ag:2, av:8, cost:100, skills:['Block','Dodge'], icon:'☠️'},
    {pos:'Hell-Pit Horror', ma:6, st:5, ag:4, av:8, cost:150, skills:['Mighty Blow'], icon:'👾'}
  ],
  Kraken: [
    {pos:'Tide Juve', ma:6, st:3, ag:3, av:8, cost:45, skills:[], icon:'🌊'},
    {pos:'Netter', ma:6, st:3, ag:3, av:8, cost:65, skills:['Pass'], icon:'🕸️'},
    {pos:'Constrictor', ma:6, st:3, ag:3, av:9, cost:85, skills:['Block'], icon:'🐙'},
    {pos:'Ink Dancer', ma:7, st:2, ag:3, av:7, cost:80, skills:['Catch','Dodge'], icon:'🖋️'},
    {pos:'Leviathan', ma:4, st:5, ag:4, av:9, cost:150, skills:['Mighty Blow','Thick Skull'], icon:'🐋'}
  ],
  Guild: [
    {pos:'Offal Boy', ma:5, st:3, ag:3, av:9, cost:45, skills:[], icon:'🍖'},
    {pos:'Sawbones', ma:5, st:3, ag:3, av:8, cost:65, skills:['Pass'], icon:'🦴'},
    {pos:'Butcher', ma:6, st:3, ag:3, av:9, cost:85, skills:['Block'], icon:'🔪'},
    {pos:'Taster', ma:6, st:2, ag:3, av:7, cost:75, skills:['Catch','Dodge'], icon:'👅'},
    {pos:'Meat Wagon', ma:4, st:5, ag:4, av:9, cost:140, skills:['Mighty Blow','Thick Skull'], icon:'🛒'}
  ],
  Volt: [
    {pos:'Spark', ma:7, st:2, ag:3, av:7, cost:50, skills:[], icon:'✨'},
    {pos:'Arc Thrower', ma:6, st:3, ag:2, av:8, cost:75, skills:['Pass'], icon:'🔋'},
    {pos:'Hound', ma:8, st:2, ag:3, av:7, cost:90, skills:['Catch','Dodge'], icon:'🐕'},
    {pos:'Pack Alpha', ma:7, st:3, ag:2, av:8, cost:100, skills:['Block','Dodge'], icon:'🐺'},
    {pos:'Storm Engine', ma:5, st:5, ag:4, av:9, cost:150, skills:['Mighty Blow'], icon:'🌩️'}
  ],
  Choir: [
    {pos:'Acolyte', ma:6, st:3, ag:3, av:8, cost:45, skills:[], icon:'👁️'},
    {pos:'Cantor', ma:5, st:3, ag:3, av:8, cost:65, skills:['Pass'], icon:'🎼'},
    {pos:'Flagellant', ma:6, st:3, ag:3, av:8, cost:75, skills:['Block'], icon:'🙏'},
    {pos:'Visionary', ma:6, st:2, ag:3, av:7, cost:80, skills:['Catch','Dodge'], icon:'🌟'},
    {pos:'Living Saint', ma:5, st:4, ag:3, av:9, cost:130, skills:['Mighty Blow','Block'], icon:'😇'}
  ]
};
var FIRST = ['Nyx','Zero','Hex','Jax','Vex','Rook','Sable','Kiro','Deck','Nova','Ash','Volt','Mira','Ghost','Lamp','Cinder','Onyx','Pixel','Razor','Slate','Vandal','Wraith','Yuki','Zed'];
var LAST = ['Chrome','Wire','Static','Blackout','Neon','Ripper','Byte','Surge','Havoc','Null','Hexline','Vandal','Rust','Volt','Grim','Shade','Overdrive','Killjoy','Flatline','Ghostline'];
var AI_NAMES = [
  {name:'Helios Combine', race:'Corpo'},
  {name:'Venom Coven', race:'Venom'},
  {name:'Forge Pits', race:'Forge'},
  {name:'Ash Nomads', race:'Ash'},
  {name:'Static Choir', race:'Static'},
  {name:'Rust Pilgrims', race:'Rust'},
  {name:'Ghost Signal', race:'Ghost'},
  {name:'Skull Throne', race:'Khorne'},
  {name:'Garden of Rot', race:'Nurgle'},
  {name:'Warp Conclave', race:'Tzeentch'},
  {name:'Palace of Excess', race:'Slaanesh'},
  {name:'Horned Swarm', race:'Skaven'},
  {name:'Tide Reavers', race:'Kraken'},
  {name:'Grinder Pits', race:'Guild'},
  {name:'Storm Pack', race:'Volt'},
  {name:'Silent Hymn', race:'Choir'}
];

/* ---------------- UTIL / DICE ---------------- */
function d6(){ return 1 + Math.floor(Math.random()*6); }
function d2d6(){ return d6()+d6(); }
function agTarget(ag){ return ag; } // ag is like 2..5 meaning N+ needed
function rollAG(agNum, mod){
  mod = mod||0;
  // need (agNum + mod) or less on... classic: roll d6 >= target. mod positive = harder.
  var need = agNum + mod;
  var r = d6();
  var ok = (r === 6) ? true : (r === 1 ? false : r >= need);
  return {r:r, need:need, ok:ok};
}
function blockDiceCount(stA, stD){
  if (stA >= 2*stD) return 3;
  if (stA > stD) return 2;
  if (stA === stD) return 1;
  if (2*stA <= stD) return -3;
  return -2; // negative = defender dice
}
function rollBlockDie(){
  var r = d6();
  if (r===1) return 'SKULL';
  if (r===2) return 'BOTH_DOWN';
  if (r===3||r===4) return 'PUSH';
  if (r===5) return 'STUMBLE';
  return 'POW';
}
// attacker picks best of n dice (n>0 attacker dice, n<0 defender dice -> defender picks worst for attacker)
var BLOCK_RANK = {'SKULL':0,'BOTH_DOWN':1,'PUSH':2,'STUMBLE':3,'POW':4};
function pickBlock(dice, attackerDice){
  dice.sort(function(a,b){ return (attackerDice? BLOCK_RANK[b]-BLOCK_RANK[a] : BLOCK_RANK[a]-BLOCK_RANK[b]); });
  return dice[0];
}
function hasSkill(p, s){ return (p.skills||[]).indexOf(s)>=0; }
// Block skill softens bad results for attacker
function applyBlockSkill(result, attacker){
  if (!hasSkill(attacker,'Block')) return result;
  if (result==='SKULL') return 'BOTH_DOWN';
  if (result==='BOTH_DOWN' && !hasSkill(attacker,'Dodge')) return 'PUSH';
  return result;
}
function uid(){ return 'p'+Math.random().toString(36).slice(2,9); }
function randName(){ return FIRST[Math.floor(Math.random()*FIRST.length)]+' '+LAST[Math.floor(Math.random()*LAST.length)]; }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function $(id){ return document.getElementById(id); }

/* ---------------- SAVE / CAREER ---------------- */
var S = null; // career state
function defaultCareer(teamName, race){
  var players = [];
  var sorted=ROSTERS[race].slice().sort(function(a,b){return a.cost-b.cost;});
  var chaff=sorted[0].pos;
  var star=sorted[sorted.length-1].pos;
  for(var si=sorted.length-1;si>=0;si--){ if(sorted[si].cost<130){ star=sorted[si].pos; break; } }
  for (var i=0;i<7;i++) players.push(makePlayer(race,chaff,race));
  // 2 subs bench
  players.push(makePlayer(race,chaff,race));
  players.push(makePlayer(race,star,race));
  return {
    teamName: teamName, race: race, gold: 1000-0, fans: 3, rerolls: 2,
    week: 1, wins:0, draws:0, losses:0, tdFor:0, tdAgainst:0, casFor:0,
    players: players,
    league: makeLeague(teamName),
    mentality: 'Balanced',
    expectation: pickExpectation(),
    confidence: 60,
    inbox: [],
    netrunner: null,
    staff:{doctor:0,coach:0},
    loans:[],
    credit:550,
    log: ['Club founded. The bloodfield awaits.']
  };
}
function pickExpectation(){
  var r=Math.random();
  if(r<0.35)return 'title';
  if(r<0.75)return 'top2';
  return 'notlast';
}
function expectationText(e){
  if(e==='title')return 'Win the league';
  if(e==='top2')return 'Finish top 2';
  return 'Avoid finishing last';
}
function addInbox(tag,title,body){
  if(!S)return;
  S.inbox.unshift({week:Math.min(S.week,3), tag:tag, title:title, body:body, read:false});
  S.inbox=S.inbox.slice(0,40);
  refreshInboxBadge();
}
function makePlayer(race, pos, teamRace){
  var t = null;
  (ROSTERS[race]||ROSTERS[teamRace]).forEach(function(r){ if(r.pos===pos) t=r; });
  if(!t) t = ROSTERS[teamRace][0];
  return { id:uid(), name:randName(), race:race, pos:t.pos, icon:t.icon,
    ma:t.ma, st:t.st, ag:t.ag, av:t.av, cost:t.cost, skills:t.skills.slice(),
    spp:0, level:1, mng:0, dead:false, ko:false, bh:false };
}
function makeLeague(playerName){
  var teams = [{name:playerName, isPlayer:true, W:0,D:0,L:0,TD:0,PTS:0}];
  // 3 AI opponents drawn from the crew pool rotate through seasons
  var pool = AI_NAMES.slice();
  for (var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  pool.slice(0,3).forEach(function(a){ teams.push({name:a.name, race:a.race, isPlayer:false, W:0,D:0,L:0,TD:0,PTS:0}); });
  // fixtures: weeks 1..3 player vs AI[i], plus AI vs AI
  var fixtures = [];
  for (var w=0; w<3; w++){
    var opp = teams[w+1].name;
    fixtures.push({week:w+1, home:playerName, away:opp, hg:null, ag:null, played:false});
    var others = [teams[1],teams[2],teams[3]].filter(function(t){return t.name!==opp;});
    fixtures.push({week:w+1, home:others[0].name, away:others[1].name, hg:null, ag:null, played:false});
  }
  return {teams:teams, fixtures:fixtures};
}
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ var r=localStorage.getItem(SAVE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
function addLog(msg){ S.log.unshift('Wk'+S.week+' · '+msg); S.log=S.log.slice(0,60); }

/* ---------------- MATCH STATE ---------------- */
var M = null; // live match
function fitPlayers(){
  return S.players.filter(function(p){return !p.dead && p.mng<=0 && !p.ko;}).slice(0,12);
}
function starters(){
  var fit = S.players.filter(function(p){return !p.dead && p.mng<=0;});
  // prefer healthy non-KO, then highest cost
  fit.sort(function(a,b){return (b.cost)-(a.cost);});
  return fit.slice(0,7);
}
function aiRoster(race, power){
  var list = [];
  var R=ROSTERS[race]||ROSTERS.Corpo;
  var byCost=R.slice().sort(function(a,b){return a.cost-b.cost;});
  var low=byCost[0].pos, top=byCost[byCost.length-1].pos;
  var mid2=byCost.length>3?byCost[byCost.length-3].pos:byCost[0].pos;
  var mid1=byCost.length>1?byCost[1].pos:low;
  var comp=[mid1,mid1,mid2,low,low,low,low,top,low];
  comp.forEach(function(pos){ var p=makePlayer(race,pos,race); if(power>0){p.ma+=0;} list.push(p); });
  return list;
}
function oppForWeek(week){
  var f = S.league.fixtures.filter(function(x){return x.week===week && (x.home===S.teamName||x.away===S.teamName);})[0];
  if(!f) return AI_NAMES[0];
  var oppName = f.home===S.teamName? f.away : f.home;
  var found = AI_NAMES.filter(function(a){return a.name===oppName;})[0];
  return found || {name:oppName, race:'Corpo'};
}
function newMatch(){
  var opp = oppForWeek(S.week);
  var home = starters().map(function(p,i){ return matchPlayer(p,'home',i); });
  var aiList = aiRoster(opp.race, S.week).slice(0,7);
  var away = aiList.map(function(p,i){ return matchPlayer(p,'away',i); });
  M = {
    oppName: opp.name, oppRace: opp.race,
    half:1, turn:1, side:'home',
    homeScore:0, awayScore:0,
    players: home.concat(away),
    ball:{x:13,y:7,carrier:null},
    blitzUsed:false, passUsed:false, aiShotUsed:false,
    over:false, result:null,
    pendingReroll:null, awaitingReroll:false,
    aiTimer:null, kickReceiving: ($('optReceive')? $('optReceive').checked : true),
    stats:{blocks:0, kos:0, passes:0, dodges:0, hb:0, ab:0, hp:0, ap:0, hk:0, ak:0},
    kickoff:false
  };
  // FM24 tactics: mentality shapes your squad for this match
  if(S.mentality==='Attacking')M.players.forEach(function(q){if(q.side==='home'){q.ma+=1;q.av=Math.max(5,q.av-1);}});
  if(S.mentality==='Cautious')M.players.forEach(function(q){if(q.side==='home'){q.ma=Math.max(1,q.ma-1);q.av+=1;}});
  if(S.race==='Static'&&S.rerolls<8){S.rerolls++;log('Static Veil shield-surge: a free re-roll crackles in.');}
  if(S.race==='Skaven')M.players.forEach(function(q){if(q.side==='home'){q.ma+=1;}});
  setupFormation();
  // kickoff: ball to receiving side
  if (M.kickReceiving) giveKickoff('home'); else giveKickoff('away');
  M.weather=rollWeather();
  if(M.weather.id==='heat'||M.weather.id==='blizzard')M.players.forEach(function(q){q.ma=Math.max(1,q.ma-1);});
  log('Weather: <b>'+M.weather.name+'</b> — '+M.weather.desc+'.');
  kickoffEvent();
  startTeamTurn('home');
  renderMatch(); log('🏈 KICKOFF vs '+M.oppName+' ('+M.oppRace+'). You '+(M.kickReceiving?'receive':'kick')+'. 8 turns/half. Good luck, coach.');
}
function matchPlayer(p, side, idx){
  return { mid:uid(), ref:p, side:side, name:p.name, pos:p.pos, icon:p.icon, race:p.race,
    ma:p.ma, st:p.st, ag:p.ag, av:p.av, skills:p.skills.slice(),
    x:0, y:0, prone:false, stunned:false, out:false, moved:false, acted:false, blitzed:false, gfi:0, jammed:false };
}
function setupFormation(){
  // home (player) left half defending x=0, attacking right. Place around x=4..10
  var h = M.players.filter(function(p){return p.side==='home';});
  var a = M.players.filter(function(p){return p.side==='away';});
  var hy = [2,4,6,8,10,12,7];
  h.forEach(function(p,i){ p.x = (i<3? 10:4); p.y = hy[i%hy.length]; });
  // ensure LOS rule-ish: at least 3 on LOS x=10..12? fine
  var ay = [2,4,6,8,10,12,7];
  a.forEach(function(p,i){ p.x = (i<3? 15:21); p.y = ay[i%ay.length]; });
}
function rollWeather(){
  var wr=d6(), w;
  if(wr===1)w={id:'heat',icon:'H',name:'Sweltering Heat',desc:'-1 MA everyone'};
  else if(wr===2)w={id:'sunny',icon:'S',name:'Blinding Sun',desc:'+1 to longer passes'};
  else if(wr===5)w={id:'rain',icon:'R',name:'Pouring Rain',desc:'+1 to pickups and catches'};
  else if(wr===6)w={id:'blizzard',icon:'B',name:'Blizzard',desc:'-1 MA everyone, +2 to long bombs'};
  else w={id:'nice',icon:'*',name:'Clear Skies',desc:'perfect bloodsport weather'};
  return w;
}
function kickoffEvent(){
  var r=d6();
  if(r===1){
    var hs=M.players.filter(function(q){return q.side==='home'&&!q.out&&!q.prone&&!q.stunned;});
    var as=M.players.filter(function(q){return q.side==='away'&&!q.out&&!q.prone&&!q.stunned;});
    var a=hs.length?hs[Math.floor(Math.random()*hs.length)]:null;
    var b=as.length?as[Math.floor(Math.random()*as.length)]:null;
    if(a){a.stunned=true;log('PITCH INVASION! '+a.name+' is trampled in the crush.');}
    if(b){b.stunned=true;log('PITCH INVASION! '+b.name+' is trampled in the crush.');}
  } else if(r===6){
    if(S.rerolls<8){S.rerolls++;save();refreshHUD();log('BRILLIANT COACHING! Your staff out-prepares the rivals (+1 re-roll).');}
    else log('Brilliant coaching draws only roars.');
  } else log('Kickoff omens quiet ('+r+'). The crowd mutters.');
}
function giveKickoff(side){
  var mates = M.players.filter(function(p){return p.side===side && !p.out;});
  var c = mates[Math.floor(mates.length/2)] || mates[0];
  // scatter ball near mid of receiving half
  var bx = side==='home'? 6+d6()%5 : 19-(d6()%5);
  var by = 4+Math.floor(Math.random()*7);
  M.ball.x=bx; M.ball.y=by; M.ball.carrier=null;
  M.kickoff = true;
  resolveBallLanding();
}
function at(x,y){ return M.players.filter(function(p){return !p.out && p.x===x && p.y===y;})[0]||null; }
function foes(p){ return M.players.filter(function(q){return q.side!==p.side && !q.out && !q.prone && !q.stunned;}); }
function tzCount(x,y,side){
  var n=0;
  for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){
    if(!dx&&!dy)continue;
    var q=at(x+dx,y+dy);
    if(q&&q.side!==side&&!q.prone&&!q.stunned&&!q.out) n++;
  }
  return n;
}
function inTZ(x,y,side){ return tzCount(x,y,side)>0; }

/* ---- movement reachability (BFS up to MA, dodge cost noted) ---- */
function reachable(p){
  var seen={}, q=[{x:p.x,y:p.y,steps:0,dodges:0,path:[]}];
  seen[p.x+','+p.y]=true;
  var outs=[];
  var tzStart = inTZ(p.x,p.y,p.side);
  while(q.length){
    var c=q.shift();
    if(c.steps>0 && c.steps<=p.ma+2){
      var occ=at(c.x,c.y);
      if(!occ){ c.gfi=c.steps>p.ma; outs.push(c); }
    }
    if(c.steps>=p.ma+2) continue;
    for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue;
      var nx=c.x+dx, ny=c.y+dy;
      if(nx<0||ny<0||nx>=FW||ny>=FH)continue;
      var k=nx+','+ny;
      if(seen[k])continue;
      var occ2=at(nx,ny);
      if(occ2)continue; // can't enter occupied
      seen[k]=true;
      // leaving c square may need dodge if c in TZ (and not starting? all steps count)
      var needDodge = inTZ(c.x,c.y,p.side);
      q.push({x:nx,y:ny,steps:c.steps+1,dodges:c.dodges+(needDodge?1:0),path:c.path.concat([{x:nx,y:ny,dodge:needDodge,gfi:(c.steps+1)>p.ma}])});
    }
  }
  return outs;
}
function blockTargets(p){
  var list=[];
  for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){
    if(!dx&&!dy)continue;
    var q=at(p.x+dx,p.y+dy);
    if(q&&q.side!==p.side&&!q.prone&&!q.stunned&&!q.out) list.push(q);
  }
  return list;
}
function passTargets(p){
  return M.players.filter(function(q){return q.side===p.side&&q!==p&&!q.out&&!q.prone&&!q.stunned;});
}
function passRange(a,b){
  var d=Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  if(d<=3)return{label:'Quick',mod:-1};
  if(d<=6)return{label:'Short',mod:0};
  if(d<=10)return{label:'Long',mod:1};
  return{label:'Bomb!',mod:2};
}

/* ---- injury ---- */
function armourRoll(victim, mighty){
  var roll=d2d6()+(mighty?1:0);
  return {roll:roll, broke: roll>=victim.av, mighty:!!mighty};
}
function injuryRoll(){
  var r=d2d6();
  if(r<=7)return{t:'Stunned', out:false, ko:false};
  if(r<=9)return{t:'KO', out:true, ko:true};
  if(r===10)return{t:'Badly Hurt', out:true, ko:false, mng:1};
  if(r===11)return{t:'Serious Injury', out:true, ko:false, mng:2};
  return{t:'DEAD ☠', out:true, ko:false, dead:true};
}
function knockDown(p, cause){
  p.prone=true;
  if(M.ball.carrier===p.mid){ // fumble scatter
    M.ball.carrier=null; M.ball.x=p.x; M.ball.y=p.y; scatterBall(3);
    log('🫳 '+p.name+' drops the ball! It scatters to ('+M.ball.x+','+M.ball.y+').');
  }
}
function applyKnockdown(p, mighty, by){
  knockDown(p, by);
  var ar=armourRoll(p, mighty);
  log('🛡️ Armour on '+p.name+': 🎲'+ar.roll+' vs AV'+p.av+' '+(ar.broke?'— <b>BROKEN</b>':'— holds'));
  if(!ar.broke){ p.stunned=false; return {broke:false}; }
  var inj=injuryRoll();
  M.stats.kos++;
  if(p.side!=='home')M.stats.hbrk=(M.stats.hbrk||0)+1;
  if(p.side==='home')M.stats.ak++;else M.stats.hk++;
  if(hasSkill(p,'Thick Skull') && inj.t==='KO'){ inj={t:'Stunned',out:false,ko:false}; log('🦴 Thick Skull saves '+p.name+' (KO→Stun).'); }
  if(inj.ko&&p.side==='home'&&S.race==='Nurgle'){ inj={t:'Stunned',out:false,ko:false}; log('🦠 Nurgle rot knits '+p.name+' back together (KO→Stun).'); }
  if(inj.dead){ p.out=true; M.stats.deaths=(M.stats.deaths||0)+1; log('☠️ '+p.name+' ('+p.pos+') is <b>DEAD</b>. The crowd goes wild. Apothecary shrugs.'); }
  else if(inj.ko){ p.out=true; p.ko=true; log('😵 '+p.name+' is <b>KO’d</b>!'); }
  else if(inj.out){ p.out=true; log('🤕 '+p.name+': <b>'+inj.t+'</b> — misses '+(inj.mng||1)+' game(s).'); }
  else { p.stunned=true; log('💫 '+p.name+' is <b>Stunned</b> (misses next activation).'); }
  p._inj=inj;
  return {broke:true, inj:inj};
}
function scatterStep(){
  var dx=Math.floor(Math.random()*3)-1, dy=Math.floor(Math.random()*3)-1;
  M.ball.x=Math.max(0,Math.min(FW-1,M.ball.x+dx));
  M.ball.y=Math.max(0,Math.min(FH-1,M.ball.y+dy));
}
// The ball can never rest on a pinned/downed player: it squirts off them
// until it finds turf or a standing player (who tries the catch).
function resolveBallLanding(){
  for(var i=0;i<24;i++){
    var q=at(M.ball.x,M.ball.y);
    if(!q)return;
    if(!q.prone&&!q.stunned&&!q.out){ tryCatch(q, 0, true); return; }
    log('The ball squirts off a prone body and bounces on!');
    scatterStep();
  }
  for(var r2=1;r2<5;r2++)for(var dx=-r2;dx<=r2;dx++)for(var dy=-r2;dy<=r2;dy++){
    var nx=M.ball.x+dx, ny=M.ball.y+dy;
    if(nx<0||ny<0||nx>=FW||ny>=FH)continue;
    if(!at(nx,ny)){ M.ball.x=nx; M.ball.y=ny; return; }
  }
}
function scatterBall(n){
  for(var i=0;i<n;i++)scatterStep();
  resolveBallLanding();
}

/* ---- core actions (player-driven) ---- */
var SEL=null, MODE='move', REACH=[], BLOCKS=[], PASSL=[], SHOOT=[];
function selected(){ return M&&SEL? M.players.filter(function(p){return p.mid===SEL;})[0]||null : null; }
function canAct(p){ return p&&p.side==='home'&&!p.out&&!p.prone&&!p.stunned&&M.side==='home'&&!M.over; }

function doMoveSteps(p, path, done){
  var i=0;
  function step(){
    if(i>=path.length){ afterMove(p); done&&done(true); return; }
    var s=path[i];
    if(s.gfi){
      if(d6()===1){
        log('SPRINT! '+p.name+' overextends — down! <b>TURNOVER</b>');
        knockDown(p);
        offerReroll(p,'Sprint ('+p.name+')',function(){ p.prone=false; step(); },function(){ endTeamTurn(true); done&&done(false); });
        return;
      } else log('SPRINT! '+p.name+' goes all-out!');
    }
    if(s.dodge){
      var tz=tzCount(p.x,p.y,p.side);
      var r=rollAG(p.ag, tz>0?1:0); // +1 difficulty when dodging out
      M.stats.dodges++;
      if(!r.ok && hasSkill(p,'Dodge')){ var r2=rollAG(p.ag,1); log('🌀 Dodge skill re-roll for '+p.name+': 🎲'+r2.r+' '+(r2.ok?'succeeds!':'fails again')); if(r2.ok) r.ok=true; }
      if(!r.ok){
        log('🌀 '+p.name+' fails dodge 🎲'+r.r+' (needed '+r.need+'+) — <b>TURNOVER</b>');
        knockDown(p);
        offerReroll(p,'Dodge ('+p.name+')',function(){ p.prone=false; step(); },function(){ endTeamTurn(true); done&&done(false); });
        return;
      } else log('🌀 '+p.name+' dodges 🎲'+r.r+' ✓');
    }
    p.x=s.x; p.y=s.y; i++;
    renderMatch(); checkPickup(p, function(ok){ if(!ok){ done&&done(false); return; } step(); });
  }
  step();
}
function afterMove(p){
  p.moved=true;
  checkTouchdown(p);
  renderMatch(); refreshSide();
}
function checkPickup(p, cb){
  if(M.ball.carrier) { cb(true); return; }
  if(p.x===M.ball.x&&p.y===M.ball.y){
    var mod = tzCount(p.x,p.y,p.side)>0?1:0;
    if(M.weather&&M.weather.id==='rain')mod+=1;
    if(hasSkill(p,'Sure Hands')) mod-=1;
    var r=rollAG(p.ag,mod);
    if(r.ok){ M.ball.carrier=p.mid; log('🤲 '+p.name+' picks up the ball 🎲'+r.r+' ✓'); renderMatch(); cb(true); }
    else{
      log('🤲 '+p.name+' fumbles the pickup 🎲'+r.r+' (needed '+r.need+'+) — <b>TURNOVER</b>');
      scatterBall(1);
      offerReroll(p,'Pickup ('+p.name+')',function(){ checkPickup(p,cb); },function(){ endTeamTurn(true); cb(false); });
    }
  } else cb(true);
}
function tryCatch(p, mod, isBounce){
  if(hasSkill(p,'Catch')||hasSkill(p,'Sure Hands')) mod-=1;
  if(M.weather&&M.weather.id==='rain')mod+=1;
  var r=rollAG(p.ag,mod);
  if(r.ok){ M.ball.carrier=p.mid; log('🙌 '+p.name+' catches '+(isBounce?'the bounce':'the pass')+' 🎲'+r.r+' ✓'); M.stats.passes+= isBounce?0:1; if(!isBounce){if(p.side==='home')M.stats.hp++;else M.stats.ap++;} renderMatch(); return true; }
  log('🙌 '+p.name+' drops '+(isBounce?'the bounce':'the pass')+' 🎲'+r.r+' (needed '+r.need+'+)'+(M.side==='home'?' — <b>TURNOVER</b>':''));
  M.ball.carrier=null; M.ball.x=p.x; M.ball.y=p.y; scatterBall(1);
  return false;
}
function blockAssist(att,def){
  var a=0,d=0;
  M.players.forEach(function(q){
    if(q.out||q.prone||q.stunned)return;
    var adjD=Math.max(Math.abs(q.x-def.x),Math.abs(q.y-def.y))===1;
    var adjA=Math.max(Math.abs(q.x-att.x),Math.abs(q.y-att.y))===1;
    if(q.side===att.side&&q!==att&&adjD){
      var marked=false;
      M.players.forEach(function(e){ if(e.side!==q.side&&e!==def&&!e.out&&!e.prone&&!e.stunned&&Math.max(Math.abs(e.x-q.x),Math.abs(e.y-q.y))===1)marked=true; });
      if(!marked)a++;
    }
    if(q.side===def.side&&q!==def&&adjA){
      var marked2=false;
      M.players.forEach(function(e){ if(e.side!==q.side&&e!==att&&!e.out&&!e.prone&&!e.stunned&&Math.max(Math.abs(e.x-q.x),Math.abs(e.y-q.y))===1)marked2=true; });
      if(!marked2)d++;
    }
  });
  return {a:Math.min(2,a),d:Math.min(2,d)};
}
function doBlock(att, def){
  if(att.acted){ toast('That player already acted.'); return; }
  var khBonus=0;
  if(MODE==='blitz'&&att.side==='home'&&S.race==='Khorne')khBonus=1;
  var ab=blockAssist(att,def);
  if(ab.a||ab.d)log('Assists: +'+ab.a+' ST you, +'+ab.d+' ST them.');
  var n=blockDiceCount(att.st+khBonus+ab.a,def.st+ab.d);
  var dice=[], k=Math.abs(n);
  if(k>3)k=3; if(k<1)k=1;
  for(var i=0;i<k;i++)dice.push(rollBlockDie());
  var res=pickBlock(dice.slice(), n>0);
  var shown=res;
  res=applyBlockSkill(res,att);
  M.stats.blocks++; M.stats.hb++;
  log('💥 '+att.name+' ('+att.st+') blocks '+def.name+' ('+def.st+'): dice ['+dice.join(', ')+'] → <b>'+shown+'</b>'+(res!==shown?' (Block skill → '+res+')':''));
  att.acted=true; if(MODE==='blitz'){att.blitzed=true;M.blitzUsed=true;}
  att.moved=true;
  var mighty=hasSkill(att,'Mighty Blow');
  if(res==='POW'||res==='STUMBLE'&&!hasSkill(def,'Dodge')){
    var lbl=res==='POW'?'POW!':'Stumble!';
    log('💥 '+lbl+' '+def.name+' goes down!');
    var out=applyKnockdown(def,mighty,att);
    pushOrFill(att,def,res);
  } else if(res==='STUMBLE'&&hasSkill(def,'Dodge')){
    log('🌀 '+def.name+' uses Dodge — stays up, pushed.'); pushOrFill(att,def,'PUSH');
  } else if(res==='PUSH'){
    pushOrFill(att,def,'PUSH');
  } else if(res==='BOTH_DOWN'){
    log('🔄 Both down! '+att.name+' & '+def.name+' hit the turf.');
    applyKnockdown(att,hasSkill(def,'Mighty Blow'),def);
    applyKnockdown(def,mighty,att);
    endTeamTurnIfFell(att, true);
    renderMatch(); refreshSide(); return;
  } else if(res==='SKULL'){
    log('💀 <b>SKULL!</b> '+att.name+' falls flat — <b>TURNOVER</b>');
    applyKnockdown(att,hasSkill(def,'Mighty Blow'),def);
    endTeamTurn(true); renderMatch(); refreshSide(); return;
  }
  checkTouchdown(att);
  // skull-type turnover already handled; POW etc continue
  renderMatch(); refreshSide();
  SEL=att.mid; MODE='move'; computeHints(att);
}
function pushOrFill(att,def,res){
  // push defender 1 square away from attacker if free, else stay; attacker may follow
  var dx=Math.sign(def.x-att.x), dy=Math.sign(def.y-att.y);
  if(!dx&&!dy)dx=1;
  var nx=def.x+dx, ny=def.y+dy;
  if(nx<0||ny<0||nx>=FW||ny>=FH||at(nx,ny)){ log('➡️ '+def.name+' holds ground (no room to push).'); }
  else { def.x=nx; def.y=ny; log('➡️ '+def.name+' pushed to ('+nx+','+ny+'). '+att.name+' follows.'); att.x=def.x-dx; att.y=def.y-dy; }
  checkTouchdown(att);
}
function endTeamTurnIfFell(att, turnover){
  if(att.prone||att.stunned||att.out){ if(M.side==='home'){ var a=att; offerReroll(a,'Block ('+a.name+')',function(){ a.prone=false; a.stunned=false; a.acted=false; a.moved=true; renderMatch(); refreshSide(); toast('Nuffle spares '+a.name+'! Keep coaching.'); },function(){ endTeamTurn(true); }); } else endTeamTurn(true); }
}
function doPass(att, mate){
  var rng=passRange(att,mate);
  var mod=rng.mod-(hasSkill(att,'Pass')?1:0);
  if(M.weather&&M.weather.id==='sunny'&&rng.label!=='Quick')mod+=1;
  if(M.weather&&M.weather.id==='blizzard'&&(rng.label==='Long'||rng.label==='Bomb!'))mod+=2;
  var r=rollAG(att.ag,mod);
  M.passUsed=true; att.acted=true; att.moved=true;
  M.ball.carrier=null;
  log('🏈 '+att.name+' throws '+rng.label+' to '+mate.name+' 🎲'+r.r+' (needed '+r.need+'+) '+(r.ok?'— accurate!':'— WILD!'));
  if(!r.ok){ M.ball.x=mate.x; M.ball.y=mate.y; scatterBall(3);
    log('🏈 Pass scatters to ('+M.ball.x+','+M.ball.y+').'+(M.side==='home'?' <b>TURNOVER</b>':''));
    if(M.side==='home'){ offerReroll(att,'Pass ('+att.name+')',function(){ M.ball.carrier=att.mid; M.passUsed=false; att.acted=false; },function(){ endTeamTurn(true); }); }
    renderMatch(); refreshSide(); return;
  }
  // accurate: catch attempt
  var tz=tzCount(mate.x,mate.y,mate.side)>0?1:0;
  var ok=tryCatch(mate,tz,false);
  if(!ok&&M.side==='home'){ var p=att; offerReroll(att,'Catch ('+mate.name+')',function(){ M.ball.carrier=mate.mid; renderMatch(); },function(){ endTeamTurn(true); }); }
  renderMatch(); refreshSide();
}
function doHandoff(att, mate){
  att.acted=true; att.moved=true; M.ball.carrier=null;
  log('🤝 '+att.name+' hands off to '+mate.name+'…');
  var ok=tryCatch(mate,0,false);
  if(!ok&&M.side==='home'){ offerReroll(att,'Handoff ('+mate.name+')',function(){ M.ball.carrier=mate.mid; renderMatch(); },function(){ endTeamTurn(true); }); }
  renderMatch(); refreshSide();
}
function losClear(a,b){
  var x0=a.x,y0=a.y,x1=b.x,y1=b.y;
  var dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
  var sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, cover=false;
  var x=x0,y=y0,guard=0;
  while(!(x===x1&&y===y1)&&guard++<60){
    var e2=2*err;
    if(e2>-dy){err-=dy;x+=sx;}
    if(e2<dx){err+=dx;y+=sy;}
    if(x===x1&&y===y1)break;
    var q=at(x,y);
    if(q&&!q.out){
      if(q.prone||q.stunned)cover=true;
      else return {blocked:true,cover:false};
    }
  }
  return {blocked:false,cover:cover};
}
function shootTargets(p){
  var list=[];
  M.players.forEach(function(q){
    if(q.side===p.side||q.out)return;
    var d=Math.max(Math.abs(q.x-p.x),Math.abs(q.y-p.y));
    if(d<1||d>12)return;
    if(!losClear(p,q).blocked)list.push(q);
  });
  return list;
}
function doShoot(att,def){
  if(att.acted||att.jammed){toast(att.jammed?'That gun is jammed (out for the match).':'That player already acted.');return;}
  att.acted=true; att.moved=true;
  var d=Math.max(Math.abs(att.x-def.x),Math.abs(att.y-def.y));
  var short=d<=6;
  var need=short?4:5;
  if(def.prone||def.stunned)need-=1;
  if(losClear(att,def).cover)need+=1;
  need=Math.max(2,Math.min(6,need));
  var r=d6();
  log('🔫 '+att.name+' opens fire on '+def.name+' ('+(short?'short':'long')+' range, '+need+'+): dice '+r);
  sfx('shot');
  if(r<need){ log('🔫 Missed — sparks off a bulkhead.'); }
  else { log('🔫 HIT — '+def.name+' is pinned!'); applyKnockdown(def,false,att); }
  if(d6()===1){ att.jammed=true; log('🔫 '+att.name+' is OUT OF AMMO — gun jammed for the match.'); }
  renderMatch(); refreshSide();
}
function checkTouchdown(p){
  if(!M||M.over)return;
  if(M.ball.carrier!==p.mid)return;
  if(p.side==='home'&&p.x>=FW-1){ scoreTD('home',p); }
  if(p.side==='away'&&p.x<=0){ scoreTD('away',p); }
}
function scoreTD(side,p){
  M.ball.carrier=null; M.ball.x=p.x; M.ball.y=p.y;
  if(side==='home'){M.homeScore++;}else{M.awayScore++;}
  if(p.ref&&p.side==='home'){p.ref.spp+=3; }
  log((side==='home'?'🎉 <b>TOUCHDOWN!</b> '+p.name+' scores for you! (+3 SPP)':'💀 <b>TOUCHDOWN</b> for '+M.oppName+'. '+p.name+' strolls in.'));
  sfx(side==='home'?'td':'bad');
  renderMatch();
  if(M.homeScore+M.awayScore>=9){ endMatch(); return; }
  // reset for next drive, same half/turn continues? Simpler: reset positions, kickoff to conceding side, continue turns
  setTimeout(function(){
    if(M.over)return;
    setupFormation();
    giveKickoff(side==='home'?'away':'home');
    M.players.forEach(function(q){ if(!q.out){q.prone=false;q.stunned=false;} });
    renderMatch();
    toast(side==='home'?'TOUCHDOWN! Drive reset — keep coaching!':'Conceded. Reset — win the next drive!');
  }, 900);
}

/* ---- re-rolls ---- */
function offerReroll(p, label, retry, fail){
  if(M.side!=='home'){ fail(); return; }
  if(S.rerolls<=0){ fail(); return; }
  M.pendingReroll={label:label, retry:retry, fail:fail, player:p?p.mid:null};
  M.awaitingReroll=true;
  $('matchStatus').innerHTML='❌ '+label+' failed — <b>click 🎲 re-roll</b> ('+S.rerolls+' left) or it stands in 8s…';
  $('btnReroll').parentElement.classList.add('action-on');
  log('🎲 Re-roll available for <b>'+label+'</b> — click “🎲 re-roll”.');
  setTimeout(function(){
    if(M.awaitingReroll&&M.pendingReroll&&M.pendingReroll.label===label){
      M.awaitingReroll=false; M.pendingReroll=null; fail();
    }
  }, 8000);
  refreshSide();
}
function useReroll(){
  if(!M||!M.awaitingReroll||!M.pendingReroll){ toast('No failed roll to re-roll right now.'); return; }
  if(S.rerolls<=0){ toast('No re-rolls left! Buy more in Squad tab (50k).'); return; }
  S.rerolls--; save(); refreshHUD();
  var pr=M.pendingReroll; M.pendingReroll=null; M.awaitingReroll=false;
  log('🎲 <b>RE-ROLL</b> spent on '+pr.label+' ('+S.rerolls+' left). Nuffle, be kind…');
  sfx('dice');
  pr.retry();
  renderMatch(); refreshSide();
}

/* ---- turn flow ---- */
function startTeamTurn(side){
  M.side=side; M.blitzUsed=false; M.passUsed=false; M.aiShotUsed=false;
  M.players.forEach(function(p){ if(p.side===side){p.moved=false;p.acted=false;p.blitzed=false; if(p.stunned){p.stunned=false;p.prone=true;} } });
  if(side==='home'){ $('matchStatus').textContent='Your turn '+M.turn+'/'+TURNS_PER_HALF+' — Half '+(M.half); }
  else { $('matchStatus').textContent=M.oppName+' is thinking…'; setTimeout(aiTurn, 700); }
  SEL=null; MODE='move'; REACH=[];BLOCKS=[];PASSL=[];
  renderMatch(); refreshSide();
}
function endTeamTurn(turnover){
  if(!M||M.over)return;
  M.awaitingReroll=false; M.pendingReroll=null;
  if(turnover) log('🔁 <b>Turnover!</b> '+(M.side==='home'?'Your turn ends.':'AI turn ends.'));
  if(M.side==='home'){ startTeamTurn('away'); }
  else{
    // AI turn ended -> advance clock
    M.turn++;
    if(M.turn>TURNS_PER_HALF){
      if(M.half>=2){ endMatch(); return; }
      M.half=2; M.turn=1; S.rerolls=Math.max(S.rerolls,0);
      log('⏳ <b>Half time!</b> '+M.homeScore+'–'+M.awayScore+'. Second half kicks off.');
      setupFormation(); giveKickoff(M.kickReceiving?'away':'home');
      kickoffEvent();
      M.players.forEach(function(q){q.prone=false;q.stunned=false;});
    }
    startTeamTurn('home');
  }
}

/* ---- AI ---- */
function aiTurn(){
  if(!M||M.over||M.side!=='away')return;
  var diff=($('optDiff')||{}).value||'pro';
  var mates=M.players.filter(function(p){return p.side==='away'&&!p.out&&!p.prone&&!p.stunned;});
  var carrier=M.players.filter(function(p){return p.mid===M.ball.carrier;})[0]||null;
  // stand up prone first
  M.players.filter(function(p){return p.side==='away'&&p.prone&&!p.out;}).forEach(function(p){p.prone=false;p.moved=true;p.acted=true;});
  var steps=0;
  function aiStep(){
    if(!M||M.over||M.side!=='away')return;
    if(steps++>40){ endTeamTurn(false); return; }
    renderMatch();
    // 1) someone pick up loose ball
    if(!M.ball.carrier){
      var free=mates.filter(function(p){return !p.moved&&!p.out&&!p.prone;});
      if(!free.length){ endTeamTurn(false); return; }
      free.sort(function(a,b){return (Math.abs(a.x-M.ball.x)+Math.abs(a.y-M.ball.y))-(Math.abs(b.x-M.ball.x)+Math.abs(b.y-M.ball.y));});
      var chaser=free[0];
      var path=aiPath(chaser,M.ball.x,M.ball.y);
      aiMoveAlong(chaser,path,function(ok){
        if(!ok){ endTeamTurn(true); return; }
        setTimeout(aiStep,250);
      });
      return;
    }
    var bc=M.players.filter(function(p){return p.mid===M.ball.carrier;})[0];
    if(bc&&bc.side==='away'){
      // blitz out of the way? first block adjacent threats with others
      var guard=mates.filter(function(p){return p!==bc&&!p.acted;})[0];
      var foeAdj=guard?blockTargets(guard):[];
      if(guard&&foeAdj.length&&(diff!=='rookie'||Math.random()<0.5)){
        foeAdj.sort(function(a,b){return a.st-b.st;});
        aiBlock(guard,foeAdj[0],function(cont){ setTimeout(aiStep,250); });
        return;
      }
      // run carrier to endzone
      var path2=aiPath(bc,0,bc.y<7?2:12);
      // opportunistic pass if surrounded late
      if(diff==='brutal'&&tzCount(bc.x,bc.y,'away')>=2&&M.turn>=4){
        var open=passTargets(bc).filter(function(q){return q.x<bc.x&&tzCount(q.x,q.y,q.side)===0;})[0];
        if(open){ aiPass(bc,open); setTimeout(aiStep,300); return; }
      }
      aiMoveAlong(bc,path2,function(ok){ if(!ok){endTeamTurn(true);return;} setTimeout(aiStep,250); });
      return;
    }
    // player has ball: chase + block
    var pbc=M.players.filter(function(p){return p.mid===M.ball.carrier;})[0];
    if(!M.aiShotUsed&&diff!=='rookie'&&pbc&&pbc.side==='home'){
      var guns=mates.filter(function(q){return !q.acted&&!q.jammed;});
      var vols=[];
      guns.forEach(function(q){ var tg=shootTargets(q); if(tg.length)vols.push({sh:q,tg:tg}); });
      if(vols.length&&(diff==='brutal'||Math.random()<0.5)){
        vols.sort(function(a,b){ return (b.tg.indexOf(pbc)>=0?1:0)-(a.tg.indexOf(pbc)>=0?1:0); });
        var vT=vols[0].tg.slice().sort(function(a,b){ return (a===pbc?-1:0)-(b===pbc?-1:0); });
        M.aiShotUsed=true;
        doShoot(vols[0].sh, vT[0]);
        setTimeout(aiStep,300); return;
      }
    }
    if(pbc){
      var hunters=mates.filter(function(p){return !p.moved;});
      if(!hunters.length){ // try blocks
        var blk=mates.filter(function(p){return !p.acted;})[0];
        var tg=blk?blockTargets(blk)[0]:null;
        if(blk&&tg){ aiBlock(blk,tg,function(){setTimeout(aiStep,250);}); return; }
        endTeamTurn(false); return;
      }
      hunters.sort(function(a,b){return (Math.abs(a.x-pbc.x)+Math.abs(a.y-pbc.y))-(Math.abs(b.x-pbc.x)+Math.abs(b.y-pbc.y));});
      var h0=hunters[0];
      var adj=blockTargets(h0);
      if(adj.length&&adj.indexOf(pbc)>=0){ aiBlock(h0,pbc,function(){setTimeout(aiStep,250);}); return; }
      var pp=aiPath(h0,pbc.x+1,pbc.y);
      aiMoveAlong(h0,pp,function(ok){ if(!ok){endTeamTurn(true);return;} var t2=blockTargets(h0); if(t2.length&&(diff==='brutal'||Math.random()<0.6)){ aiBlock(h0,t2[0],function(){setTimeout(aiStep,250);}); } else setTimeout(aiStep,250); });
      return;
    }
    endTeamTurn(false);
  }
  setTimeout(aiStep,300);
}
function aiPath(p,tx,ty){
  // greedy BFS: reuse reachable, pick cell minimizing dist to target then dodges
  var cells=reachable(p);
  var desp=(M.turn>=TURNS_PER_HALF-1)||(M.ball.carrier===p.mid);
  if(!desp)cells=cells.filter(function(c){return !c.gfi;});
  if(!cells.length)return[];
  var occ=at(tx,ty);
  cells.sort(function(a,b){
    var da=Math.abs(a.x-tx)+Math.abs(a.y-ty), db=Math.abs(b.x-tx)+Math.abs(b.y-ty);
    if(da!==db)return da-db;
    return a.dodges-b.dodges;
  });
  // limit to MA steps already; take best full path? reachable stores path — find best cell then walk
  var best=cells[0];
  return best.path||[];
}
function aiMoveAlong(p,path,cb){
  if(!path.length){p.moved=true;cb(true);return;}
  var i=0;
  (function step(){
    if(i>=path.length){p.moved=true;checkTouchdown(p);cb(true);return;}
    var s=path[i];
    if(s.gfi&&d6()===1){ log('SPRINT! '+p.name+' (AI) pulls up lame — turnover!'); knockDown(p); applyKnockdownQuiet(p); endTeamTurn(true); cb(false); return; }
    if(s.dodge){ var r=rollAG(p.ag,1); if(!r.ok){ log('🌀 '+p.name+' (AI) fails dodge 🎲'+r.r+' — turnover!'); knockDown(p); applyKnockdownQuiet(p); endTeamTurn(true); cb(false); return; } }
    p.x=s.x;p.y=s.y;i++;
    if(p.x===M.ball.x&&p.y===M.ball.y&&!M.ball.carrier){
      var r2=rollAG(p.ag,tzCount(p.x,p.y,p.side)>0?1:0);
      if(r2.ok){M.ball.carrier=p.mid;log('🤲 '+p.name+' (AI) scoops the ball 🎲'+r2.r+' ✓');}
      else{M.ball.carrier=null;scatterBall(1);log('🤲 '+p.name+' (AI) fumbles the pickup — turnover!');endTeamTurn(true);cb(false);return;}
    }
    checkTouchdown(p);
    if(M.over){cb(false);return;}
    renderMatch();
    step();
  })();
}
function applyKnockdownQuiet(p){ var ar=armourRoll(p,false); if(ar.broke){var inj=injuryRoll(); if(inj.out||inj.dead)p.out=true;} }
function aiBlock(att,def,cb){
  var ab2=blockAssist(att,def);
  var n=blockDiceCount(att.st+ab2.a,def.st+ab2.d), dice=[],k=Math.min(3,Math.max(1,Math.abs(n)));
  for(var i=0;i<k;i++)dice.push(rollBlockDie());
  var res=applyBlockSkill(pickBlock(dice.slice(),n>0),att);
  M.stats.blocks++; M.stats.ab++;
  log('💥 '+att.name+' (AI) blocks '+def.name+': ['+dice.join(', ')+'] → <b>'+res+'</b>');
  att.acted=true;att.moved=true;
  if(res==='POW'||(res==='STUMBLE'&&!hasSkill(def,'Dodge'))){ applyKnockdown(def,hasSkill(att,'Mighty Blow'),att); pushOrFill(att,def,res); }
  else if(res==='PUSH'||(res==='STUMBLE')){ pushOrFill(att,def,'PUSH'); }
  else if(res==='BOTH_DOWN'){ applyKnockdown(att,false,def); applyKnockdown(def,false,att); endTeamTurn(true); cb&&cb(); return; }
  else { applyKnockdown(att,false,def); endTeamTurn(true); cb&&cb(); return; }
  checkTouchdown(att);
  renderMatch(); cb&&cb();
}
function aiPass(att,mate){
  var rng=passRange(att,mate); var r=rollAG(att.ag,rng.mod);
  att.acted=true;att.moved=true;M.ball.carrier=null;
  log('🏈 '+att.name+' (AI) throws '+rng.label+' to '+mate.name+' 🎲'+r.r+' '+(r.ok?'✓':'✗ wild!'));
  if(!r.ok){M.ball.x=mate.x;M.ball.y=mate.y;scatterBall(3);endTeamTurn(true);return;}
  tryCatch(mate,tzCount(mate.x,mate.y,mate.side)>0?1:0,false);
}

/* ---- end match ---- */
function endMatch(){
  if(M.over)return;
  M.over=true;
  var hs=M.homeScore, as=M.awayScore;
  var res = hs>as?'W':hs<as?'L':'D';
  log('📯 <b>FULL TIME: YOU '+hs+'–'+as+' '+M.oppName+'</b>');
  sfx(res==='W'?'win':res==='L'?'bad':'dice');
  // update career: find fixture
  var fx=S.league.fixtures.filter(function(f){return f.week===S.week&&(f.home===S.teamName||f.away===S.teamName);})[0];
  var playerHG = (fx&&fx.home===S.teamName)?hs:as;
  var playerAG = (fx&&fx.home===S.teamName)?as:hs;
  if(fx){ fx.hg=(fx.home===S.teamName)?hs:as; fx.ag=(fx.home===S.teamName)?as:hs; fx.played=true; }
  // simulate other fixture this week
  S.league.fixtures.filter(function(f){return f.week===S.week&&!f.played;}).forEach(function(f){
    f.hg=Math.floor(Math.random()*3); f.ag=Math.floor(Math.random()*3);
    if(Math.random()<0.25){f.hg++;} f.played=true;
  });
  recomputeTable();
  // rewards
  var won=res==='W', drawn=res==='D';
  var gate=20000+Math.floor(Math.random()*30000)+S.fans*5000;
  if(S.race==='Corpo'){ gate+=15000; log('Sponsorship +15k wired by Helios subsidiaries.'); }
  var prize=(won?50000:drawn?25000:10000)+hs*10000+M.stats.kos*5000;
  if(S.race==='Venom')prize+=M.stats.kos*5000;
  if(S.race==='Ghost')prize+=10000;
  if(S.race==='Ash')prize+=hs*10000;
  if(S.race==='Forge'&&won)prize+=10000;
  if(S.race==='Tzeentch')prize+=M.stats.hp*5000;
  if(S.race==='Slaanesh')prize+=hs*5000;
  if(S.race==='Kraken')prize+=3000*(M.stats.hbrk||0);
  if(S.race==='Guild')prize+=25000*(M.stats.deaths||0);
  var total=Math.round((gate+prize)/1000);
  S.gold+=total;
  if(won){S.wins++;S.fans++;}else if(drawn){S.draws++;}else{S.losses++; if(S.fans>1)S.fans--;}
  if(S.race==='Slaanesh'&&hs>0){S.fans+=hs;log('Slaanesh excess: '+hs+' more followers swoon.');}
  if(S.race==='Choir'&&won){S.fans+=2;log('The hymn swells: +2 followers take the vow.');}
  S.tdFor+=hs; S.tdAgainst+=as; S.casFor+=M.stats.kos;
  // SPP: MVP random starter
  var alive=S.players.filter(function(p){return !p.dead;});
  if(alive.length){ var mvp=alive[Math.floor(Math.random()*alive.length)]; mvp.spp+=4+staffLevel('coach'); if(staffLevel('coach')>0)log('Assistant coach drills the MVP (+'+staffLevel('coach')+' SPP).'); }
  // apply match injuries to career players (KO clears, BH/MNG/dead persist)
  var casualties=[];
  M.players.filter(function(p){return p.side==='home';}).forEach(function(mp){
    if(!mp.ref)return;
    if(mp._inj){
      if(mp._inj.dead){mp.ref.dead=true;casualties.push('☠ '+mp.ref.name+' ('+mp._inj.t+')');if(S.race==='Corpo'){S.gold+=50;log('Corporate insurance pays +50k. HR sends a fruit basket.');}if(S.race==='Rust'){S.fans+=2;log('Two mourners join the cause for '+mp.ref.name+'. The faith grows.');}}
      else if(mp._inj.mng){var red=0; if(staffLevel('doctor')>=2)red=1; mp.ref.mng=Math.max(1,mp._inj.mng-red);casualties.push('🤕 '+mp.ref.name+' ('+mp._inj.t+')');}
    }
    // level ups
    if(mp.ref.spp>=5&&mp.ref.level<4){
      mp.ref.level++; mp.ref.spp-=5;
      var bonus=['+1 MA','+1 ST','Block','Dodge','+1 AV'][Math.floor(Math.random()*5)];
      if(bonus==='+1 MA'&&mp.ref.ma<9)mp.ref.ma++;
      else if(bonus==='+1 ST'&&mp.ref.st<6)mp.ref.st++;
      else if(bonus==='+1 AV'&&mp.ref.av<10)mp.ref.av++;
      else if(mp.ref.skills.indexOf(bonus)<0&&bonus[0]!=='+')mp.ref.skills.push(bonus);
      mp.ref.cost+=20;
      log('⭐ '+mp.ref.name+' LEVELS UP! ('+bonus+')');
    }
  });
  // MNG countdown
  S.players.forEach(function(p){ if(p.mng>0&&!p.dead){/* decrement at season tick below */} });
  addLog((won?'Beat ':'vs ')+M.oppName+' '+hs+'–'+as+'. +'+total+'k gold.');
  // FM24: board confidence + inbox verdict
  if(won){S.confidence=Math.min(100,S.confidence+12);S.credit=Math.min(850,S.credit+8);}
  else if(drawn){S.confidence=Math.min(100,S.confidence+4);S.credit=Math.min(850,S.credit+3);}
  else {S.confidence=Math.max(0,S.confidence-10);S.credit=Math.max(300,S.credit-5);}
  addInbox('Match',(won?'Won ':drawn?'Drew ':'Lost ')+hs+'–'+as+' vs '+M.oppName,
    'Full time: <b>'+hs+'–'+as+'</b>. Gate + prizes <b>+'+total+'k</b>. Board confidence '+S.confidence+'%.'+(casualties.length?'<br>Casualties: '+casualties.join(', '):'<br>No lasting injuries.'));
  // decrement MNG at week advance
  S.week++;
  S.players.forEach(function(p){ if(p.mng>0)p.mng--; });
  payroll();
  M.sacked=false;
  if(S.week>3){
    // season over: champion
    var t=S.league.teams.slice().sort(function(a,b){return b.PTS-a.PTS||b.TD-a.TD;});
    var champ=t[0];
    var pos=t.findIndex(function(x){return x.name===S.teamName;})+1;
    var met=(S.expectation==='title'&&pos===1)||(S.expectation==='top2'&&pos<=2)||(S.expectation==='notlast'&&pos<t.length);
    if(met){ S.confidence=Math.min(100,S.confidence+20); S.gold+=100; addInbox('Board','Season verdict: DELIGHTED','Finished '+pos+' of '+t.length+' — expectation ('+expectationText(S.expectation)+') met. A 100k bonus is wired. Confidence '+S.confidence+'%.'); }
    else { S.confidence=Math.max(0,S.confidence-30); addInbox('Board','Season verdict: FURIOUS','Finished '+pos+' of '+t.length+' — expectation ('+expectationText(S.expectation)+') missed. Confidence '+S.confidence+'%.'); }
    M.result={hs:hs,as:as,res:res,champion:champ.name, playerChamp:champ.name===S.teamName, total:total};
  } else M.result={hs:hs,as:as,res:res,total:total};
  if(S.confidence<=0){
    M.sacked=true;
    addInbox('Board','YOU ARE SACKED','Confidence hit 0%. Security escorts you from the stadium. The dugout awaits its next victim…');
  }
  save(); refreshAll();
  showPostMatch();
}
function recomputeTable(){
  S.league.teams.forEach(function(t){t.W=0;t.D=0;t.L=0;t.TD=0;t.PTS=0;});
  S.league.fixtures.filter(function(f){return f.played;}).forEach(function(f){
    var h=S.league.teams.filter(function(t){return t.name===f.home;})[0];
    var a=S.league.teams.filter(function(t){return t.name===f.away;})[0];
    if(!h||!a)return;
    h.TD+=f.hg;a.TD+=f.ag;
    if(f.hg>f.ag){h.W++;a.L++;h.PTS+=3;}
    else if(f.hg<f.ag){a.W++;h.L++;a.PTS+=3;}
    else{h.D++;a.D++;h.PTS++;a.PTS++;}
  });
}

/* ---------------- RENDER: MANAGER ---------------- */
function refreshHUD(){
  $('hudTeamName').textContent=S?S.teamName:'—';
  $('hudRace').textContent=S?S.race+' · TV '+(S.players.filter(function(p){return !p.dead;}).reduce(function(s,p){return s+p.cost;},0))+'k':'—';
  $('hudRecord').textContent=S?(S.wins+'-'+S.draws+'-'+S.losses):'0-0-0';
  $('hudWeek').textContent=S?Math.min(S.week,3):'1';
  $('hudGold').textContent=S?S.gold:0;
  $('hudFans').textContent=S?S.fans:0;
  $('hudRerolls').textContent=S?S.rerolls:0;
}
function refreshRoster(){
  var el=$('rosterList'); el.innerHTML='';
  var st=starters().map(function(p){return p.id;});
  $('rosterCount').textContent='(' + S.players.filter(function(p){return !p.dead;}).length + '/12 · 7 start)';
  S.players.forEach(function(p){
    var d=document.createElement('div'); d.className='player-row';
    var status=p.dead?'<span class="badge dead">DEAD</span>':p.mng>0?'<span class="badge mng">MNG '+p.mng+'</span>':'<span class="badge">Fit</span>';
    var start=(!p.dead&&p.mng<=0&&st.indexOf(p.id)>=0)?'<span class="badge starter">STARTER</span>':'';
    d.innerHTML='<div class="pos">'+p.icon+'</div><div><div class="pname">'+p.name+' <small class="muted">'+p.race+' '+p.pos+'</small> <span class="stars" title="Assistant rating">'+starStr(p)+'</span></div>'+
      '<div class="pstats">MA'+p.ma+' ST'+p.st+' AG'+p.ag+'+ AV'+p.av+'+ · SPP'+p.spp+' Lv'+p.level+' · '+(p.skills.join(', ')||'—')+' · '+p.cost+'k · '+wageOf(p)+'k/wk</div>'+
      '<div style="margin-top:4px">'+status+start+'</div></div>';
    var btns=document.createElement('div');
    if(!p.dead&&S.players.filter(function(q){return !q.dead;}).length>1){
      var fire=document.createElement('button'); fire.className='mini-btn'; fire.textContent='🔥 Fire';
      fire.onclick=function(){ S.players=S.players.filter(function(q){return q.id!==p.id;}); addLog('Fired '+p.name+'.'); save(); refreshAll(); };
      btns.appendChild(fire);
    }
    if(!p.dead&&p.spp>=3){
      var tr=document.createElement('button'); tr.className='mini-btn'; tr.textContent='⭐ Train (3 SPP, '+Math.max(10,30-10*staffLevel('coach'))+'k)'; tr.style.marginLeft='6px';
      tr.disabled=S.gold<Math.max(10,30-10*staffLevel('coach'));
      tr.onclick=function(){ var fee=Math.max(10,30-10*staffLevel('coach')); if(S.gold<fee)return; S.gold-=fee; p.spp-=3;
        var b=['Block','Dodge','+1 MA','Catch'][Math.floor(Math.random()*4)];
        if(b==='+1 MA'&&p.ma<9)p.ma++; else if(p.skills.indexOf(b)<0)p.skills.push(b); else p.st=Math.min(6,p.st+0);
        p.cost+=20; addLog(p.name+' trained: '+b+'.'); save(); refreshAll(); };
      btns.appendChild(tr);
    }
    d.appendChild(btns);
    el.appendChild(d);
  });
  // market
  var race=$('marketRace').value||S.race;
  var mk=$('marketList'); mk.innerHTML='';
  ROSTERS[race].forEach(function(t){
    var row=document.createElement('div'); row.className='market-item';
    row.innerHTML='<div class="pos">'+t.icon+'</div><div><div class="pname">'+t.pos+' <small class="muted">'+race+'</small></div><div class="pstats">MA'+t.ma+' ST'+t.st+' AG'+t.ag+'+ AV'+t.av+'+ · '+(t.skills.join(', ')||'—')+'</div></div>';
    var b=document.createElement('button'); b.className='mini-btn'; b.textContent='Sign '+t.cost+'k';
    b.disabled=S.gold<t.cost||S.players.filter(function(p){return !p.dead;}).length>=12;
    b.onclick=function(){ var np=makePlayer(race,t.pos,race); S.players.push(np); S.gold-=t.cost; addLog('Signed '+np.name+' ('+race+' '+t.pos+').'); addInbox('Transfer','Signed '+np.name,race+' '+t.pos+' joins for <b>'+t.cost+'k</b>. '+starStr(np)+' — the fans approve.'); save(); refreshAll(); sfx('gold'); };
    var w=document.createElement('div'); w.appendChild(b); row.appendChild(w); mk.appendChild(row);
  });
  // next fixture
  var fx=S.league.fixtures.filter(function(f){return f.week===S.week&&(f.home===S.teamName||f.away===S.teamName);})[0];
  $('nextFixture').innerHTML = fx? ('Week '+fx.week+': <b>'+fx.home+'</b> vs <b>'+fx.away+'</b>') : (S.week>3? 'Season complete — check the table! Start a new season when ready.' : '—');
}
function refreshLeague(){
  var tb=$('leagueTable').querySelector('tbody'); tb.innerHTML='';
  var teams=S.league.teams.slice().sort(function(a,b){return b.PTS-a.PTS||b.TD-a.TD;});
  teams.forEach(function(t,i){
    var tr=document.createElement('tr');
    if(t.isPlayer)tr.style.background='rgba(61,162,255,.12)';
    tr.innerHTML='<td>'+(i+1)+'</td><td>'+t.name+(t.isPlayer?' (YOU)':'')+'</td><td>'+(t.W+t.D+t.L)+'</td><td>'+t.W+'</td><td>'+t.D+'</td><td>'+t.L+'</td><td>'+t.TD+'</td><td><b>'+t.PTS+'</b></td>';
    tb.appendChild(tr);
  });
  var fl=$('fixtureList'); fl.innerHTML='';
  S.league.fixtures.forEach(function(f){
    var d=document.createElement('div'); d.className='fix';
    d.innerHTML='<span>W'+f.week+' · '+f.home+' vs '+f.away+'</span><b>'+(f.played?f.hg+'–'+f.ag:'-')+'</b>';
    fl.appendChild(d);
  });
  $('seasonReport').innerHTML=S.log.map(function(l){return '<div>'+l+'</div>';}).join('');
  var tv=S.players.filter(function(p){return !p.dead;}).reduce(function(s,p){return s+p.cost;},0);
  $('teamStats').innerHTML='<div class="stat"><b>'+tv+'k</b><small>Team value</small></div><div class="stat"><b>'+S.tdFor+':'+S.tdAgainst+'</b><small>TD for:against</small></div><div class="stat"><b>'+S.casFor+'</b><small>Casualties caused</small></div><div class="stat"><b>'+S.players.filter(function(p){return !p.dead&&p.mng<=0;}).length+'</b><small>Fit players</small></div>';
}
function refreshSetup(){
  var fx=S.league.fixtures.filter(function(f){return f.week===S.week&&(f.home===S.teamName||f.away===S.teamName);})[0];
  if(S.week>3){ $('preMatchInfo').innerHTML='🏁 Season complete! Start a new season from the Squad tab or top bar.'; $('btnKickoff').disabled=true; }
  else{ $('preMatchInfo').innerHTML=fx?('Week '+fx.week+': <b>'+fx.home+'</b> vs <b>'+fx.away+'</b> — first to the endzone wins.'):'—'; $('btnKickoff').disabled=false; }
  var sl=$('setupList'); sl.innerHTML='';
  starters().forEach(function(p){
    var d=document.createElement('div'); d.className='fix'; d.innerHTML='<span>'+p.icon+' '+p.name+' <small class="muted">'+p.pos+' MA'+p.ma+' ST'+p.st+'</small></span><b>✓</b>';
    sl.appendChild(d);
  });
  if(starters().length<7){ var w=document.createElement('div'); w.className='fix'; w.innerHTML='<span style="color:var(--red)">⚠ Only '+starters().length+' fit — sign players!</span>'; sl.appendChild(w); }
}

/* ---------------- ECONOMY: wages, staff, loans, credit ---------------- */
var DOCTOR_UP=[150,250], COACH_UP=[120,200];
function staffLevel(k){ if(!S||!S.staff)return 0; return S.staff[k]||0; }
function wageOf(p){ return Math.max(2, Math.round(p.cost/15)); }
function healCost(){ return Math.max(0,20-5*staffLevel('doctor')); }
function staffWage(role){
  var lv=staffLevel(role); if(lv<=0)return 0;
  if(role==='doctor')return [0,10,20,35][lv]||0;
  if(role==='coach')return [0,8,15,25][lv]||0;
  return 0;
}
function wageBill(){
  var w=0;
  S.players.forEach(function(p){ if(!p.dead)w+=wageOf(p); });
  return w+staffWage('doctor')+staffWage('coach');
}
function creditGrade(){
  if(S.credit>=750)return 'AA';
  if(S.credit>=650)return 'A';
  if(S.credit>=550)return 'B';
  if(S.credit>=450)return 'C';
  return 'D';
}
function maxLoan(){ return Math.max(0,(S.credit-300)); }
function takeLoan(amount){
  if(amount>maxLoan()){toast('The lenders laugh at your credit ('+S.credit+').');return;}
  var rate=0.10+(850-S.credit)*0.0005;
  var total=Math.round(amount*(1+rate));
  var weekly=Math.ceil(total/3);
  S.loans.push({principal:amount,total:total,weekly:weekly,weeksLeft:3,paid:0});
  S.gold+=amount;
  addLog('Borrowed '+amount+'k (repay '+total+'k over 3 weeks).');
  addInbox('Bank','Loan approved: '+amount+'k','Shark terms: <b>'+total+'k</b> back in 3 weekly bites of <b>'+weekly+'k</b>. Miss nothing.');
  save(); refreshAll(); sfx('gold');
}
function payroll(){
  var wages=wageBill();
  var repay=0;
  S.loans.forEach(function(L){
    if(L.weeksLeft>0){ repay+=L.weekly; L.weeksLeft--; L.paid+=L.weekly;
      if(L.weeksLeft<=0){ S.credit=Math.min(850,S.credit+25); addInbox('Bank','Loan settled','Paid '+L.paid+'k in full. The sharks smile. Credit +25.'); } }
  });
  S.loans=S.loans.filter(function(L){return L.weeksLeft>0;});
  var dl=staffLevel('doctor');
  if(dl>0)S.players.forEach(function(p){ if(!p.dead&&p.mng>0&&Math.random()<0.25*dl){ p.mng--; if(p.mng===0)log('Ripperdoc patches '+p.name+' back to fitness.'); } });
  S.gold-=(wages+repay);
  addLog('Payroll -'+(wages+repay)+'k (wages '+wages+'k, lenders '+repay+'k).');
  if(S.gold<0){
    var interest=Math.ceil(-S.gold*0.10);
    S.gold-=interest;
    S.credit=Math.max(300,S.credit-15);
    addInbox('Bank','Overdraft interest -'+interest+'k','Negative balance compounds at 10%/week. Credit -15.');
  } else if(repay>0){
    S.credit=Math.min(850,S.credit+5);
  }
  if(S.gold<-500){
    S.confidence=Math.max(0,S.confidence-20);
    addInbox('Board','Financial ruin','Treasury below -500k. The Syndicate is calling in favours. Confidence -20.');
  }
}
function refreshFrontOffice(){
  var el=$('frontOffice'); if(!el||!S)return; el.innerHTML='';
  var dl=staffLevel('doctor'), cl=staffLevel('coach');
  var info=document.createElement('div'); info.className='fixture-big';
  info.innerHTML='Treasury <b>'+S.gold+'k</b> · credit <b>'+S.credit+' ('+creditGrade()+')</b> · wage bill <b>'+wageBill()+'k/wk</b>';
  el.appendChild(info);
  var conf=document.createElement('div'); conf.className='confbar'; conf.style.marginBottom='10px';
  conf.innerHTML='<div class="conffill" style="width:'+Math.round((S.credit-300)/550*100)+'%"></div>';
  el.appendChild(conf);
  [['doctor','Ripperdoc','🧬','Tent -5k/level, 25%/level weekly MNG recovery, Lv2: new MNG -1',100,DOCTOR_UP],
   ['coach','Assistant Coach','📋','Training -10k/level (min 10k), MVP +1 SPP/level',80,COACH_UP]].forEach(function(cfg){
    var key=cfg[0], lv=staffLevel(key);
    var row=document.createElement('div'); row.className='market-item';
    var pips=''; for(var i=0;i<3;i++)pips+=(i<lv?'●':'○');
    row.innerHTML='<div class="pos">'+cfg[2]+'</div><div><div class="pname">'+cfg[1]+' '+(lv>0?('Lv'+lv+' '+pips+' · '+staffWage(key)+'k/wk'):('(vacant '+pips+')'))+'</div><div class="pstats">'+cfg[3]+'</div></div>';
    var w=document.createElement('div');
    if(lv<=0){
      var h=document.createElement('button'); h.className='mini-btn'; h.textContent='Hire '+cfg[4]+'k'; h.disabled=S.gold<cfg[4];
      h.onclick=function(){ S.gold-=cfg[4]; S.staff[key]=1; addLog('Hired '+cfg[1]+'.'); addInbox('Staff',cfg[1]+' joins','Wage '+staffWage(key)+'k/week. Worth every drop of blood.'); save(); refreshAll(); sfx('gold'); };
      w.appendChild(h);
    } else {
      if(lv<3){
        var u=document.createElement('button'); u.className='mini-btn'; u.textContent='Upgrade '+cfg[5][lv-1]+'k'; u.disabled=S.gold<cfg[5][lv-1];
        u.onclick=function(){ S.gold-=cfg[5][lv-1]; S.staff[key]=lv+1; addLog(cfg[1]+' up to Lv'+(lv+1)+'.'); save(); refreshAll(); sfx('gold'); };
        w.appendChild(u);
      }
      var f=document.createElement('button'); f.className='mini-btn'; f.textContent='Dismiss'; f.style.marginLeft='6px';
      f.onclick=function(){ S.staff[key]=0; addLog('Dismissed '+cfg[1]+'.'); save(); refreshAll(); };
      w.appendChild(f);
    }
    row.appendChild(w); el.appendChild(row);
  });
  var lh=document.createElement('h3'); lh.textContent='Loan sharks (max '+maxLoan()+'k at your credit)'; lh.style.marginTop='10px'; el.appendChild(lh);
  if(!S.loans.length){ var nl=document.createElement('div'); nl.className='fix'; nl.textContent='No debts. The sharks are disappointed.'; el.appendChild(nl); }
  S.loans.forEach(function(L){
    var d=document.createElement('div'); d.className='fix';
    d.innerHTML='<span>Owe '+L.total+'k total · '+L.weekly+'k/wk · '+L.weeksLeft+' wk left (paid '+L.paid+'k)</span>';
    el.appendChild(d);
  });
  var brow=document.createElement('div'); brow.className='btn-row';
  [100,200,400].forEach(function(a){
    var b=document.createElement('button'); b.className='mini-btn'; b.textContent='Borrow '+a+'k'; b.disabled=a>maxLoan();
    b.onclick=function(){ takeLoan(a); };
    brow.appendChild(b);
  });
  el.appendChild(brow);
}

var FACTION_LORE={
 Corpo:'Helios middle management with a bloodsport budget. Every casualty is a line item; every victory, a quarterly triumph.',
 Venom:'Chem-sisters of the outflow gangs. They poison the water supply, then sell the antidote at the gate.',
 Forge:'Vat-grown pit labour with furnace hearts. The Pits pay win bonuses in hot metal and hotter soup.',
 Ash:'Ash-waste nomads who outrun dust storms for fun. Every touchdown is another legend for the campfire.',
 Static:'Signal monks wrapped in Faraday faith. Their shields hum team anthems in binary.',
 Rust:'Penitent pilgrims of the Rust Chapel. Every martyr is a recruitment poster.',
 Ghost:'They were never here. Appearing in box scores is their only confirmed crime.',
 Khorne:'Skull-tithe collectors. They do not play to win — winning is a side effect of the harvest.',
 Nurgle:'Grandfather\u2019s gardeners. They rot beautifully and share generously. Wash your hands. Burn them after.',
 Tzeentch:'Schemes within schemes. Every pass rewrites fate; every fumble was also the plan.',
 Slaanesh:'Decadence made Logo. The Palace sells out because the crowd wants to be wanted back.',
 Skaven:'The Horned Swarm gnaws the grid\u2019s foundations. There are always more rats. There are never enough rats.',
 Kraken:'Sump-krakens nest in the outflow pipes and so, conveniently, do their handlers. Ink everything.',
 Guild:'The Corpse Guild renders the fallen into starch, soap, and starting lineups. Nothing is wasted. Everyone is eventually useful.',
 Volt:'Storm-chasers who fly kites in plasma weather. They jury-rig everything, including the scoreboard.',
 Choir:'The Silent Hymn sings without mouths. Devotion loud enough to sell tickets.'
};
var ABILITY_TEXT={
 Corpo:'Insured (+50k per death) · sponsored (+15k gate/match)',
 Venom:'Chem-bounties +5k per casualty caused',
 Forge:'Pit bonus +10k per win',
 Ash:'+10k per touchdown scored',
 Static:'Free re-roll every match',
 Rust:'Martyrdom +2 fans per death',
 Ghost:'Appearance fee +10k every match',
 Khorne:'Frenzy: +1 ST on blitz blocks',
 Nurgle:'Rot: KOs on your players become stuns',
 Tzeentch:'Schemes: +5k per completed pass',
 Slaanesh:'Excess: +5k and +1 fan per TD',
 Skaven:'Scurry: all players +1 MA',
 Kraken:'Salvage: +3k per armour you break',
 Guild:'Rendering: +25k per death on the pitch (either side)',
 Volt:'Jury-rigged: re-rolls cost 40k',
 Choir:'Adored: +2 extra fans per win'
};
function refreshCodex(){
  var el=$('codexList'); if(!el||!S)return; el.innerHTML='';
  Object.keys(ROSTERS).forEach(function(r){
    var c=factionColor(r);
    var d=document.createElement('div'); d.className='mail';
    d.innerHTML='<div class="mail-head"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:'+c.main+'"></span><b>'+r+'</b><small class="muted">'+(ABILITY_TEXT[r]||'')+'</small></div><div class="mail-body">'+(FACTION_LORE[r]||'')+'</div>';
    el.appendChild(d);
  });
}

/* ---------------- FM24: inbox / tactics / board ---------------- */
function abilityStars(p){ return Math.max(1,Math.min(5,Math.round(p.cost/40))); }
function starStr(p){ var n=abilityStars(p),s=''; for(var i=0;i<5;i++)s+=i<n?'★':'☆'; return s; }
function refreshInboxBadge(){
  if(!S)return;
  var n=S.inbox.filter(function(m){return !m.read;}).length;
  var b=$('inboxBadge'); if(b){b.textContent=n>0?n:'';b.style.display=n>0?'inline-block':'none';}
}
function refreshInbox(){
  refreshInboxBadge();
  var el=$('inboxList'); if(!el)return; el.innerHTML='';
  if(!S.inbox.length){el.innerHTML='<div class="fix">No messages. The board is watching, silently.</div>';return;}
  S.inbox.forEach(function(m){
    var d=document.createElement('div'); d.className='mail'+(m.read?'':' unread');
    d.innerHTML='<div class="mail-head"><span class="badge">'+m.tag+'</span><b>'+m.title+'</b><small class="muted">Wk'+m.week+'</small></div><div class="mail-body">'+m.body+'</div>';
    d.onclick=function(){m.read=true;save();refreshInbox();};
    el.appendChild(d);
  });
}
function mentalityFx(){
  if(!S)return '';
  if(S.mentality==='Attacking')return 'All your players +1 MA, but -1 AV (open at the back).';
  if(S.mentality==='Cautious')return 'All your players +1 AV, but -1 MA (grind it out).';
  return 'No modifiers. Pure Bloodfield.';
}
function refreshTactics(){
  var el=$('mentalityBtns'); if(!el||!S)return;
  el.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active',b.dataset.m===S.mentality); });
  $('mentalityFx').textContent=mentalityFx();
  $('tacticsBoard').innerHTML='Board expectation: <b>'+expectationText(S.expectation)+'</b> · Confidence: <b>'+S.confidence+'%</b>';
}
function leaguePos(){
  var teams=S.league.teams.slice().sort(function(a,b){return b.PTS-a.PTS||b.TD-a.TD;});
  for(var i=0;i<teams.length;i++)if(teams[i].name===S.teamName)return (i+1)+' of '+teams.length;
  return '—';
}
function refreshBoard(){
  var el=$('boardCard'); if(!el||!S)return;
  el.innerHTML='<b>☎️ Board:</b> expects <b>'+expectationText(S.expectation)+'</b> · currently <b>'+leaguePos()+'</b> · confidence <b>'+S.confidence+'%</b>'+
    '<div class="confbar"><div class="conffill" style="width:'+S.confidence+'%"></div></div>';
}

var FACTION_COLORS={
  Corpo:{main:'#ffd34d',dark:'#b39600'}, Venom:{main:'#66ff66',dark:'#2ea82e'},
  Forge:{main:'#ff4d2e',dark:'#a82e1e'}, Ash:{main:'#e0b34d',dark:'#a87f2e'},
  Static:{main:'#00e5cc',dark:'#00917f'}, Rust:{main:'#c95656',dark:'#6e2626'},
  Ghost:{main:'#dfe6f5',dark:'#8a93a6'},
  Khorne:{main:'#d42a1e',dark:'#7a1408'}, Nurgle:{main:'#8aa82e',dark:'#4d6b14'},
  Tzeentch:{main:'#4dd2ff',dark:'#1e6fa8'}, Slaanesh:{main:'#ff4dd2',dark:'#a81e86'},
  Skaven:{main:'#c8d42e',dark:'#6e7a14'},
  Kraken:{main:'#1e8fa8',dark:'#0d4d5c'}, Guild:{main:'#d8b82e',dark:'#7a6414'},
  Volt:{main:'#e8e83d',dark:'#8a8a1e'}, Choir:{main:'#e8e0d0',dark:'#8a8172'}
};
function factionColor(race){ return FACTION_COLORS[race]||FACTION_COLORS.Corpo; }

/* ---------------- RENDER: MATCH ---------------- */
var canvas, ctx, CELL=40;
function renderMatch(){
  if(!M)return;
  $('scoreHome').textContent='YOU '+M.homeScore;
  $('scoreAway').textContent=M.oppName.split(' ')[0].toUpperCase()+' '+M.awayScore;
  $('turnHome').textContent='Turn '+Math.min(M.turn,TURNS_PER_HALF)+'/'+TURNS_PER_HALF+' · H'+M.half+' '+(M.weather?M.weather.icon:'');
  $('turnAway').textContent=M.side==='home'?'Your move, coach':'AI thinking…';
  drawPitch();
  refreshSide();
}
function drawPitch(){
  canvas=$('pitch'); ctx=canvas.getContext('2d');
  var Wpx=canvas.width, Hpx=canvas.height;
  CELL=Math.min(Wpx/FW, Hpx/FH);
  var ox=(Wpx-CELL*FW)/2, oy=(Hpx-CELL*FH)/2;
  canvas._ox=ox; canvas._oy=oy;
  // grass
  for(var x=0;x<FW;x++)for(var y=0;y<FH;y++){
    ctx.fillStyle=(x+y)%2? '#237a37':'#1f6e32';
    if(x===0){ctx.fillStyle='#274b73';} // away endzone (AI attacks left)
    if(x===FW-1){ctx.fillStyle='#7a2323';} // home endzone
    ctx.fillRect(ox+x*CELL,oy+y*CELL,CELL+1,CELL+1);
  }
  // yard lines
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;
  [6,12,13,19].forEach(function(lx){ ctx.beginPath();ctx.moveTo(ox+lx*CELL,oy);ctx.lineTo(ox+lx*CELL,oy+FH*CELL);ctx.stroke(); });
  ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(ox,oy,FW*CELL,FH*CELL);
  ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='bold 13px system-ui';
  ctx.fillText('◀ AI TD',ox+6,oy+16); ctx.fillText('YOUR TD ▶',ox+FW*CELL-86,oy+16);
  // ball
  if(!M.ball.carrier){ ctx.font=(CELL-8)+'px serif'; ctx.fillText('🏈',ox+M.ball.x*CELL+4,oy+M.ball.y*CELL+CELL-6); }
  // hints
  REACH.forEach(function(c){ ctx.fillStyle=c.gfi?'rgba(255,211,77,.9)':'rgba(61,220,132,.75)';ctx.beginPath();ctx.arc(ox+c.x*CELL+CELL/2,oy+c.y*CELL+CELL/2,5,0,7);ctx.fill(); });
  BLOCKS.forEach(function(q){ ctx.strokeStyle='#ff4d5e';ctx.lineWidth=3;ctx.strokeRect(ox+q.x*CELL+2,oy+q.y*CELL+2,CELL-4,CELL-4); });
  SHOOT.forEach(function(q){ ctx.strokeStyle='#c07bff';ctx.lineWidth=3;ctx.strokeRect(ox+q.x*CELL+2,oy+q.y*CELL+2,CELL-4,CELL-4); });
  PASSL.forEach(function(q){ ctx.strokeStyle='#3da2ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ox+q.x*CELL+CELL/2,oy+q.y*CELL+CELL/2,CELL/2-2,0,7);ctx.stroke(); });
  // players
  M.players.forEach(function(p){
    if(p.out)return;
    var cx=ox+p.x*CELL+CELL/2, cy=oy+p.y*CELL+CELL/2;
    if(p.mid===SEL){ctx.strokeStyle='#ffd34d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,CELL/2,0,7);ctx.stroke();}
    ctx.beginPath();ctx.arc(cx,cy,CELL/2-3,0,7);
    var frace=p.side==='home'?S.race:(M.oppRace||'Corpo');
    var fc=factionColor(frace);
    ctx.fillStyle=(p.side==='home'&&p.moved)?fc.dark:fc.main;
    if(p.prone)ctx.fillStyle='#555';
    ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.textAlign='center';
    ctx.fillText(p.pos.slice(0,2).toUpperCase(),cx,cy-2);
    ctx.font='11px serif';
    ctx.fillText(p.prone?'💤':(M.ball.carrier===p.mid?'🏈':p.icon),cx,cy+12);
    ctx.textAlign='left';
    if(p.acted||p.moved){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(cx,cy,CELL/2-3,0,7);ctx.fill();}
  });
}
function refreshSide(){
  var p=selected();
  if(!p||p.side!=='home'){
    $('selInfo').innerHTML='<span class="muted">Click one of your <b style="color:var(--blue)">blue</b> players.</span>';
    $('actionBar').innerHTML='';
  } else {
    $('selInfo').innerHTML='<b>'+p.icon+' '+p.name+'</b> <span class="muted">'+p.pos+' · MA'+p.ma+' ST'+p.st+' AG'+p.ag+'+ AV'+p.av+'+</span><br><span class="muted">'+(p.skills.join(', ')||'No skills')+(p.moved?' · <b>moved</b>':'')+(p.acted?' · <b>acted</b>':'')+(M.ball.carrier===p.mid?' · <b>🏈 BALL</b>':'')+'</span>';
    var bar=$('actionBar'); bar.innerHTML='';
    [['move','🚶 Move'],['block','💥 Block'],['blitz','⚡ Blitz'],['pass','🏈 Pass'],['handoff','🤝 Handoff'],['shoot','🔫 Shoot']].forEach(function(a){
      var b=document.createElement('button'); b.className='mini-btn'+(MODE===a[0]?' action-on':''); b.textContent=a[1];
      b.onclick=function(){MODE=a[0];computeHints(p);drawPitch();refreshSide();};
      bar.appendChild(b);
    });
  }
  $('matchStats').innerHTML='<div class="stat"><b>'+M.homeScore+'–'+M.awayScore+'</b><small>Score</small></div><div class="stat"><b>H'+M.half+' T'+Math.min(M.turn,TURNS_PER_HALF)+'</b><small>Clock</small></div><div class="stat"><b>'+M.stats.blocks+'</b><small>Blocks</small></div><div class="stat"><b>'+S.rerolls+'</b><small>Re-rolls</small></div>';
}
function computeHints(p){
  REACH=[];BLOCKS=[];PASSL=[];
  if(!canAct(p))return;
  if(MODE==='move'&&!p.moved){REACH=reachable(p);}
  if(MODE==='block'&&!p.acted){BLOCKS=blockTargets(p);}
  if(MODE==='blitz'&&!M.blitzUsed&&!p.acted&&!p.blitzed){BLOCKS=M.players.filter(function(q){return q.side!==p.side&&!q.out&&!q.prone&&!q.stunned;}).slice(0,12);}
  if(MODE==='pass'&&!p.acted&&M.ball.carrier===p.mid){PASSL=passTargets(p);}
  if(MODE==='handoff'&&!p.acted&&M.ball.carrier===p.mid){PASSL=passTargets(p).filter(function(q){return Math.max(Math.abs(q.x-p.x),Math.abs(q.y-p.y))<=1;});}
  if(MODE==='shoot'&&!p.acted&&!p.jammed){SHOOT=shootTargets(p);}
}
function onPitchClick(e){
  if(!M||M.over||M.side!=='home')return;
  if(M.awaitingReroll){toast('Resolve the re-roll first (🎲 button) or wait it out.');return;}
  var r=canvas.getBoundingClientRect();
  var gx=Math.floor(((e.clientX-r.left)/r.width*canvas.width-canvas._ox)/CELL);
  var gy=Math.floor(((e.clientY-r.top)/r.height*canvas.height-canvas._oy)/CELL);
  if(gx<0||gy<0||gx>=FW||gy>=FH)return;
  var clicked=at(gx,gy);
  var p=selected();
  // select own player
  if(clicked&&clicked.side==='home'&&!clicked.out&&!clicked.prone&&!clicked.stunned){
    if(MODE==='pass'||MODE==='handoff'){
      if(p&&M.ball.carrier===p.mid&&PASSL.indexOf(clicked)>=0){
        if(MODE==='pass')doPass(p,clicked); else doHandoff(p,clicked);
        return;
      }
    }
    SEL=clicked.mid; MODE=clicked.moved?'block':'move';
    if(M.ball.carrier===clicked.mid&&!clicked.acted)MODE='move';
    computeHints(clicked); drawPitch(); refreshSide(); sfx('click');
    return;
  }
  if(!p){toast('Select one of your blue players first.');return;}
  if(MODE==='block'){
    if(clicked&&BLOCKS.indexOf(clicked)>=0){doBlock(p,clicked);return;}
    toast('Click a red-highlighted enemy to block.');
    return;
  }
  if(MODE==='blitz'){
    if(!M.blitzUsed&&clicked&&clicked.side==='away'&&!clicked.out&&!clicked.prone){
      // blitz = move then block: if adjacent, block now; else move first
      var adj=blockTargets(p).indexOf(clicked)>=0;
      if(adj){doBlock(p,clicked);return;}
      // move toward then auto-block if reach adjacency
      var path=aiPath(p,clicked.x,clicked.y);
      if(!path.length){toast('No path to blitz.');return;}
      // trim path to stop adjacent
      p.moved=true;
      doMoveSteps(p,path.slice(0,Math.max(0,path.length-1)),function(ok){
        if(!ok)return;
        var t2=blockTargets(p).indexOf(clicked)>=0?clicked:blockTargets(p)[0];
        if(t2)doBlock(p,t2); else{toast('Blitz: moved, no target adjacent.');}
      });
      return;
    }
    toast('Click an enemy to blitz (one blitz per turn).'); return;
  }
  if(MODE==='shoot'){
    if(clicked&&SHOOT.indexOf(clicked)>=0){doShoot(p,clicked);return;}
    toast('Click a purple-marked target (max 12 squares, guns can jam).'); return;
  }
  if(MODE==='pass'||MODE==='handoff'){
    toast('Click a blue-ringed teammate to '+(MODE==='pass'?'throw to':'hand off to')+'.'); return;
  }
  // move
  var dest=null;
  for(var i=0;i<REACH.length;i++)if(REACH[i].x===gx&&REACH[i].y===gy)dest=REACH[i];
  if(dest){
    p.moved=true; REACH=[];
    doMoveSteps(p,dest.path,function(ok){ SEL=p.mid; MODE='move'; computeHints(p); drawPitch(); refreshSide(); });
  } else toast('That square is out of range (green dots = reachable).');
}

function cyclePlayer(){
  if(!M||M.side!=='home')return;
  var mine=M.players.filter(function(p){return p.side==='home'&&!p.out&&!p.prone&&!p.stunned;});
  if(!mine.length)return;
  var i=mine.findIndex(function(p){return p.mid===SEL;});
  var nxt=mine[(i+1)%mine.length];
  SEL=nxt.mid; MODE=nxt.moved?'block':'move'; computeHints(nxt); drawPitch(); refreshSide();
}
/* ---------------- POST MATCH ---------------- */
function analysisRow(label,hv,av){
  var tot=Math.max(1,hv+av), hw=Math.round(hv/tot*100);
  return '<div class="arow"><span class="anum">'+hv+'</span><span class="alabel">'+label+'</span><span class="anum">'+av+'</span></div>'+
    '<div class="abar"><div class="abhome" style="width:'+hw+'%"></div></div>';
}
function showPostMatch(){
  $('preMatch').classList.add('hidden'); $('matchUI').classList.add('hidden');
  var pm=$('postMatch'); pm.classList.remove('hidden');
  var r=M.result;
  var title=r.res==='W'?'🎉 VICTORY!':r.res==='D'?'🤝 DRAW':'💀 DEFEAT';
  if(r.champion) title+= r.playerChamp? ' — 🏆 SEASON CHAMPIONS!':' — 🏆 '+r.champion+' win the league';
  if(M.sacked) title='😡 SACKED! The board has seen enough.';
  $('pmTitle').textContent=title;
  $('pmScore').innerHTML='YOU '+r.hs+' – '+r.as+' '+M.oppName+' · +'+r.total+'k gold';
  $('pmAnalysis').innerHTML='<h3>Post-match analysis — you vs '+M.oppName+'</h3>'+
    analysisRow('Blocks',M.stats.hb,M.stats.ab)+
    analysisRow('Completed passes',M.stats.hp,M.stats.ap)+
    analysisRow('Casualties caused',M.stats.hk,M.stats.ak);
  $('btnContinue').textContent=M.sacked?'🔎 Find a new club':'📋 Continue to management';
  var det=['Gate + prizes banked: <b>'+r.total+'k</b>. MVP +4 SPP awarded. Level-ups & injuries applied to your roster.'];
  if(r.champion) det.push(r.playerChamp?'Your name is sung in every tavern. The Bloodfield is yours.':'Final table settled. Rebuild, re-hire, and take the crown next season.');
  else det.push('Week advances to '+Math.min(S.week,3)+'. Heal, hire, then play the next fixture.');
  det=det.concat(S.log.slice(0,4));
  $('pmDetails').innerHTML=det.map(function(d){return '<div>'+d+'</div>';}).join('');
  switchTab('match');
}

/* ---------------- AUDIO: heroic metal + match sounds (all synthesized, no assets) ---------------- */
var AC=null, MUSC_GAIN=null, SFX_GAIN=null, SHAPER=null, NOISEBUF=null;
var MUS={on:(function(){try{return localStorage.getItem('bm-music-on')!=='0';}catch(e){return true;}})(), playing:false, step:0, next:0, timer:null, bpm:142};
function ensureAC(){
  if(!AC){
    AC=new (window.AudioContext||window.webkitAudioContext)();
    var master=AC.createGain(); master.gain.value=0.9; master.connect(AC.destination);
    SFX_GAIN=AC.createGain(); SFX_GAIN.gain.value=0.9; SFX_GAIN.connect(master);
    MUSC_GAIN=AC.createGain(); MUSC_GAIN.gain.value=0.40; MUSC_GAIN.connect(master);
    SHAPER=AC.createWaveShaper();
    var curve=new Float32Array(256);
    for(var i=0;i<256;i++){ var x=i/128-1; curve[i]=Math.tanh(3*x); }
    SHAPER.curve=curve; SHAPER.connect(MUSC_GAIN);
  }
  if(AC.state==='suspended')AC.resume();
  return AC;
}
function tone(freq,dur,type,vol,when,slide){
  try{
    ensureAC();
    var t=AC.currentTime+(when||0);
    var o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'square'; o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol||0.15,t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(SFX_GAIN);o.start(t);o.stop(t+dur+0.05);
  }catch(e){}
}
function noiseHit(dur,fType,freq,vol,when,q){
  try{
    ensureAC();
    if(!NOISEBUF){NOISEBUF=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var d=NOISEBUF.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    var t=AC.currentTime+(when||0);
    var s=AC.createBufferSource();s.buffer=NOISEBUF;s.loop=true;
    var f=AC.createBiquadFilter();f.type=fType;f.frequency.value=freq;f.Q.value=q||1;
    var g=AC.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(SFX_GAIN);s.start(t);s.stop(t+dur+0.05);
  }catch(e){}
}
function sfx(kind){
  try{
    switch(kind){
      case 'click': tone(650,0.06,'square',0.08); break;
      case 'dice': noiseHit(0.05,'highpass',4000,0.14,0);noiseHit(0.05,'highpass',4000,0.12,0.05);noiseHit(0.06,'highpass',3500,0.14,0.1); break;
      case 'thud': tone(95,0.15,'sine',0.5,0,40); noiseHit(0.08,'lowpass',500,0.3); break;
      case 'crunch': noiseHit(0.18,'lowpass',900,0.4); tone(70,0.2,'sawtooth',0.22,0,35); break;
      case 'whistle': tone(2300,0.18,'square',0.10); tone(2300,0.35,'square',0.10,0.22); break;
      case 'whistleEnd': tone(2300,0.15,'square',0.10); tone(2300,0.15,'square',0.10,0.2); tone(2300,0.5,'square',0.10,0.4); break;
      case 'cheer': noiseHit(1.1,'bandpass',1100,0.32,0,0.6); noiseHit(1.3,'bandpass',2200,0.18,0.1,0.7); tone(523,0.3,'square',0.06,0.1); break;
      case 'boo': tone(150,0.8,'sawtooth',0.18,0,85); noiseHit(0.8,'lowpass',400,0.22); break;
      case 'td': tone(2300,0.18,'square',0.10); noiseHit(1.1,'bandpass',1100,0.32,0.15,0.6); tone(82,0.4,'sawtooth',0.25,0.1); tone(123,0.4,'sawtooth',0.2,0.1); break;
      case 'win': tone(329,0.15,'square',0.12);tone(392,0.15,'square',0.12,0.12);tone(494,0.15,'square',0.12,0.24);tone(659,0.4,'square',0.14,0.36); noiseHit(1.2,'bandpass',1100,0.28,0.3,0.6); break;
      case 'bad': tone(150,0.8,'sawtooth',0.18,0,85); noiseHit(0.8,'lowpass',400,0.22); tone(65,0.6,'sawtooth',0.25,0.05,40); break;
      case 'gold': tone(880,0.07,'square',0.10); tone(1318,0.12,'square',0.10,0.07); break;
      case 'pickup': tone(500,0.09,'square',0.12,0,950); break;
      case 'catch': tone(620,0.07,'square',0.12); tone(930,0.1,'square',0.12,0.07); break;
      case 'levelup': tone(523,0.1,'square',0.12);tone(659,0.1,'square',0.12,0.09);tone(784,0.1,'square',0.12,0.18);tone(1046,0.25,'square',0.14,0.27); break;
      case 'shot': noiseHit(0.09,'highpass',2500,0.4); tone(120,0.12,'sine',0.4,0,45); break;
      case 'kick': tone(70,0.18,'sine',0.5,0,35); noiseHit(0.1,'lowpass',400,0.3); break;
      default: tone(440,0.08,'square',0.08);
    }
  }catch(e){}
}
/* --- heroic metal loop: detuned chugs + power stabs + gallop drums + lead --- */
var RIFF_ROOTS=[82.41,65.41,98.0,73.42]; // E C G D
var LEAD=[329.63,392.0,440.0,493.88, 523.25,493.88,440.0,392.0, 440.0,392.0,440.0,523.25, 493.88,440.0,392.0,329.63];
function musKick(t){
  var o=AC.createOscillator(),g=AC.createGain();
  o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.12);
  g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.14);
  o.connect(g);g.connect(MUSC_GAIN);o.start(t);o.stop(t+0.2);
}
function musNoise(t,dur,fType,freq,vol){
  var s=AC.createBufferSource();s.buffer=NOISEBUF;s.loop=true;
  var f=AC.createBiquadFilter();f.type=fType;f.frequency.value=freq;
  var g=AC.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(MUSC_GAIN);s.start(t);s.stop(t+dur+0.05);
}
function musLead(freq,t,dur){
  var o=AC.createOscillator();o.type='square';o.frequency.value=freq;
  var g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.07,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(MUSC_GAIN);o.start(t);o.stop(t+dur+0.05);
}
function playStep(step,t,stepDur){
  var bar=Math.floor(step/16)%4, s=step%16, root=RIFF_ROOTS[bar];
  if(s%2===0){ // palm-muted chug 8ths
    var o=AC.createOscillator();o.type='sawtooth';o.frequency.value=root;
    var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=700;
    var g=AC.createGain();var dur=stepDur*1.7;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(s%4===0?0.22:0.14,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(f);f.connect(g);g.connect(SHAPER);o.start(t);o.stop(t+dur+0.05);
  }
  if(s===0){ // power-chord stab: root + fifth + octave
    [1,1.5,2].forEach(function(m){
      var o=AC.createOscillator();o.type='sawtooth';o.frequency.value=root*m;
      var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=2600;
      var g=AC.createGain();
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.09,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.42);
      o.connect(f);f.connect(g);g.connect(SHAPER);o.start(t);o.stop(t+0.5);
    });
  }
  if(s===0||s===4||s===8||s===12||s===14)musKick(t);
  if(s===4||s===12)musNoise(t,0.13,'bandpass',1800,0.30);
  if(s%2===1)musNoise(t,0.04,'highpass',8000,0.10);
  if(s%4===0){ var n=LEAD[bar*4+Math.floor(s/4)]; if(n)musLead(n,t,stepDur*3.4); }
}
function musSchedule(){
  if(!MUS.on||!MUS.playing||!AC)return;
  if(!NOISEBUF){NOISEBUF=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var d=NOISEBUF.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  var stepDur=60/MUS.bpm/4;
  while(MUS.next<AC.currentTime+0.28){
    try{playStep(MUS.step,MUS.next,stepDur);}catch(e){}
    MUS.next+=stepDur;MUS.step=(MUS.step+1)%64;
  }
}
function startMusic(){
  try{
    if(!MUS.on)return;
    ensureAC();
    if(MUS.playing)return;
    MUS.playing=true;MUS.step=0;MUS.next=AC.currentTime+0.1;
    if(!MUS.timer)MUS.timer=setInterval(musSchedule,90);
  }catch(e){}
}
function stopMusic(){ MUS.playing=false; if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null;} }
function setMusic(on){
  MUS.on=on;
  try{localStorage.setItem('bm-music-on',on?'1':'0');}catch(e){}
  var b=$('btnMusic'); if(b)b.textContent=on?'🎸 Music: on':'🎸 Music: off';
  if(on)startMusic(); else stopMusic();
}
function log(msg){ var el=$('diceLog'); if(!el)return; var d=document.createElement('div'); d.innerHTML=msg; el.prepend(d); }
function toast(msg){ var t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.add('hidden');},2600); }

/* ---------------- NAV / WIRING ---------------- */
function switchTab(name){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===name);});
  document.querySelectorAll('.panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+name);});
  if(name==='inbox'&&S){ S.inbox.forEach(function(m){m.read=true;}); save(); refreshInbox(); }
}
function refreshAll(){ refreshHUD(); refreshRoster(); refreshLeague(); refreshSetup(); refreshInbox(); refreshTactics(); refreshBoard(); refreshFrontOffice(); refreshCodex(); save(); }
function init(){
  canvas=$('pitch');
  canvas.addEventListener('click',onPitchClick);
  document.querySelectorAll('.tab').forEach(function(b){b.onclick=function(){switchTab(b.dataset.tab);};});
  $('btnToMatch').onclick=function(){switchTab('match');};
  $('marketRace').onchange=refreshRoster;
  document.querySelectorAll('#mentalityBtns button').forEach(function(b){b.onclick=function(){S.mentality=b.dataset.m;addLog('Tactics set: '+S.mentality+'.');save();refreshTactics();toast('Mentality: '+S.mentality+' — '+mentalityFx());};});
  $('btnHealAll').onclick=function(){
    var hc=healCost();
    if(S.gold<hc){toast('Ripperdoc tent needs '+hc+'k.');return;}
    S.gold-=hc; var n=0;
    S.players.forEach(function(p){ if(!p.dead&&p.mng>0){p.mng=0;n++;} });
    addLog('Ripperdoc session: patched '+n+' wound(s).'); save(); refreshAll(); toast('Ripperdoc patched '+n+' player(s).');
  };
  $('btnBuyReroll').onclick=function(){
    var rrc=50;
    if(S.race==='Volt')rrc=40;
    if(S.rerolls>=8){toast('Max 8 re-rolls.');return;}
    if(S.gold<rrc){toast('Re-roll costs '+rrc+'k.');return;}
    S.gold-=rrc;S.rerolls++;save();refreshHUD();toast('🎲 Re-roll bought! ('+S.rerolls+')');
  };
  $('btnNewSeason').onclick=function(){
    if(!confirm('Start a new season? Table resets, squad & gold carry over, injuries heal.'))return;
    S.week=1;S.wins=0;S.draws=0;S.losses=0;S.tdFor=0;S.tdAgainst=0;S.casFor=0;
    S.players.forEach(function(p){p.mng=0;p.ko=false;p.bh=false;});
    S.league=makeLeague(S.teamName);S.rerolls=Math.max(S.rerolls,2);
    S.confidence=60; S.expectation=pickExpectation();
    addInbox('Board','New season, new demands','Expectation: <b>'+expectationText(S.expectation)+'</b>. The fans demand blood.');
    addLog('New season kicks off!');save();refreshAll();switchTab('squad');toast('New season — fresh table, same killers.');
  };
  $('btnSave').onclick=function(){save();toast('Saved.');};
  $('btnKickoff').onclick=function(){
    if(starters().length<7){toast('You need 7 fit players! Sign more in Squad tab.');switchTab('squad');return;}
    if(S.week>3){toast('Season over — start a new season!');return;}
    $('preMatch').classList.add('hidden');$('postMatch').classList.add('hidden');$('matchUI').classList.remove('hidden');
    $('diceLog').innerHTML='';
    newMatch();
    startMusic();
  };
  $('btnEndTurn').onclick=function(){ if(M&&!M.over&&M.side==='home'&&!M.awaitingReroll){endTeamTurn(false);} };
  $('btnConcede').onclick=function(){ if(M&&!M.over&&confirm('Concede this match 0–2?')){M.homeScore=0;M.awayScore=2;endMatch();} };
  $('btnContinue').onclick=function(){ if(M&&M.sacked){ M.sacked=false; $('postMatch').classList.add('hidden'); $('matchUI').classList.add('hidden'); $('preMatch').classList.remove('hidden'); $('newTeamModal').classList.remove('hidden'); return; } $('postMatch').classList.add('hidden'); $('matchUI').classList.add('hidden'); $('preMatch').classList.remove('hidden'); refreshAll(); switchTab(S.week>3?'league':'squad'); };
  $('btnReroll').onclick=useReroll;
  $('btnMusic').onclick=function(){ setMusic(!MUS.on); toast(MUS.on?'Metal on.':'Metal off.'); };
  $('btnMusic').textContent=MUS.on?'🎸 Music: on':'🎸 Music: off';
  document.addEventListener('keydown',function(e){
    if(e.code==='Space'&&M&&!M.over&&$('tab-match').classList.contains('active')){e.preventDefault();$('btnEndTurn').click();}
    if(e.key==='Escape'){SEL=null;REACH=[];BLOCKS=[];PASSL=[];SHOOT=[];if(M)drawPitch();}
    if(e.key==='Tab'&&M&&M.side==='home'){e.preventDefault();cyclePlayer();}
  });
  // modal
  document.querySelectorAll('#racePick .race-card').forEach(function(b){b.onclick=function(){document.querySelectorAll('#racePick .race-card').forEach(function(x){x.classList.remove('active');});b.classList.add('active');};});
  $('btnCreateTeam').onclick=function(){
    var nm=($('inpTeamName').value||'Neon Vultures').trim()||'Neon Vultures';
    var race=(document.querySelector('#racePick .race-card.active')||{}).dataset?document.querySelector('#racePick .race-card.active').dataset.race:'Corpo';
    S=defaultCareer(nm,race);
    $('marketRace').value=race;
    addInbox('Board','Welcome to '+nm,'The board welcomes you. Season expectation: <b>'+expectationText(S.expectation)+'</b>. Keep confidence high or face the sack.');
    addInbox('Scout','Dugout assessment','Your assistant rates the squad: keep 7 fit, sign stars, and set a mentality in Tactics before match day.');
    save();refreshAll();$('newTeamModal').classList.add('hidden');
    toast('Club founded! Sign players, then hit Match day.');
    startMusic();
  };
  // help races
  $('helpRaces').innerHTML=Object.keys(ROSTERS).map(function(r){
    return '<div class="stat"><b>'+r+'s</b><small>'+ROSTERS[r].map(function(p){return p.pos+' '+p.ma+'/'+p.st+'/'+p.ag+'+/'+p.av+'+';}).join('<br>')+'</small></div>';
  }).join('');
  // boot
  S=load();
  if(!S||!S.teamName||!ROSTERS[S.race]){ $('newTeamModal').classList.remove('hidden'); S=defaultCareer('Neon Vultures','Corpo'); }
  if(!S.inbox)S.inbox=[];
  if(!S.mentality)S.mentality='Balanced';
  if(!S.expectation)S.expectation=pickExpectation();
  if(typeof S.confidence!=='number')S.confidence=60;
  if(!S.wizard)S.wizard=null;
  if(!S.staff)S.staff={doctor:0,coach:0};
  if(!S.loans)S.loans=[];
  if(typeof S.credit!=='number')S.credit=550;
  $('marketRace').value=(ROSTERS[S.race]?S.race:'Corpo');
  refreshAll();
  window.BM_damage={blockDiceCount:blockDiceCount,pickBlock:pickBlock,rollAG:rollAG,recomputeTable:recomputeTable,ROSTERS:ROSTERS};
  window.BM={getMatch:function(){return M;},scoreTD:scoreTD,endMatch:endMatch,getCareer:function(){return S;},audio:function(){return{on:MUS.on,playing:MUS.playing,state:(AC?(AC.state):'none'),step:MUS.step};},settleBall:resolveBallLanding};
}
if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',init);
// node export for tests
if(typeof module!=='undefined'&&module.exports){module.exports={blockDiceCount:blockDiceCount,pickBlock:pickBlock,rollAG:rollAG,ROSTERS:ROSTERS,d6:d6};}
})();
