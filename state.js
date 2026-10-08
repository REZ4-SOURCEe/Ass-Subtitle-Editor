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
const sb=h('button',{class:'p',onclick:()=>{Object.assign(src,e);drafts.delete(src.id);chg('save'+src.id);renderEdit();toast('Line saved')}},ico('check'),'Save line'),db=h('button',{onclick:()=>{drafts.delete(src.id);dirty=1;tab('pl');const r=rows.get(src.id);if(r)r.scrollIntoView({block:'center'})}},'Cancel'),bar=h('div',{class:'sv'},sb,db);
const touch=()=>{dirty=1;if(JSON.stringify(e)===JSON.stringify(src))drafts.delete(src.id);else drafts.set(src.id,e);sb.disabled=!drafts.has(src.id)};sb.disabled=!drafts.has(src.id);
const ti=(k,l)=>{const i=h('input',{value:s2t(e[k]),placeholder:'0:00:00.00',onchange:()=>{const v=t2s(i.value);if(v==null){i.value=s2t(e[k]);return}e[k]=k==='start'?clamp(v,0,e.end-.05):Math.max(v,e.start+.05);i.value=s2t(e[k]);touch()}});return h('label',{class:'f'},l,i)};
const ni=(l,k)=>{const i=h('input',{type:'number',value:e[k],oninput:()=>{e[k]=parseInt(i.value)||0;touch()}});return h('label',{class:'f'},l,i)};
const style=A.styles.find(x=>x.name===e.style)||A.styles[0];
const sp=t=>{const m=t.match(/^(?:\{[^}]*\})+/);return m?{tags:m[0].slice(1,-1).replace(/\}\{/g,''),body:t.slice(m[0].length)}:{tags:'',body:t}};
const tg=sp(e.text),compose=()=>{e.text=(tg.tags?'{'+tg.tags+'}':'')+tg.body;touch()};
const ta=h('textarea',{rows:2,onfocus:()=>{if(T<src.start||T>=src.end)seek(src.start)},dir:'auto',spellcheck:'false',value:tg.body.replace(/\\N/g,'\n'),placeholder:'Subtitle text…',oninput:()=>{tg.body=ta.value.replace(/\r?\n/g,'\\N');compose();fit()}});const fit=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight+2,140)+'px'};
const put=(s,a,b)=>{ta.setRangeText(s,a,b,'end');ta.focus();ta.dispatchEvent(new Event('input'))};
const hint=h('p',{class:'mt hn'},'Enter = new line. Tap a button to turn it on or off for this whole line.');
let raw=null;const reg=[],refresh=()=>{reg.forEach(f=>f());if(raw)raw.value=tg.tags},
mk=(kids,active,act,attrs)=>{const b=h('button',attrs||{},kids);b.onclick=()=>{act();compose();refresh()};reg.push(()=>b.classList.toggle('on',!!active()));return b};
const rx=k=>new RegExp('\\\\'+k+'([01])(?![0-9])'),base={b:style.bold!=0,i:style.italic!=0,u:style.underline!=0};
const eff=k=>{const m=tg.tags.match(rx(k));return m?m[1]==='1':base[k]};
const flip=k=>{const want=!eff(k);tg.tags=tg.tags.replace(new RegExp(rx(k).source,'g'),'');if(want!==base[k])tg.tags+='\\'+k+(want?'1':'0');hint.textContent=''};
const anM=()=>tg.tags.match(/\\an([1-9])/),curAn=()=>anM()?+anM()[1]:style.alignment,rowOf=a=>a>=7?0:a>=4?1:2;
const togRow=r=>{if(anM()&&rowOf(curAn())===r)tg.tags=tg.tags.replace(/\\an[1-9]/g,'');else{const an=[7,4,1][r]+(style.alignment-1)%3;tg.tags=tg.tags.replace(/\\an[1-9]/g,'');if(an!==style.alignment)tg.tags+='\\an'+an}hint.textContent=''};
const px=num(gi('PlayResX'),1920),py=num(gi('PlayResY'),1080),c6=s=>{const m=String(s||'').match(/&H([0-9a-f]+)&?$/i);return m?m[1].padStart(6,'0').slice(-6):'FFFFFF'},c2h=s=>{const v=c6(s);return '#'+v.slice(4,6)+v.slice(2,4)+v.slice(0,2)},h2c=x=>'&H'+(x.slice(5,7)+x.slice(3,5)+x.slice(1,3)).toUpperCase()+'&',nums=m=>m.match(/-?[\d.]+/g)||[],N=(n,d,st)=>({n,t:'number',d,st:st||1});
const FX=[
{l:'Size',re:/\\fs\d[\d.]*/,f:[N('Font size',style.fontsize)],b:v=>'\\fs'+v[0],r:m=>[m.slice(3)]},
{l:'Font',re:/\\fn[^\\}]*/,f:[{n:'Font name',t:'text',d:style.fontname}],b:v=>'\\fn'+String(v[0]).replace(/[\\{}]/g,''),r:m=>[m.slice(3)]},
{l:'Color',re:/\\1?c&H[0-9a-fA-F]+&/,f:[{n:'Text color',t:'color',d:c2h(style.primarycolour)}],b:v=>'\\c'+h2c(v[0]),r:m=>[c2h(m)]},
{l:'Outline color',re:/\\3c&H[0-9a-fA-F]+&/,f:[{n:'Border color',t:'color',d:c2h(style.outlinecolour)}],b:v=>'\\3c'+h2c(v[0]),r:m=>[c2h(m)]},
{l:'Outline',re:/\\bord[\d.]+/,f:[N('Border thickness',style.outline,.5)],b:v=>'\\bord'+v[0],r:m=>[m.slice(5)]},
{l:'Shadow',re:/\\shad[\d.]+/,f:[N('Shadow distance',style.shadow,.5)],b:v=>'\\shad'+v[0],r:m=>[m.slice(5)]},
{l:'Blur',re:/\\blur[\d.]+/,f:[N('Blur amount',2,.5)],b:v=>'\\blur'+v[0],r:m=>[m.slice(5)]},
{l:'Fade',re:/\\fad\([^)]*\)/,f:[N('Fade in (ms)',200,50),N('Fade out (ms)',200,50)],b:v=>'\\fad('+v[0]+','+v[1]+')',r:nums},
{l:'Move',re:/\\move\([^)]*\)/,f:[N('From X',Math.round(px/2)),N('From Y',Math.round(py*.85)),N('To X',Math.round(px/2)),N('To Y',Math.round(py*.7))],b:v=>'\\move('+v.join(',')+')',r:nums},
{l:'Position',re:/\\pos\([^)]*\)/,f:[N('X',Math.round(px/2)),N('Y',Math.round(py*.85))],b:v=>'\\pos('+v.join(',')+')',r:nums},
{l:'Transparency',re:/\\alpha&H[0-9a-fA-F]+&/,f:[N('Transparency %',50,5)],b:v=>'\\alpha&H'+Math.round(clamp(+v[0]||0,0,100)*2.55).toString(16).toUpperCase().padStart(2,'0')+'&',r:m=>[Math.round(parseInt(m.match(/&H([0-9a-f]+)/i)[1],16)/2.55)]},
{l:'Rotate',re:/\\frz-?[\d.]+/,f:[N('Angle (degrees)',10)],b:v=>'\\frz'+v[0],r:m=>[m.slice(4)]}];
const pd={onpointerdown:ev=>ev.preventDefault()};
const chips=h('div',{class:'chips tg',...pd},h('button',{title:'New line','aria-label':'New line',onclick:()=>put('\n',ta.selectionStart,ta.selectionEnd)},ico('enter')),mk('B',()=>eff('b'),()=>flip('b'),{style:'font-weight:700'}),mk('I',()=>eff('i'),()=>flip('i'),{style:'font-style:italic'}),mk('U',()=>eff('u'),()=>flip('u'),{style:'text-decoration:underline'}),['Top','Middle','Bottom'].map((l,r)=>mk(l,()=>rowOf(curAn())===r,()=>togRow(r))));
const fxp=h('div',{class:'fxp'});fxp.hidden=true;
const closeP=()=>{fxp.hidden=true;fxp.textContent=''},delFx=F=>{tg.tags=tg.tags.replace(new RegExp(F.re.source,'g'),'');compose();refresh()},setFx=(F,v)=>{tg.tags=tg.tags.replace(new RegExp(F.re.source,'g'),'')+F.b(v);compose();refresh()};
const openFx=F=>{const m=tg.tags.match(F.re),cur=m?F.r(m[0]):F.f.map(x=>x.d);if(!m)setFx(F,cur);fxp.hidden=false;fxp.textContent='';
const inps=F.f.map((x,i)=>{if(x.t==='text')return h('div',{class:'f'},x.n,fontField(cur[i],v=>{cur[i]=v;if(v!=='')setFx(F,cur)}));if(x.t==='color')return h('div',{class:'f cpw'},x.n,colorPicker(cur[i],v=>{cur[i]=v;setFx(F,cur)}));const inp=h('input',{type:x.t==='color'?'color':x.t==='text'?'text':'number',value:cur[i],oninput:()=>{if(inp.value==='')return;cur[i]=inp.value;setFx(F,cur)}});if(x.t==='number')inp.step=x.st;if(x.t==='text')inp.setAttribute('list','fl');return h('label',{class:'f'},x.n,inp)});
fxp.append(h('div',{class:'fxh'},F.l),h('div',{class:F.f.length>1?'g2':'g1'},...inps),h('div',{class:'g2'},h('button',{class:'p',onclick:closeP},'OK'),h('button',{onclick:()=>{delFx(F);closeP()}},'Remove')))};
raw=h('input',{value:tg.tags,spellcheck:'false',dir:'ltr',onchange:()=>{tg.tags=raw.value.replace(/[{}]/g,'').trim();compose();refresh()}});
const openRaw=()=>{fxp.hidden=false;fxp.textContent='';raw.value=tg.tags;fxp.append(h('div',{class:'fxh'},'Advanced codes'),h('label',{class:'f'},'Codes',raw),h('div',{class:'g1'},h('button',{class:'p',onclick:closeP},'OK')))};
const more=h('details',{class:'mo'},h('summary',{},'More effects'),h('div',{class:'chips efx tg',...pd},FX.map(F=>mk(F.l,()=>F.re.test(tg.tags),()=>openFx(F))),h('button',{onclick:openRaw},'Codes')),fxp);
refresh();
const sc=(t,...k)=>h('div',{class:'sec'},h('h4',{},t),...k);
P.append(sc('Text',ta,chips,more,hint),
sc('Timing',h('div',{class:'g2'},ti('start','Start'),ti('end','End'))),
sc('Line style',h('label',{class:'f'},'Style',h('select',{value:e.style,onchange:ev=>{e.style=ev.target.value;touch();}},A.styles.map(s=>h('option',{value:s.name},s.name)))),
h('div',{class:'g2'},ni('Layer','layer'),h('label',{class:'f c'},h('input',{type:'checkbox',checked:e.type==='Comment',onchange:ev=>{e.type=ev.target.checked?'Comment':'Dialogue';touch()}}),'Comment'))),
sc('Margins',h('div',{class:'g3'},ni('Margin L','marginl'),ni('Margin R','marginr'),ni('Margin V','marginv'))),bar);requestAnimationFrame(fit)}
function renderStyles(){const P=$('#styles');P.textContent='';ss=clamp(ss,0,A.styles.length-1);const S=A.styles[ss];
const uniq=n=>{let k=2;while(A.styles.some(s=>s.name===n+'_'+k))k++;return n+'_'+k};
const up=(k,v)=>{S[k]=v;dirty=1;commit('st'+k+ss)};
const nf=(l,k,st=1)=>{const i=h('input',{type:'number',step:st,value:S[k],oninput:()=>{if(i.value!=='')up(k,num(i.value,0))}});return h('label',{class:'f'},l,i)};
const cf=(l,k)=>{const c=a2c(S[k]),ci=h('button',{class:'cpsw','aria-label':l+' color',onclick:()=>{openColorSheet(l,hex(a2c(S[k])),v=>{const o=a2c(S[k]);up(k,c2a({...o,r:parseInt(v.slice(1,3),16),g:parseInt(v.slice(3,5),16),b:parseInt(v.slice(5,7),16)}));ci.style.background=v})}});ci.style.background=hex(c);const ai=h('input',{type:'number',min:0,max:255,value:c.a,title:'Transparency 0-255',placeholder:'Alpha',oninput:()=>up(k,c2a({...a2c(S[k]),a:clamp(num(ai.value,0),0,255)}))});return h('div',{class:'cc2'},h('span',{},l),h('div',{class:'cr'},ci,ai))};
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
sec('Embedded fonts',h('div',{class:'fonts'},F.length?F.map(x=>h('div',{class:'fr'},h('span',{},x.family+' · '+Math.round(x.bytes.length/1024)+' KB'),h('button',{title:'Remove font','aria-label':'Remove font',onclick:()=>removeFont(x)},ico('trash')))):h('p',{class:'mt hn'},'No fonts embedded yet.')),h('button',{class:'p',onclick:()=>$('#ff').click()},ico('plus'),'Add font file'),h('p',{class:'mt hn'},'Embedded fonts are saved inside the exported .ass file.')))}

