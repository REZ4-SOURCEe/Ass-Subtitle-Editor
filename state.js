/* state */
let A=newA(),sel=null,hist=[],hi=-1,lastD='',lastT=0,T=0,playing=false,hasVideo=false,rate=1,dirty=1,vurl=null,ss=0,tv0=0,span=30,drag=null,hits=[],rows=new Map(),svt;
const V=$('#v'),cur=()=>A.ev.find(e=>e.id===sel),gi=k=>{const r=A.info.find(l=>l.toLowerCase().startsWith(k.toLowerCase()+':'));return r?r.slice(r.indexOf(':')+1).trim():''};
const dur=()=>hasVideo?V.duration:A.ev.reduce((m,e)=>Math.max(m,e.end+5),60),strip=t=>t.replace(/\{[^}]*\}/g,'').replace(/\\[Nn]/g,' '),sortEv=()=>A.ev.sort((a,b)=>a.start-b.start);
const db=()=>new Promise((res,rej)=>{try{const r=indexedDB.open('asse',1);r.onupgradeneeded=()=>r.result.createObjectStore('k');r.onsuccess=()=>res(r.result);r.onerror=()=>rej()}catch(e){rej(e)}});
const idb=async(m,k,v)=>{const d=await db();return new Promise((res,rej)=>{const s=d.transaction('k',m==='get'?'readonly':'readwrite').objectStore('k'),q=m==='get'?s.get(k):s.put(v,k);q.onsuccess=()=>res(q.result);q.onerror=rej})};
const snap=()=>JSON.stringify(A);
function save(){clearTimeout(svt);svt=setTimeout(()=>idb('put','p',snap()).catch(()=>{}),700)}
function ui(){$('#bu').disabled=hi<=0;$('#br').disabled=hi>=hist.length-1}
function commit(d){const now=Date.now(),s=snap();if(d&&d===lastD&&now-lastT<900&&hi>0&&hi===hist.length-1)hist[hi]=s;else{hist=hist.slice(0,hi+1);hist.push(s);if(hist.length>100)hist.shift();hi=hist.length-1}lastD=d;lastT=now;save();ui()}
function restore(i){hi=i;A=JSON.parse(hist[i]);if(!cur())sel=A.ev[0]?A.ev[0].id:null;lastD='';all();ui();save()}
const undo=()=>hi>0&&restore(hi-1),redo=()=>hi<hist.length-1&&restore(hi+1);
const all=()=>{renderList();renderEdit();renderStyles();dirty=1};
function chg(d){sortEv();commit(d);renderList();dirty=1}
/* actions */
const mk=o=>({id:gid(),type:'Dialogue',layer:0,start:T,end:T+3,style:A.styles[0].name,name:'',marginl:0,marginr:0,marginv:0,effect:'',text:'',...o});
function add(){const e=mk();A.ev.push(e);sel=e.id;chg('add');renderEdit();tab('edit')}
function dup(){const e=cur();if(!e)return;const n={...e,id:gid(),start:e.end,end:e.end+e.end-e.start};A.ev.push(n);sel=n.id;chg('dup');renderEdit()}
function split(){const e=cur();if(!e||T<=e.start+.02||T>=e.end-.02)return toast('Move the playhead inside the selected line');const n={...e,id:gid(),start:T};e.end=T;A.ev.push(n);sel=n.id;chg('split');renderEdit()}
function del(){const e=cur();if(!e)return;const i=A.ev.indexOf(e);A.ev.splice(i,1);sel=(A.ev[i]||A.ev[i-1]||{}).id||null;chg('del');renderEdit()}
function select(id){sel=id;markRows();renderEdit();const r=rows.get(id);if(r)r.scrollIntoView({block:'nearest'})}
function tab(n){document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!==n);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===n))}
function renderList(){const L=$('#list');L.textContent='';rows.clear();A.ev.forEach((e,i)=>{const r=h('div',{class:'row'+(e.type==='Comment'?' cm':''),onclick:()=>{if(sel===e.id)return tab('edit');select(e.id);seek(e.start)}},h('div',{class:'m'},`#${i+1}  ${e.style}  ${s2t(e.start)} → ${s2t(e.end)}`),h('div',{class:'t',dir:'auto'},strip(e.text)||'—'));rows.set(e.id,r);L.append(r)});markRows();if(!A.ev.length)L.append(h('div',{class:'mt'},h('p',{},'No lines yet. Import a subtitle file, or tap ＋ to add a line at the playhead.'),h('button',{class:'p',onclick:()=>$('#fa').click()},'Import .ass')))}
const markRows=()=>rows.forEach((r,id)=>r.classList.toggle('sel',id===sel));
const TG=['\\an8','\\pos(960,540)','\\fs60','\\fnVazirmatn','\\c&HFFFFFF&','\\3c&H000000&','\\bord3','\\shad2','\\blur2','\\fad(200,200)','\\move(0,540,1920,540)','\\b1','\\i1','\\u1','\\alpha&H80&','\\frz10','\\r'];
function renderEdit(){const P=$('#edit');P.textContent='';const e=cur();if(!e){P.append(h('div',{class:'mt'},'Select a line in the Lines tab.'));return}
const ti=(k,l)=>{const i=h('input',{value:s2t(e[k]),inputmode:'decimal',onchange:()=>{const v=t2s(i.value);if(v==null){i.value=s2t(e[k]);return}e[k]=Math.max(0,v);i.value=s2t(e[k]);chg('time')}});return h('label',{class:'f'},l,i)};
const ni=(l,k)=>{const i=h('input',{type:'number',value:e[k],oninput:()=>{e[k]=parseInt(i.value)||0;dirty=1;commit('n'+k+e.id)}});return h('label',{class:'f'},l,i)};
const ta=h('textarea',{rows:4,dir:'auto',spellcheck:'false',value:e.text,placeholder:'Subtitle text…',oninput:()=>{e.text=ta.value;const r=rows.get(e.id);if(r)r.lastChild.textContent=strip(e.text)||'—';dirty=1;commit('text'+e.id)}});
const ins=tag=>{const s=ta.selectionStart,v=ta.value,inside=v.lastIndexOf('{',s-1)>v.lastIndexOf('}',s-1);ta.setRangeText(inside?tag:'{'+tag+'}',s,ta.selectionEnd,'end');ta.focus();ta.dispatchEvent(new Event('input'))};
const chips=h('div',{class:'chips',onpointerdown:ev=>ev.preventDefault()},h('button',{onclick:()=>{const s=ta.selectionStart;ta.setRangeText('\\N',s,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}},'\\N'),TG.map(t=>h('button',{onclick:()=>ins(t)},t.replace(/[(&].*/,''))));
P.append(ta,chips,h('div',{class:'g2'},ti('start','Start'),ti('end','End')),h('div',{class:'g2'},h('button',{onclick:()=>{e.start=Math.min(T,e.end-.05);chg('time');renderEdit()}},'Start = playhead'),h('button',{onclick:()=>{e.end=Math.max(T,e.start+.05);chg('time');renderEdit()}},'End = playhead')),
h('label',{class:'f'},'Style',h('select',{value:e.style,onchange:ev=>{e.style=ev.target.value;chg('style');}},A.styles.map(s=>h('option',{value:s.name},s.name)))),
h('div',{class:'g2'},ni('Layer','layer'),h('label',{class:'f c'},h('input',{type:'checkbox',checked:e.type==='Comment',onchange:ev=>{e.type=ev.target.checked?'Comment':'Dialogue';chg('type')}}),'Comment')),
h('div',{class:'g3'},ni('Margin L','marginl'),ni('Margin R','marginr'),ni('Margin V','marginv')))}
function renderStyles(){const P=$('#styles');P.textContent='';ss=clamp(ss,0,A.styles.length-1);const S=A.styles[ss];
const uniq=n=>{let k=2;while(A.styles.some(s=>s.name===n+'_'+k))k++;return n+'_'+k};
const up=(k,v)=>{S[k]=v;dirty=1;commit('st'+k+ss)};
const nf=(l,k,st=1)=>{const i=h('input',{type:'number',step:st,value:S[k],oninput:()=>{if(i.value!=='')up(k,num(i.value,0))}});return h('label',{class:'f'},l,i)};
const cf=(l,k)=>{const c=a2c(S[k]),ci=h('input',{type:'color',value:hex(c),oninput:()=>{const v=ci.value,o=a2c(S[k]);up(k,c2a({...o,r:parseInt(v.slice(1,3),16),g:parseInt(v.slice(3,5),16),b:parseInt(v.slice(5,7),16)}))}}),ai=h('input',{type:'number',min:0,max:255,value:c.a,title:'Transparency 0-255',oninput:()=>up(k,c2a({...a2c(S[k]),a:clamp(num(ai.value,0),0,255)}))});return h('label',{class:'f'},l,ci,ai)};
const cb=(l,k)=>h('label',{class:'f c'},h('input',{type:'checkbox',checked:S[k]!=0,onchange:ev=>up(k,ev.target.checked?-1:0)}),l);
const ni=h('input',{value:S.name,onchange:()=>{const nm=ni.value.trim();if(!nm||A.styles.some(s=>s!==S&&s.name===nm)){ni.value=S.name;return}A.ev.forEach(e=>{if(e.style===S.name)e.style=nm});S.name=nm;commit('srn');renderStyles();renderList();renderEdit()}});
P.append(h('div',{class:'chips'},A.styles.map((x,i)=>h('button',{class:i===ss?'p':'',onclick:()=>{ss=i;renderStyles()}},x.name)),h('button',{onclick:()=>{A.styles.push({...S,name:uniq(S.name)});ss=A.styles.length-1;commit('sadd');renderStyles();renderEdit()}},'＋'),h('button',{disabled:A.styles.length<2,onclick:()=>{const o=S.name;A.styles.splice(ss,1);A.ev.forEach(e=>{if(e.style===o)e.style=A.styles[0].name});ss=0;commit('sdel');all()}},'🗑')),
h('label',{class:'f'},'Name',ni),h('div',{class:'g2'},h('label',{class:'f'},'Font',h('input',{list:'fl',value:S.fontname,oninput:ev=>up('fontname',ev.target.value)})),nf('Size','fontsize')),
cf('Fill','primarycolour'),cf('Outline','outlinecolour'),cf('Shadow','backcolour'),cf('Karaoke','secondarycolour'),
h('div',{class:'g2'},cb('Bold','bold'),cb('Italic','italic'),cb('Underline','underline'),cb('Strike','strikeout')),
h('div',{class:'g2'},nf('Outline','outline',.5),nf('Shadow','shadow',.5),nf('Scale X','scalex'),nf('Scale Y','scaley'),nf('Spacing','spacing',.5),nf('Angle','angle')),
h('label',{class:'f'},'Border',h('select',{value:S.borderstyle,onchange:ev=>up('borderstyle',+ev.target.value)},h('option',{value:1},'Outline + shadow'),h('option',{value:3},'Opaque box'))),
h('div',{class:'g2'},nf('Margin L','marginl'),nf('Margin R','marginr'),nf('Margin V','marginv')),h('h4',{},'Alignment'),
h('div',{class:'ag'},[7,8,9,4,5,6,1,2,3].map(n=>h('button',{class:S.alignment===n?'p':'',onclick:ev=>{up('alignment',n);renderStyles()}},n))))}
