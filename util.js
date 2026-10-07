'use strict';
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.min(Math.max(v,a),b),num=(v,d)=>{const n=parseFloat(v);return isNaN(n)?d:n};
function h(t,a,...c){const e=document.createElement(t);let val;for(const k in a||{}){const v=a[k];if(k==='class')e.className=v;else if(k==='value')val=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else if(v===true)e.setAttribute(k,'');else if(v!==false&&v!=null)e.setAttribute(k,v)}for(const x of c.flat())if(x!=null&&x!==false)e.append(x);if(val!==undefined)e.value=val;return e}
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.opacity=0,2800)};
let _i=0;const gid=()=>'e'+Date.now().toString(36)+(++_i);
/* time & colour */
const s2t=s=>{let c=Math.round(Math.max(0,s||0)*100);const cs=c%100;c=(c-cs)/100;const ss=c%60;c=(c-ss)/60;const m=c%60,hh=(c-m)/60,p=n=>String(n).padStart(2,'0');return hh+':'+p(m)+':'+p(ss)+'.'+p(cs)};
const t2s=t=>{t=String(t).trim();let m=t.match(/^(?:(\d+):)?(\d+):(\d+)(?:[.,](\d{1,3}))?$/);if(m)return(+m[1]||0)*3600+m[2]*60+ +m[3]+(m[4]?parseFloat('0.'+m[4]):0);return/^\d+(\.\d+)?$/.test(t)?parseFloat(t):null};
const fm=t=>Math.floor(t/60)+':'+(t%60).toFixed(2).padStart(5,'0');
const a2c=s=>{const n=parseInt(String(s).replace(/[^0-9a-f]/gi,'')||'0',16)>>>0;return{a:n>>>24,b:n>>>16&255,g:n>>>8&255,r:n&255}};
const x2=n=>Math.round(n).toString(16).padStart(2,'0').toUpperCase(),c2a=c=>'&H'+x2(c.a)+x2(c.b)+x2(c.g)+x2(c.r);
const css=c=>`rgba(${c.r},${c.g},${c.b},${(1-c.a/255).toFixed(3)})`,hex=c=>('#'+x2(c.r)+x2(c.g)+x2(c.b)).toLowerCase();
