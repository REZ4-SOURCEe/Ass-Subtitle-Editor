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
function del(){const e=cur();if(!e)return;const i=A.ev.indexOf(e);A.ev.splice(i,1);drafts.delete(e.id);sel=(A.ev[i]||A.ev[i-1]||{}).id||null;chg('del');renderEdit()}
function select(id){sel=id;markRows();renderEdit();const r=rows.get(id);if(r)r.scrollIntoView({block:'nearest'})}
function tab(n){document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!==n);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===n))}
function renderList(){const L=$('#list');L.textContent='';rows.clear();A.ev.forEach((e,i)=>{const r=h('div',{class:'row'+(e.type==='Comment'?' cm':''),onclick:()=>{if(sel===e.id)return tab('edit');select(e.id);seek(e.start);tlCenter(e)}},h('div',{class:'m'},`#${i+1}  ${e.style}  ${s2t(e.start)} → ${s2t(e.end)}`),h('div',{class:'t',dir:'auto'},strip(e.text)||'—'));rows.set(e.id,r);L.append(r)});markRows();if(!A.ev.length)L.append(h('div',{class:'mt'},h('p',{},'No lines yet. Import a subtitle file, or tap + to add a line at the playhead.'),h('button',{class:'p',onclick:()=>$('#fa').click()},'Import .ass')))}
const markRows=()=>rows.forEach((r,id)=>r.classList.toggle('sel',id===sel));
const TG=[{l:'Top',d:'Show at the top of the screen',t:'\\an8',pre:1},{l:'Middle',d:'Show in the middle of the screen',t:'\\an5',pre:1},{l:'Bottom',d:'Show at the bottom (default)',t:'\\an2',pre:1},
{l:'Size',d:'Font size, change the number',t:'\\fs60'},{l:'Font',d:'Font for the rest of the line',t:S=>'\\fn'+S.fontname},{l:'Color',d:'Text color (blue-green-red hex)',t:'\\c&HFFFFFF&'},{l:'Outline color',d:'Border color',t:'\\3c&H000000&'},
{l:'Outline',d:'Border thickness',t:'\\bord3'},{l:'Shadow',d:'Shadow distance',t:'\\shad2'},{l:'Blur',d:'Soften the edges',t:'\\blur2'},{l:'Fade',d:'Fade in and out, in milliseconds',t:'\\fad(200,200)'},
{l:'Move',d:'Slide from x1,y1 to x2,y2',t:'\\move(0,540,1920,540)'},{l:'Position',d:'Exact place x,y on the screen',t:'\\pos(960,540)'},{l:'Transparency',d:'00 solid, FF invisible',t:'\\alpha&H80&'},{l:'Rotate',d:'Rotate, in degrees',t:'\\frz10'},{l:'Reset',d:'Back to the style look',t:'\\r'}];
const drafts=new Map();
function renderEdit(){const P=$('#edit');P.textContent='';const src=cur();if(!src){P.append(h('div',{class:'mt'},'Select a line in the Lines tab.'));return}const e=drafts.get(src.id)||{...src};
const sb=h('button',{class:'p',onclick:()=>{Object.assign(src,e);drafts.delete(src.id);chg('save'+src.id);renderEdit();toast('Line saved')}},ico('check'),'Save line'),db=h('button',{onclick:()=>{drafts.delete(src.id);renderEdit()}},'Discard'),bar=h('div',{class:'sv'},sb,db);
const touch=()=>{dirty=1;if(JSON.stringify(e)===JSON.stringify(src))drafts.delete(src.id);else drafts.set(src.id,e);sb.disabled=db.disabled=!drafts.has(src.id)};sb.disabled=db.disabled=!drafts.has(src.id);
const ti=(k,l)=>{const i=h('input',{value:s2t(e[k]),placeholder:'0:00:00.00',onchange:()=>{const v=t2s(i.value);if(v==null){i.value=s2t(e[k]);return}e[k]=k==='start'?clamp(v,0,e.end-.05):Math.max(v,e.start+.05);i.value=s2t(e[k]);touch()}});return h('label',{class:'f'},l,i)};
const ni=(l,k)=>{const i=h('input',{type:'number',value:e[k],oninput:()=>{e[k]=parseInt(i.value)||0;touch()}});return h('label',{class:'f'},l,i)};
const style=A.styles.find(x=>x.name===e.style)||A.styles[0];
const sp=t=>{const m=t.match(/^(?:\{[^}]*\})+/);return m?{tags:m[0].slice(1,-1).replace(/\}\{/g,''),body:t.slice(m[0].length)}:{tags:'',body:t}};
const tg=sp(e.text),compose=()=>{e.text=(tg.tags?'{'+tg.tags+'}':'')+tg.body;touch()};
const ta=h('textarea',{rows:4,onfocus:()=>{if(T<src.start||T>=src.end)seek(src.start)},dir:'auto',spellcheck:'false',value:tg.body.replace(/\\N/g,'\n'),placeholder:'Subtitle text…',oninput:()=>{tg.body=ta.value.replace(/\r?\n/g,'\\N');compose()}});
const put=(s,a,b)=>{ta.setRangeText(s,a,b,'end');ta.focus();ta.dispatchEvent(new Event('input'))};
const hint=h('p',{class:'mt'},'Enter = new line. Tap a button to turn it on or off for this whole line.');
let raw=null;const reg=[],refresh=()=>{reg.forEach(f=>f());if(raw)raw.value=tg.tags},
mk=(kids,active,act,attrs)=>{const b=h('button',attrs||{},kids);b.onclick=()=>{act();compose();refresh()};reg.push(()=>b.classList.toggle('on',!!active()));return b};
const rx=k=>new RegExp('\\\\'+k+'([01])(?![0-9])'),base={b:style.bold!=0,i:style.italic!=0,u:style.underline!=0};
const eff=k=>{const m=tg.tags.match(rx(k));return m?m[1]==='1':base[k]};
const flip=k=>{const want=!eff(k);tg.tags=tg.tags.replace(new RegExp(rx(k).source,'g'),'');if(want!==base[k])tg.tags+='\\'+k+(want?'1':'0');hint.textContent=''};
const anM=()=>tg.tags.match(/\\an([1-9])/),curAn=()=>anM()?+anM()[1]:style.alignment,rowOf=a=>a>=7?0:a>=4?1:2;
const togRow=r=>{if(anM()&&rowOf(curAn())===r)tg.tags=tg.tags.replace(/\\an[1-9]/g,'');else{const an=[7,4,1][r]+(style.alignment-1)%3;tg.tags=tg.tags.replace(/\\an[1-9]/g,'');if(an!==style.alignment)tg.tags+='\\an'+an}hint.textContent=''};
const FX=[['Size','Font size (edit the number in Codes)','\\fs60',/\\fs\d[\d.]*/],['Font','Font for this line','\\fn'+style.fontname,/\\fn[^\\}]*/],['Color','Text color (blue-green-red hex)','\\c&HFFFFFF&',/\\1?c&H[0-9a-fA-F]+&/],['Outline color','Border color','\\3c&H000000&',/\\3c&H[0-9a-fA-F]+&/],['Outline','Border thickness','\\bord3',/\\bord[\d.]+/],['Shadow','Shadow distance','\\shad2',/\\shad[\d.]+/],['Blur','Soften the edges','\\blur2',/\\blur[\d.]+/],['Fade','Fade in and out, in milliseconds','\\fad(200,200)',/\\fad\([^)]*\)/],['Move','Slide from x1,y1 to x2,y2','\\move(0,540,1920,540)',/\\move\([^)]*\)/],['Position','Exact place x,y on the screen','\\pos(960,540)',/\\pos\([^)]*\)/],['Transparency','00 solid, FF invisible','\\alpha&H80&',/\\alpha&H[0-9a-fA-F]+&/],['Rotate','Rotate, in degrees','\\frz10',/\\frz-?[\d.]+/]];
const pd={onpointerdown:ev=>ev.preventDefault()};
const chips=h('div',{class:'chips tg',...pd},h('button',{title:'New line','aria-label':'New line',onclick:()=>put('\n',ta.selectionStart,ta.selectionEnd)},ico('enter')),mk('B',()=>eff('b'),()=>flip('b'),{style:'font-weight:700'}),mk('I',()=>eff('i'),()=>flip('i'),{style:'font-style:italic'}),mk('U',()=>eff('u'),()=>flip('u'),{style:'text-decoration:underline'}),['Top','Middle','Bottom'].map((l,r)=>mk(l,()=>rowOf(curAn())===r,()=>togRow(r))));
const more=h('details',{class:'mo'},h('summary',{},'More effects'),h('div',{class:'chips tg',...pd},FX.map(([l,d,t,re])=>mk(l,()=>re.test(tg.tags),()=>{if(re.test(tg.tags))tg.tags=tg.tags.replace(new RegExp(re.source,'g'),'');else tg.tags+=t;hint.textContent=l+' - '+d},{title:d}))),h('label',{class:'f'},'Codes (advanced)',raw=h('input',{value:tg.tags,spellcheck:'false',dir:'ltr',onchange:()=>{tg.tags=raw.value.replace(/[{}]/g,'').trim();compose();refresh()}})));
refresh();
P.append(ta,chips,more,hint,h('div',{class:'g2'},ti('start','Start'),ti('end','End')),h('div',{class:'g2'},h('button',{onclick:()=>{e.start=Math.min(T,e.end-.05);touch();renderEdit()}},'Start = playhead'),h('button',{onclick:()=>{e.end=Math.max(T,e.start+.05);touch();renderEdit()}},'End = playhead')),
h('label',{class:'f'},'Style',h('select',{value:e.style,onchange:ev=>{e.style=ev.target.value;touch();}},A.styles.map(s=>h('option',{value:s.name},s.name)))),
h('div',{class:'g2'},ni('Layer','layer'),h('label',{class:'f c'},h('input',{type:'checkbox',checked:e.type==='Comment',onchange:ev=>{e.type=ev.target.checked?'Comment':'Dialogue';touch()}}),'Comment')),
h('div',{class:'g3'},ni('Margin L','marginl'),ni('Margin R','marginr'),ni('Margin V','marginv')),bar)}
function renderStyles(){const P=$('#styles');P.textContent='';ss=clamp(ss,0,A.styles.length-1);const S=A.styles[ss];
const uniq=n=>{let k=2;while(A.styles.some(s=>s.name===n+'_'+k))k++;return n+'_'+k};
const up=(k,v)=>{S[k]=v;dirty=1;commit('st'+k+ss)};
const nf=(l,k,st=1)=>{const i=h('input',{type:'number',step:st,value:S[k],oninput:()=>{if(i.value!=='')up(k,num(i.value,0))}});return h('label',{class:'f'},l,i)};
const cf=(l,k)=>{const c=a2c(S[k]),ci=h('input',{type:'color',value:hex(c),oninput:()=>{const v=ci.value,o=a2c(S[k]);up(k,c2a({...o,r:parseInt(v.slice(1,3),16),g:parseInt(v.slice(3,5),16),b:parseInt(v.slice(5,7),16)}))}}),ai=h('input',{type:'number',min:0,max:255,value:c.a,title:'Transparency 0-255',placeholder:'Alpha',oninput:()=>up(k,c2a({...a2c(S[k]),a:clamp(num(ai.value,0),0,255)}))});return h('div',{class:'cc2'},h('span',{},l),h('div',{class:'cr'},ci,ai))};
const cb=(l,k)=>h('label',{class:'f c'},h('input',{type:'checkbox',checked:S[k]!=0,onchange:ev=>up(k,ev.target.checked?-1:0)}),l);
const ni=h('input',{value:S.name,onchange:()=>{const nm=ni.value.replace(/,/g,' ').trim();if(!nm||A.styles.some(s=>s!==S&&s.name===nm)){ni.value=S.name;return}A.ev.forEach(e=>{if(e.style===S.name)e.style=nm});S.name=nm;commit('srn');renderStyles();renderList();renderEdit()}});
const fontPick=()=>{const inp=h('input',{value:S.fontname,spellcheck:'false',oninput:()=>up('fontname',inp.value.replace(/,/g,''))}),list=h('div',{class:'dd'});list.hidden=true;
const item=(n,tag)=>h('button',{class:'di'+(n===S.fontname?' on':''),style:'font-family:"'+n+'",sans-serif',onclick:()=>{up('fontname',n);renderStyles()}},h('span',{},n),tag?h('small',{},tag):'');
const build=()=>{list.textContent='';const emb=F.map(x=>x.family);if(emb.length)list.append(h('div',{class:'dh'},'Embedded in this file'),...emb.map(n=>item(n,'embedded')));list.append(h('div',{class:'dh'},'Common'),...['Arial','Tahoma','Vazirmatn','Noto Naskh Arabic','Noto Sans','Impact','Georgia','Times New Roman'].filter(n=>!emb.includes(n)).map(n=>item(n)))};
const btn=h('button',{'aria-label':'Show fonts',onclick:()=>{if(list.hidden){build();list.hidden=false}else list.hidden=true}},ico('chev'));
return h('div',{class:'fp'},h('div',{class:'f fr'},'Family',h('div',{class:'fi'},inp,btn)),list)};
const sec=(t,...k)=>h('div',{class:'sec'},h('h4',{},t),...k);
const tgl=(l,k,st)=>{const b=h('button',{class:S[k]!=0?'on':'',style:st,'aria-label':l,title:l,onclick:()=>{up(k,S[k]!=0?0:-1);b.classList.toggle('on',S[k]!=0)}},l);return b};
P.append(h('div',{class:'chips'},A.styles.map((x,i)=>h('button',{class:i===ss?'p':'',onclick:()=>{ss=i;renderStyles()}},x.name)),h('button',{'aria-label':'Duplicate style',onclick:()=>{A.styles.push({...S,name:uniq(S.name)});ss=A.styles.length-1;commit('sadd');renderStyles();renderEdit()}},ico('plus')),h('button',{'aria-label':'Delete style',disabled:A.styles.length<2,onclick:()=>{const o=S.name;A.styles.splice(ss,1);A.ev.forEach(e=>{if(e.style===o)e.style=A.styles[0].name});ss=0;commit('sdel');all()}},ico('trash'))),
sec('Style name',ni),
sec('Font',fontPick(),h('div',{class:'g2'},nf('Size','fontsize'),nf('Spacing','spacing',.5)),h('div',{class:'g4 tgl'},tgl('B','bold','font-weight:700'),tgl('I','italic','font-style:italic'),tgl('U','underline','text-decoration:underline'),tgl('S','strikeout','text-decoration:line-through'))),
sec('Colors',h('div',{class:'g2'},cf('Fill','primarycolour'),cf('Outline','outlinecolour'),cf('Shadow','backcolour'),cf('Karaoke','secondarycolour'))),
sec('Outline & shadow',h('div',{class:'g2'},nf('Outline','outline',.5),nf('Shadow','shadow',.5)),h('label',{class:'f'},'Border',h('select',{value:S.borderstyle,onchange:ev=>up('borderstyle',+ev.target.value)},h('option',{value:1},'Outline + shadow'),h('option',{value:3},'Opaque box')))),
sec('Transform',h('div',{class:'g3'},nf('Scale X','scalex'),nf('Scale Y','scaley'),nf('Angle','angle'))),
sec('Position',h('div',{class:'g3'},nf('Margin L','marginl'),nf('Margin R','marginr'),nf('Margin V','marginv')),h('div',{class:'ag'},[7,8,9,4,5,6,1,2,3].map(n=>h('button',{class:S.alignment===n?'p':'',onclick:()=>{up('alignment',n);renderStyles()}},n)))),
sec('Embedded fonts',h('div',{class:'fonts'},F.length?F.map(x=>h('div',{class:'fr'},h('span',{},x.family+' · '+Math.round(x.bytes.length/1024)+' KB'),h('button',{title:'Remove font','aria-label':'Remove font',onclick:()=>removeFont(x)},ico('trash')))):h('p',{class:'mt'},'No fonts embedded yet.')),h('button',{class:'p',onclick:()=>$('#ff').click()},ico('plus'),'Add font file'),h('p',{class:'mt'},'Embedded fonts are saved inside the exported .ass file.')))}
