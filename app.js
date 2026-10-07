/* transport */
function seek(t){T=clamp(t,0,dur());if(hasVideo)V.currentTime=T;dirty=1}
function setP(on){playing=on;$('#pp').textContent=on?'⏸':'▶';dirty=1}
function play(on){if(hasVideo){if(on)V.play().catch(()=>toast('Playback was blocked. Tap play again.'));else V.pause()}else{if(on&&T>=dur())T=0;setP(on)}}
V.onplay=()=>setP(true);V.onpause=()=>setP(false);V.onended=()=>setP(false);
V.onloadedmetadata=()=>{hasVideo=true;vb.classList.add('hv');V.playbackRate=rate;seek(T);toast('Video loaded')};
V.onerror=()=>{if(!V.getAttribute('src'))return;hasVideo=false;vb.classList.remove('hv');toast('This browser cannot play that file (MKV/HEVC?). Use MP4 (H.264) or WebM.')};
vb.onclick=()=>play(!playing);$('#fs').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(vb.requestFullscreen)vb.requestFullscreen();else if(V.webkitEnterFullscreen)V.webkitEnterFullscreen()};
$('#pp').onclick=()=>play(!playing);$('#b1').onclick=()=>seek(T-5);$('#b4').onclick=()=>seek(T+5);$('#b2').onclick=()=>seek(T-.04);$('#b3').onclick=()=>seek(T+.04);
$('#rt').onclick=()=>{const R=[.5,1,1.5,2];rate=R[(R.indexOf(rate)+1)%R.length];V.playbackRate=rate;$('#rt').textContent=rate+'x'};$('#sk').oninput=ev=>seek(+ev.target.value);
let lastRow=-9,lastTL=0;function hud(d){$('#tm').textContent=fm(T)+' / '+fm(dur());const s=$('#sk');s.max=dur();if(document.activeElement!==s)s.value=T;if(Math.abs(T-lastRow)>.05||d){lastRow=T;A.ev.forEach(e=>{const r=rows.get(e.id);if(r)r.classList.toggle('act',T>=e.start&&T<e.end)})}}
let last=performance.now(),lastDraw=-1;
function loop(ts){requestAnimationFrame(loop);const dt=Math.min((ts-last)/1000,.2);last=ts;
if(playing){if(hasVideo)T=V.currentTime;else{T+=dt*rate;if(T>=dur()){T=dur();setP(false)}}}
if(playing||dirty||T!==lastDraw){const d=dirty;dirty=0;lastDraw=T;try{drawSubs(d);if(d||!playing||ts-lastTL>60){drawTL();lastTL=ts}hud(d)}catch(e){console.error(e)}}}
/* files */
const isVid=f=>/^video\//.test(f.type)||/\.(mp4|mkv|webm|mov|m4v)$/i.test(f.name);
async function loadAss(f){try{const b=await f.arrayBuffer();let t=new TextDecoder('utf-8').decode(b);if(t.includes('\uFFFD')){try{t=new TextDecoder('windows-1256').decode(b)}catch(e){}}
if(!/\[(script info|events|v4\+? styles)\]/i.test(t))return toast('That file does not look like an .ass or .ssa subtitle');
A=parse(t);sel=A.ev[0]?A.ev[0].id:null;ss=0;hist=[];hi=-1;lastD='';commit('import');all();seek(A.ev[0]?A.ev[0].start:0);toast('Imported '+A.ev.length+' lines')}catch(x){toast('Could not read that file')}}
function loadVid(f){if(vurl)URL.revokeObjectURL(vurl);hasVideo=false;setP(false);vurl=URL.createObjectURL(f);V.src=vurl;V.load()}
const loadAny=f=>isVid(f)?loadVid(f):loadAss(f);
for(const id of['fa','fv'])$('#'+id).onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)loadAny(f)};
$('#bi').onclick=()=>$('#fa').click();$('#bv').onclick=()=>$('#fv').click();
addEventListener('dragover',e=>e.preventDefault());addEventListener('drop',e=>{e.preventDefault();[...e.dataTransfer.files].forEach(loadAny)});
$('#be').onclick=()=>{const n=(gi('Title')||'subtitles').replace(/[\\\/:*?"<>|]+/g,'_').trim()||'subtitles',a=h('a',{href:URL.createObjectURL(new Blob([ser(A)],{type:'text/plain;charset=utf-8'})),download:n+'.ass'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)};
$('#bu').onclick=undo;$('#br').onclick=redo;$('#la').onclick=add;$('#ld').onclick=dup;$('#ls').onclick=split;$('#lx').onclick=del;$('#le').onclick=()=>tab('edit');
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.t));
addEventListener('keydown',ev=>{if(/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName))return;const m=ev.ctrlKey||ev.metaKey;
if(ev.code==='Space'){ev.preventDefault();play(!playing)}else if(ev.key==='ArrowLeft')seek(T-.04);else if(ev.key==='ArrowRight')seek(T+.04);else if(m&&ev.key==='z'){ev.preventDefault();ev.shiftKey?redo():undo()}else if(m&&ev.key==='y'){ev.preventDefault();redo()}});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
addEventListener('error',e=>toast('Error: '+e.message));
(async()=>{try{const s=await idb('get','p');if(s){const a=JSON.parse(s);if(a&&a.ev&&a.styles&&a.info){A=a;sel=A.ev[0]?A.ev[0].id:null;toast('Restored your last project')}}}catch(e){}
commit('init');all();requestAnimationFrame(loop)})();