function colorPicker(hex,on){
const rgb2hsv=(r,g,b)=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let q=0;if(d){q=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;q*=60;if(q<0)q+=360}return[q,M?d/M:0,M]},
hsv2hex=(q,s,v)=>{const f=n=>{const k=(n+q/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return'#'+[f(5),f(3),f(1)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('').toUpperCase()},
fromHex=x=>{const m=/^#?([0-9a-f]{6})$/i.exec(String(x).trim());return m?rgb2hsv(parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)):null};
let[H,S,V]=fromHex(hex)||[0,0,1];
const sw=h('div',{class:'cpv'}),hx=h('input',{class:'cph',maxlength:8,spellcheck:'false',dir:'ltr'}),
rg=(mx,l)=>{const r=h('input',{type:'range',class:'cps'});r.min=0;r.max=mx;r.step=1;return[r,h('div',{class:'cpl'},l,r)]},
[hs,hr]=rg(360,'Hue'),[ss,sr]=rg(100,'Saturation'),[vs,vr]=rg(100,'Brightness'),
PR=['#FFFFFF','#000000','#FF0000','#FF8800','#FFFF00','#00FF00','#00FFFF','#0000FF','#8800FF','#FF00FF','#FFC0CB','#888888'],
pb=PR.map(c=>{const b=h('button',{class:'cpp',title:c,'aria-label':c,onclick:()=>{[H,S,V]=fromHex(c);paint(true)}});b.style.background=c;return b});
function paint(emit){const c=hsv2hex(H,S,V);sw.style.background=c;if(document.activeElement!==hx)hx.value=c;hs.value=H;ss.value=Math.round(S*100);vs.value=Math.round(V*100);
hs.style.background='linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)';ss.style.background=`linear-gradient(90deg,${hsv2hex(H,0,V)},${hsv2hex(H,1,V)})`;vs.style.background=`linear-gradient(90deg,#000,${hsv2hex(H,S,1)})`;
pb.forEach((b,i)=>b.classList.toggle('on',PR[i]===c));if(emit)on(c)}
hs.oninput=()=>{H=+hs.value;paint(true)};ss.oninput=()=>{S=ss.value/100;paint(true)};vs.oninput=()=>{V=vs.value/100;paint(true)};
hx.onchange=()=>{const v=fromHex(hx.value);if(v){[H,S,V]=v;hx.blur();paint(true)}else{hx.blur();paint(false)}};
paint(false);
return h('div',{class:'cp'},h('div',{class:'cpt'},sw,hx),hr,sr,vr,h('div',{class:'cpg'},...pb))}

function fontField(val,on){
const inp=h('input',{value:val,spellcheck:'false',oninput:()=>on(inp.value.replace(/[,{}\\]/g,''))}),list=h('div',{class:'dd'});list.hidden=true;
const item=(n,tag)=>h('button',{class:'di'+(n===inp.value?' on':''),style:'font-family:"'+n+'",sans-serif',onclick:()=>{inp.value=n;on(n);list.hidden=true}},h('span',{},n),tag?h('small',{},tag):'');
const build=()=>{list.textContent='';const emb=F.map(x=>x.family);if(emb.length)list.append(h('div',{class:'dh'},'Embedded in this file'),...emb.map(n=>item(n,'embedded')));list.append(h('div',{class:'dh'},'Common'),...['Arial','Tahoma','Vazirmatn','Noto Naskh Arabic','Noto Sans','Impact','Georgia','Times New Roman'].filter(n=>!emb.includes(n)).map(n=>item(n)))};
const btn=h('button',{'aria-label':'Show fonts',onclick:()=>{if(list.hidden){build();list.hidden=false}else list.hidden=true}},ico('chev'));
return h('div',{class:'fp'},h('div',{class:'fi'},inp,btn),list)}

function openColorSheet(title,hexv,on){
const ov=h('div',{class:'cpm'}),close=()=>ov.remove();
ov.append(h('div',{class:'cpc'},h('h3',{},title),colorPicker(hexv,on),h('button',{class:'p',onclick:close},'OK')));
ov.onclick=ev=>{if(ev.target===ov)close()};document.body.append(ov)}
