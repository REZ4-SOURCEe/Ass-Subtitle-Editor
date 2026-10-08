/* SRT/VTT <-> ASS conversion, RTL marks, period cleanup */
const MK=/[\u202A-\u202E\u200E\u200F]/g;
function fixLine(s,o){const m=s.match(/^((?:\{[^}]*\})*)([\s\S]*)$/);let pre=m[1],b=m[2];
if(o.nodot){b=b.replace(/^\s*\.(?!\.)\s*/,'').replace(/(?<!\.)\.(?=\s*(?:\{[^}]*\})*$)/,'').replace(/\s+((?:\{[^}]*\})*)$/,'$1')}
if(b.trim()){if(o.dir==='rtl')b='\u202B'+b+'\u202C';else if(o.dir==='ltr')b='\u202A'+b+'\u202C'}
return pre+b}
function xf(t,o){if(!o||(!o.nodot&&o.dir!=='rtl'&&o.dir!=='ltr'))return t;if(o.dir==='rtl'||o.dir==='ltr')t=t.replace(MK,'');return t.split('\\N').map(l=>fixLine(l,o)).join('\\N')}
const h2a=l=>l.replace(/<\s*(\/?)\s*([ibus])\s*>/gi,(_,c,k)=>'{\\'+k.toLowerCase()+(c?'0':'1')+'}').replace(/<font[^>]*color\s*=\s*["']?#?([0-9a-f]{6})["']?[^>]*>/gi,(_,h)=>'{\\c&H'+h.slice(4,6)+h.slice(2,4)+h.slice(0,2)+'&}').replace(/<\/font>/gi,'{\\c}').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,'\\h').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function parseSrt(t,name){const R=newA();R.styles=[{...DS}];R.info[0]='Title: '+(name||'Untitled');
const re=/^(?:(\d+):)?(\d+):(\d+)[,.](\d{1,3})\s*-->\s*(?:(\d+):)?(\d+):(\d+)[,.](\d{1,3})/,tc=(h,m,s,ms)=>(+h||0)*3600+(+m)*60+(+s)+(+((ms+'00').slice(0,3)))/1000;let rt=0;
for(const blk of t.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split(/\n{2,}/)){const L=blk.split('\n'),i=L.findIndex(l=>re.test(l.trim()));if(i<0)continue;const m=L[i].trim().match(re),txt=L.slice(i+1).filter(l=>l.trim()).map(l=>h2a(l.trim())).join('\\N');if(!txt)continue;if(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(txt))rt++;
R.ev.push({id:gid(),type:'Dialogue',layer:0,start:tc(m[1],m[2],m[3],m[4]),end:tc(m[5],m[6],m[7],m[8]),style:'Default',name:'',marginl:0,marginr:0,marginv:0,effect:'',text:txt})}
R.ev.sort((a,b)=>a.start-b.start);if(R.ev.length&&rt>R.ev.length*.3)R.styles[0].fontname=F.length?F[0].family:'Tahoma';return R}
function serSrt(A,o){const p=(n,l=2)=>String(n).padStart(l,'0'),tc=x=>{const ms=Math.round(Math.max(0,x)*1000);return p(Math.floor(ms/3600000))+':'+p(Math.floor(ms/60000)%60)+':'+p(Math.floor(ms/1000)%60)+','+p(ms%1000,3)};
const ev=A.ev.filter(e=>e.type==='Dialogue'&&String(e.text).replace(/\{[^}]*\}/g,'').trim()).slice().sort((a,b)=>a.start-b.start);
return '\uFEFF'+ev.map((e,i)=>{const open={};let t=xf(String(e.text).replace(/\r?\n/g,'\\N'),o);
t=t.replace(/\{([^}]*)\}/g,(_,b)=>{let r='';for(const m of b.matchAll(/\\([ibu])([01])(?![0-9])/g)){if(m[2]==='1'){if(!open[m[1]]){open[m[1]]=1;r+='<'+m[1]+'>'}}else if(open[m[1]]){open[m[1]]=0;r+='</'+m[1]+'>'}}return r});
for(const k in open)if(open[k])t+='</'+k+'>';t=t.replace(/\\[Nn]/g,'\n').replace(/\\h/g,' ').split('\n').filter(l=>l.trim()).join('\n');
return (i+1)+'\n'+tc(e.start)+' --> '+tc(e.end)+'\n'+t}).join('\n\n')+'\n'}
