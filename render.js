/* tag parser + renderer */
const TR=/\\(pos|move|fade?|i?clip|org|an|alpha|[1-4]a|bord|shad|blur|be|fscx|fscy|fsp|fn|fs|frz|fr|[1-4]c|c|b|i|u|s|r|p|kf|ko|k|K|q|a)(\([^)]*\)|[^\\]*)/g,RT=/[\u0590-\u08FF\uFB1D-\uFEFF]/;
function pt(text){const ov={},lines=[[]];let o={};
for(const part of text.split(/(\{[^}]*\})/)){if(part[0]==='{'&&part.endsWith('}')){const b=part.slice(1,-1).replace(/\\t\((?:[^()]|\([^)]*\))*\)/g,'');let m;TR.lastIndex=0;
while((m=TR.exec(b))){const n=m[1],a=m[2],f=parseFloat(a),ar=()=>a.slice(1,-1).split(',').map(Number);
switch(n){case'pos':{const p=ar();if(p.length>1)ov.pos=p}break;case'move':{const p=ar();if(p.length>=4)ov.move=p}break;case'fad':case'fade':{const p=ar();if(p.length===2)ov.fad=p}break;case'an':ov.an=f;break;case'frz':case'fr':ov.frz=f;break;
case'fs':o.fs=f;break;case'fn':o.fn=a;break;case'b':o.b=a!=='0';break;case'i':o.i=a!=='0';break;case'u':o.u=a!=='0';break;case's':o.s=a!=='0';break;case'c':case'1c':o.c=a2c(a);break;case'3c':o.oc=a2c(a);break;case'4c':o.bc=a2c(a);break;case'bord':o.bord=f;break;case'shad':o.shad=f;break;case'blur':case'be':o.blur=f;break;case'alpha':o.al=(parseInt(a.replace(/[^0-9a-f]/gi,''),16)||0)/255;break;case'fsp':o.sp=f;break;case'p':o.p=f;break;case'r':o={};break}}continue}
part.split(/\\N|\\n/).forEach((s,i)=>{if(i)lines.push([]);s=s.replace(/\\h/g,'\u00a0');if(s)lines[lines.length-1].push({t:s,o:{...o}})})}
return{lines,ov}}
const cvs=$('#cv'),vb=$('#vb');
function fit(){const W=vb.clientWidth,H=vb.clientHeight,ar=hasVideo&&V.videoWidth?V.videoWidth/V.videoHeight:(num(gi('PlayResX'),1920)/num(gi('PlayResY'),1080)||16/9);let w=W,hh=W/ar;if(hh>H){hh=H;w=H*ar}return{w:Math.round(w),h:Math.round(hh),l:Math.round((W-w)/2),t:Math.round((H-hh)/2)}}
let lastKey='';const PC=new Map(),pc=t=>{let r=PC.get(t);if(!r){if(PC.size>500)PC.clear();r=pt(t);PC.set(t,r)}return r};
function drawSubs(force){const f=fit(),dpr=devicePixelRatio||1;if(cvs._w!==f.w||cvs._h!==f.h||cvs._d!==dpr){force=1;cvs._w=f.w;cvs._h=f.h;cvs._d=dpr;cvs.width=f.w*dpr;cvs.height=f.h*dpr;for(const el of[cvs,V])Object.assign(el.style,{left:f.l+'px',top:f.t+'px',width:f.w+'px',height:f.h+'px'})}
const x=cvs.getContext('2d'),LS='letterSpacing'in x;x.setTransform(dpr,0,0,dpr,0,0);const act=A.ev.filter(e=>e.type==='Dialogue'&&T>=e.start&&T<e.end).sort((a,b)=>a.layer-b.layer),key=act.map(e=>e.id+e.text).join('|')+f.w;
if(!force&&key===lastKey&&!act.some(e=>/\\(move|fad)/.test(e.text)))return;lastKey=key;x.clearRect(0,0,f.w,f.h);
const sx=f.w/(num(gi('PlayResX'),1920)||1920),sy=f.h/(num(gi('PlayResY'),1080)||1080),placed=[];
for(const e of act){const S=A.styles.find(s=>s.name===e.style)||A.styles[0],{lines,ov}=pc(e.text);
const L=lines.map(l=>{let w=0,lh=S.fontsize*sy*1.2;const rs=[];for(const r of l){const o=r.o;if(o.p>0)continue;const fs=(o.fs??S.fontsize)*sy,sp=(o.sp??S.spacing)*sx,font=`${(o.i??(S.italic!=0))?'italic ':''}${(o.b??(S.bold!=0))?700:400} ${fs}px "${o.fn||S.fontname}",Vazirmatn,Tahoma,"Noto Sans",Arial,sans-serif`;x.font=font;if(LS)x.letterSpacing=sp+'px';const rw=x.measureText(r.t).width;rs.push({t:r.t,o,fs,sp,font,w:rw});w+=rw;lh=Math.max(lh,fs*1.2)}return{rs,w,lh,rtl:RT.test(l.map(r=>r.t).join(''))}});
if(!L.some(l=>l.rs.length))continue;const H=L.reduce((s,l)=>s+l.lh,0),an=ov.an||S.alignment,col=(an-1)%3,row=an<=3?2:an<=6?1:0;
const mL=(e.marginl||S.marginl)*sx,mR=(e.marginr||S.marginr)*sx,mV=(e.marginv||S.marginv)*sy;let p=ov.pos;
if(!p&&ov.move){const m=ov.move,d=(e.end-e.start)*1000,t1=m[4]??0,t2=m[5]??d,k=t2>t1?clamp(((T-e.start)*1000-t1)/(t2-t1),0,1):1;p=[m[0]+(m[2]-m[0])*k,m[1]+(m[3]-m[1])*k]}
const ax=p?p[0]*sx:col===0?mL:col===1?(mL+f.w-mR)/2:f.w-mR,ay=p?p[1]*sy:0;
let top=p?(row===2?ay-H:row===1?ay-H/2:ay):row===2?f.h-mV-H:row===1?(f.h-H)/2:mV;
if(!p){for(let n=0;n<20;n++){const q=placed.find(q=>q.row===row&&top<q.b-1&&top+H>q.t+1);if(!q)break;top=row===2?q.t-H:q.b}placed.push({row,t:top,b:top+H})}
let al=1;if(ov.fad){const[a,b]=ov.fad,el=(T-e.start)*1000,re=(e.end-T)*1000;if(a>0&&el<a)al=el/a;if(b>0&&re<b)al=Math.min(al,re/b)}
x.save();if(ov.frz){const oy=top+H/2;x.translate(ax,oy);x.rotate(-ov.frz*Math.PI/180);x.translate(-ax,-oy)}
let y=top;for(const l of L){const lx=col===0?ax:col===1?ax-l.w/2:ax-l.w,order=l.rtl?[...l.rs].reverse():l.rs;
for(const pass of[0,1,2]){let cx=lx;for(const r of order){const o=r.o,ol=(o.bord??S.outline)*sy,sh=(o.shad??S.shadow)*sy;x.font=r.font;if(LS)x.letterSpacing=r.sp+'px';x.direction=l.rtl?'rtl':'ltr';x.textAlign='left';x.textBaseline='top';x.globalAlpha=clamp(al*(1-(o.al||0)),0,1);x.filter=o.blur?`blur(${o.blur*sy}px)`:'none';x.lineJoin='round';
if(pass===0&&sh>0){const c=css(o.bc||a2c(S.backcolour));x.fillStyle=c;x.strokeStyle=c;x.lineWidth=ol*2;if(ol>0)x.strokeText(r.t,cx+sh,y+sh);x.fillText(r.t,cx+sh,y+sh)}
if(pass===1&&ol>0){x.strokeStyle=css(o.oc||a2c(S.outlinecolour));x.lineWidth=ol*2;x.strokeText(r.t,cx,y)}
if(pass===2){x.fillStyle=css(o.c||a2c(S.primarycolour));x.fillText(r.t,cx,y);if(o.u??(S.underline!=0))x.fillRect(cx,y+r.fs*1.05,r.w,Math.max(1,r.fs/18));if(o.s??(S.strikeout!=0))x.fillRect(cx,y+r.fs*.55,r.w,Math.max(1,r.fs/18))}
cx+=r.w}}y+=l.lh}
x.restore();x.globalAlpha=1;x.filter='none';if(LS)x.letterSpacing='0px'}}
