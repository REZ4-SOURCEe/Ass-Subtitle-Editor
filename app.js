/* transport */
function seek(t){T=clamp(t,0,dur());if(hasVideo)V.currentTime=T;dirty=1}
function setP(on){playing=on;$('#pp').replaceChildren(ico(on?'pause':'play'));$('#fcp').replaceChildren(ico(on?'pause':'play'));$('#pp').setAttribute('aria-label',on?'Pause':'Play');dirty=1}
function play(on){if(hasVideo){if(on)V.play().catch(()=>toast('Playback was blocked. Tap play again.'));else V.pause()}else{if(on&&T>=dur())T=0;setP(on)}}
V.onplay=()=>setP(true);V.onpause=()=>setP(false);V.onended=()=>setP(false);
V.onloadedmetadata=()=>{hasVideo=true;vb.classList.add('hv');V.playbackRate=rate;seek(T);toast('Video loaded')};
V.onerror=()=>{if(!V.getAttribute('src'))return;hasVideo=false;vb.classList.remove('hv');toast('This browser cannot play that file (MKV/HEVC?). Use MP4 (H.264) or WebM.')};
vb.onclick=()=>play(!playing);$('#fs').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(vb.requestFullscreen)vb.requestFullscreen();else if(V.webkitEnterFullscreen)V.webkitEnterFullscreen()};
$('#pp').onclick=()=>play(!playing);$('#b1').onclick=()=>seek(T-5);$('#b4').onclick=()=>seek(T+5);$('#b2').onclick=()=>seek(T-.04);$('#b3').onclick=()=>seek(T+.04);
$('#rt').onclick=()=>{const R=[.5,1,1.5,2];rate=R[(R.indexOf(rate)+1)%R.length];V.playbackRate=rate;$('#rt').textContent=rate+'x'};$('#sk').oninput=ev=>seek(+ev.target.value);
let lastRow=-9,lastTL=0;function hud(d){fcUpd();$('#tm').textContent=fm(T)+' / '+fm(dur());const s=$('#sk');s.max=dur();if(document.activeElement!==s)s.value=T;if(Math.abs(T-lastRow)>.05||d){lastRow=T;A.ev.forEach(e=>{const r=rows.get(e.id);if(r)r.classList.toggle('act',T>=e.start&&T<e.end)})}}
let last=performance.now(),lastDraw=-1;
function loop(ts){requestAnimationFrame(loop);const dt=Math.min((ts-last)/1000,.2);last=ts;
if(playing){if(hasVideo)T=V.currentTime;else{T+=dt*rate;if(T>=dur()){T=dur();setP(false)}}}
if(playing||dirty||T!==lastDraw){const d=dirty;dirty=0;lastDraw=T;try{drawSubs(d);if(d||!playing||ts-lastTL>60){drawTL();lastTL=ts}hud(d)}catch(e){console.error(e)}}}
/* files */
const isVid=f=>/^video\//.test(f.type)||/\.(mp4|mkv|webm|mov|m4v)$/i.test(f.name);
async function loadAss(f){try{const b=await f.arrayBuffer();const u=new Uint8Array(b);let t=u[0]===255&&u[1]===254?new TextDecoder('utf-16le').decode(b):u[0]===254&&u[1]===255?new TextDecoder('utf-16be').decode(b):new TextDecoder('utf-8').decode(b);if(!(u[0]>=254)&&t.includes('\uFFFD')){try{t=new TextDecoder('windows-1256').decode(b)}catch(e){}}
const srt=/\d+:\d+[,.]\d{1,3}\s*-->\s*\d+:\d+/.test(t)&&!/\[events\]/i.test(t);if(!srt&&!/\[(script info|events|v4\+? styles)\]/i.test(t))return toast('That file is not an .ass, .srt or .vtt subtitle');
A=srt?parseSrt(t,f.name.replace(/\.\w+$/,'')):parse(t);drafts.clear();if(A.fonts&&A.fonts.length)await loadFileFonts(A.fonts);delete A.fonts;sel=A.ev[0]?A.ev[0].id:null;ss=0;hist=[];hi=-1;lastD='';commit('import');all();seek(A.ev[0]?A.ev[0].start:0);toast('Imported '+A.ev.length+' lines')}catch(x){toast('Could not read that file')}}
function loadVid(f){if(vurl)URL.revokeObjectURL(vurl);hasVideo=false;setP(false);vurl=URL.createObjectURL(f);V.src=vurl;V.load()}
const loadAny=f=>isVid(f)?loadVid(f):loadAss(f);
for(const id of['fa','fv'])$('#'+id).onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)loadAny(f)};
$('#bi').onclick=()=>$('#fa').click();$('#bv').onclick=()=>$('#fv').click();
addEventListener('dragover',e=>e.preventDefault());addEventListener('drop',e=>{e.preventDefault();[...e.dataTransfer.files].forEach(loadAny)});
$('#be').onclick=()=>{$('#xp').hidden=false};
const xs={f:'ass',d:'keep'};document.querySelectorAll('#xf button,#xd button').forEach(b=>b.onclick=()=>{const g=b.parentNode;g.querySelectorAll('button').forEach(x=>x.classList.toggle('p',x===b));xs[g.id==='xf'?'f':'d']=b.dataset.v});
$('#xc2').onclick=()=>{$('#xp').hidden=true};
$('#xg').onclick=()=>{const o={dir:xs.d,nodot:$('#xr').checked},n=(gi('Title')||'subtitles').replace(/[\\\/:*?"<>|]+/g,'_').trim()||'subtitles',txt=xs.f==='srt'?serSrt(A,o):ser(A,o),a=h('a',{href:URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'})),download:n+'.'+xs.f});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);$('#xp').hidden=true};
$('#bu').onclick=undo;$('#br').onclick=redo;$('#la').onclick=add;$('#ld').onclick=dup;$('#ls').onclick=split;$('#lx').onclick=del;$('#le').onclick=()=>tab('edit');
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
addEventListener('keydown',ev=>{if(/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName))return;const m=ev.ctrlKey||ev.metaKey;
if(ev.code==='Space'){ev.preventDefault();play(!playing)}else if(ev.key==='ArrowLeft')seek(T-.04);else if(ev.key==='ArrowRight')seek(T+.04);else if(m&&ev.key==='z'){ev.preventDefault();ev.shiftKey?redo():undo()}else if(m&&ev.key==='y'){ev.preventDefault();redo()}});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
addEventListener('error',e=>toast('Error: '+e.message));
(async()=>{try{const s=await idb('get','p');if(s){const a=JSON.parse(s);if(a&&a.ev&&a.styles&&a.info){A=a;sel=A.ev[0]?A.ev[0].id:null;if(A.ev.length)toast('Restored your last project')}}}catch(e){}
try{const fs=await idb('get','f');if(fs&&fs.length)await restoreFonts(fs)}catch(e){}
document.querySelectorAll('[data-i]').forEach(b=>b.prepend(ico(b.dataset.i)));commit('init');all();requestAnimationFrame(loop)})();

$('#ff').onchange=async e=>{for(const f of e.target.files)await addFont(f);e.target.value=''};

{const ed=$('#edit'),isT=t=>(t.tagName==='TEXTAREA'||(t.tagName==='INPUT'&&t.type!=='checkbox'));
ed.addEventListener('focusin',ev=>{if(!isT(ev.target))return;document.body.classList.add('kb');const t=ev.target;setTimeout(()=>t.scrollIntoView({block:'center'}),350)});
ed.addEventListener('focusout',()=>setTimeout(()=>{if(!ed.contains(document.activeElement))document.body.classList.remove('kb')},150));
window.addEventListener('resize',()=>{const t=document.activeElement;if(t&&ed.contains(t)&&isT(t))setTimeout(()=>t.scrollIntoView({block:'center'}),100)})}

const ask=(t,m,ok)=>new Promise(r=>{const c=$('#cf'),end=v=>{c.hidden=true;r(v)};$('#ct').textContent=t;$('#cm').textContent=m;$('#co').textContent=ok;c.hidden=false;$('#co').onclick=()=>end(1);$('#cn').onclick=()=>end(0);c.onclick=ev=>{if(ev.target===c)end(0)}});
$('#bn').onclick=async()=>{if(!await ask('Delete project?','The current project will be removed. Export it first if you still need it.','Delete'))return;A=newA();drafts.clear();sel=null;ss=0;hist=[];hi=-1;lastD='';commit('new');all();seek(0);toast('Project deleted')};

const fsOn=()=>document.fullscreenElement===vb||vb.classList.contains('fsx');
let fcT=0;const showFC=()=>{const c=$('#fc');c.classList.add('show');clearTimeout(fcT);fcT=setTimeout(()=>c.classList.remove('show'),4000)};
async function enterFS(){let ok=false;try{if(vb.requestFullscreen){await vb.requestFullscreen();ok=true;try{await screen.orientation.lock('landscape')}catch(e){}}}catch(e){}if(!ok)vb.classList.add('fsx');dirty=1;showFC()}
function exitFS(){try{screen.orientation.unlock()}catch(e){}vb.classList.remove('fsx');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('#fc').classList.remove('show');dirty=1}
function fcUpd(){if(!fsOn())return;const s=$('#fcs');s.max=dur();if(document.activeElement!==s)s.value=T;$('#fct').textContent=fm(T)+' / '+fm(dur())}
$('#fs').onclick=()=>fsOn()?exitFS():enterFS();$('#fcx').onclick=exitFS;
$('#fcp').onclick=()=>{play(!playing);showFC()};$('#fcb').onclick=()=>{seek(T-5);showFC()};$('#fcf').onclick=()=>{seek(T+5);showFC()};$('#fcs').oninput=ev=>{seek(+ev.target.value);showFC()};
vb.onclick=ev=>{if(fsOn()){if(!ev.target.closest('#fc')){const c=$('#fc');if(c.classList.contains('show'))c.classList.remove('show');else showFC()}return}play(!playing)};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){try{screen.orientation.unlock()}catch(e){}if(!vb.classList.contains('fsx'))$('#fc').classList.remove('show');dirty=1}});
