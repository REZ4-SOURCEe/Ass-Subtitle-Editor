/* timeline */
const TLc=$('#tlc');
function drawTL(){const c=TLc,w=c.clientWidth,hh=c.clientHeight,dpr=devicePixelRatio||1;if(!w)return;if(c.width!==Math.round(w*dpr)||c.height!==Math.round(hh*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(hh*dpr)}
const x=c.getContext('2d'),D=dur();x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,hh);span=clamp(span,2,Math.max(D,2));
if(playing&&(T<tv0||T>tv0+span*.9))tv0=T-span*.1;tv0=clamp(tv0,0,Math.max(0,D-span));const X=t=>(t-tv0)/span*w;
const pn=$('#pan');pn.max=Math.max(0,D-span);if(document.activeElement!==pn)pn.value=tv0;
x.fillStyle='#8b949e';x.strokeStyle='#30363d';x.font='9px ui-monospace,monospace';x.textAlign='left';x.textBaseline='alphabetic';
const st=[.5,1,2,5,10,15,30,60,120,300,600].find(s=>w/span*s>=50)||600;
for(let t=Math.ceil(tv0/st)*st;t<=tv0+span;t+=st){const px=X(t);x.beginPath();x.moveTo(px,0);x.lineTo(px,hh);x.stroke();x.fillText(fm(t),px+2,9)}
const vis=A.ev.filter(e=>e.end>=tv0&&e.start<=tv0+span),lanes=[],pl=vis.map(e=>{let i=lanes.findIndex(le=>e.start>=le);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=e.end;return[e,i]});
const lh=clamp((hh-16)/Math.max(lanes.length,1)-2,8,22);hits=[];
for(const[e,i]of pl){const x1=X(e.start),x2=X(e.end),y=14+i*(lh+2),bx=Math.max(0,x1),bw=Math.max(2,Math.min(w,x2)-bx);if(y+lh>hh)continue;
x.fillStyle=e.id===sel?'#388bfd':T>=e.start&&T<e.end?'#1f6feb':e.type==='Comment'?'#30363d':'#1c3a5e';x.fillRect(bx,y,bw,lh);if(e.id===sel){x.strokeStyle='#79c0ff';x.strokeRect(bx+.5,y+.5,bw-1,lh-1)}
if(bw>24){x.save();x.beginPath();x.rect(bx,y,bw,lh);x.clip();x.fillStyle='#e6edf3';x.fillText(strip(e.text),bx+4,y+lh/2+3);x.restore()}hits.push({e,x1,x2,y,h:lh})}
const cx=X(T);x.strokeStyle='#f85149';x.lineWidth=1.5;x.beginPath();x.moveTo(cx,0);x.lineTo(cx,hh);x.stroke();x.lineWidth=1}
TLc.addEventListener('pointerdown',ev=>{const r=TLc.getBoundingClientRect(),px=ev.clientX-r.left,py=ev.clientY-r.top;TLc.setPointerCapture(ev.pointerId);
const H=hits.find(q=>px>=q.x1-4&&px<=q.x2+4&&py>=q.y&&py<=q.y+q.h);
if(H){const e=H.e,w=H.x2-H.x1;select(e.id);drag={m:w<28?'m':px-H.x1<10?'s':H.x2-px<10?'e':'m',e,px,s:e.start,en:e.end,ch:0}}else{drag={m:'x'};seek(tv0+px/r.width*span)}});
TLc.addEventListener('pointermove',ev=>{if(!drag)return;const r=TLc.getBoundingClientRect(),px=ev.clientX-r.left;if(drag.m==='x')return seek(tv0+px/r.width*span);
const e=drag.e,dt=(px-drag.px)/r.width*span;drag.ch=1;if(drag.m==='s')e.start=clamp(drag.s+dt,0,e.end-.05);else if(drag.m==='e')e.end=Math.max(e.start+.05,drag.en+dt);else{e.start=Math.max(0,drag.s+dt);e.end=e.start+drag.en-drag.s}dirty=1});
const tlEnd=()=>{if(drag&&drag.ch){chg('tl');renderEdit()}drag=null};TLc.addEventListener('pointerup',tlEnd);TLc.addEventListener('pointercancel',tlEnd);
TLc.addEventListener('wheel',ev=>{ev.preventDefault();tv0+=(ev.deltaX||ev.deltaY)/TLc.clientWidth*span;dirty=1},{passive:false});
const zoom=k=>{span=clamp(span*k,2,Math.max(dur(),2));tv0=T-span/2;dirty=1};$('#zi').onclick=()=>zoom(1/1.5);$('#zo').onclick=()=>zoom(1.5);$('#pan').oninput=ev=>{tv0=+ev.target.value;dirty=1};
