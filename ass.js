/* model */
const SH='Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding'.split(','),SK=SH.map(s=>s.toLowerCase());
const DS={name:'Default',fontname:'Arial',fontsize:48,primarycolour:'&H00FFFFFF',secondarycolour:'&H000000FF',outlinecolour:'&H00000000',backcolour:'&H80000000',bold:0,italic:0,underline:0,strikeout:0,scalex:100,scaley:100,spacing:0,angle:0,borderstyle:1,outline:2,shadow:1,alignment:2,marginl:10,marginr:10,marginv:10,encoding:1};
const STR=new Set(['name','fontname','primarycolour','secondarycolour','outlinecolour','backcolour']);
const newA=()=>({info:['Title: Untitled','ScriptType: v4.00+','WrapStyle: 0','ScaledBorderAndShadow: yes','PlayResX: 1920','PlayResY: 1080','YCbCr Matrix: TV.709'],styles:[{...DS}],ev:[],extra:[]});
function parse(t){const R={info:[],styles:[],ev:[],extra:[]};let sec='',sf=SK,ef='layer,start,end,style,name,marginl,marginr,marginv,effect,text'.split(',');
for(const raw of t.replace(/^\uFEFF/,'').split(/\r\n|\r|\n/)){const l=raw.trim();if(!l)continue;const m=l.match(/^\[(.+)\]$/);
if(m){sec=m[1].toLowerCase();if(!/^(script info|v4\+? styles|events)$/.test(sec))R.extra.push({n:m[1],l:[]});continue}
if(sec==='script info')R.info.push(l);
else if(/^v4\+? styles$/.test(sec)){if(/^format:/i.test(l))sf=l.slice(7).split(',').map(s=>s.trim().toLowerCase());else if(/^style:/i.test(l)){const v=l.slice(6).split(',').map(s=>s.trim()),S={...DS};sf.forEach((k,i)=>{if(k in DS&&i<v.length)S[k]=STR.has(k)?v[i]:num(v[i],DS[k])});R.styles.push(S)}}
else if(sec==='events'){if(/^format:/i.test(l))ef=l.slice(7).split(',').map(s=>s.trim().toLowerCase());else{const mm=l.match(/^(Dialogue|Comment):\s?(.*)$/i);if(mm){const p=[];let r=mm[2];for(let i=0;i<ef.length-1;i++){const j=r.indexOf(',');if(j<0)break;p.push(r.slice(0,j));r=r.slice(j+1)}p.push(r);
const E={id:gid(),type:/^c/i.test(mm[1])?'Comment':'Dialogue',layer:0,start:0,end:0,style:'Default',name:'',marginl:0,marginr:0,marginv:0,effect:'',text:''};
ef.forEach((k,i)=>{if(i>=p.length)return;const v=p[i];if(k==='start'||k==='end')E[k]=t2s(v)||0;else if(k==='layer'||k.startsWith('margin'))E[k]=parseInt(v)||0;else if(k in E&&k!=='id'&&k!=='type')E[k]=k==='text'?v:v.trim()});R.ev.push(E)}}}
else if(R.extra.length)R.extra[R.extra.length-1].l.push(l)}
if(!R.styles.length)R.styles.push({...DS});if(!R.info.some(l=>/^playresx:/i.test(l)))R.info.push('PlayResX: 1920','PlayResY: 1080');R.ev.sort((a,b)=>a.start-b.start);return R}
const p4=n=>String(n).padStart(4,'0');
const ser=A=>{const L=['[Script Info]',...A.info.map(l=>/^scripttype:/i.test(l)?'ScriptType: v4.00+':l),'','[V4+ Styles]','Format: '+SH.join(', '),...A.styles.map(S=>'Style: '+SK.map(k=>S[k]).join(',')),'','[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',...A.ev.map(e=>`${e.type}: ${e.layer},${s2t(e.start)},${s2t(e.end)},${e.style},${e.name},${p4(e.marginl)},${p4(e.marginr)},${p4(e.marginv)},${e.effect},${e.text}`)];for(const x of A.extra)L.push('','['+x.n+']',...x.l);L.push('');return L.join('\r\n')};
