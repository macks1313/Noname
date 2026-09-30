const $=s=>document.querySelector(s);
const cv=$("#c"),cx=cv.getContext("2d"),LW=320,LH=300;
cv.width=LW;cv.height=LH;cx.imageSmoothingEnabled=false;
const R=(x,y,w,h,c)=>{cx.fillStyle=c;cx.fillRect(Math.round(x),Math.round(y),w,h)};
const circ=(x,y,r,c)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(i*i+j*j<=r*r)R(x+i,y+j,1,1,c)};
const ORD=["matin","soir","nuit"];
const hr=new Date().getHours();
let T=hr>=7&&hr<17?"matin":hr<21?"soir":"nuit",t=0,muted=false,mus=null,hearts=[],rain=false,lampOn=true,catX=-99,thunder=null;

/* petite police 3x5 pour les néons */
const F={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",H:"101101111101101",I:"111010010010111",L:"100100100100111",M:"101111111101101",N:"111101101101101",O:"111101101101111",P:"110101110100100",R:"110101110101101",S:"011100010001110","7":"111001010010010",U:"101101101101111"};
function TX(s,x,y,c,k){k=k||1;[...s].forEach((ch,i)=>{const g=F[ch];if(!g)return;for(let j=0;j<15;j++)if(g[j]==="1")R(x+i*4*k+(j%3)*k,y+((j/3)|0)*k,k,k,c)})}

const SK={matin:["#5fb8ff","#7cc6ff","#a4d8ff","#cfeaff"],soir:["#4a2f6e","#b04a7a","#ff7a3d","#ffc26b"],nuit:["#050820","#0a0d2b","#141a4a","#22307a"]};
const MT={matin:"#8da9c4",soir:"#6b4a5e",nuit:"#141a3d"};
const STARS=Array.from({length:50},(_,i)=>[(i*97)%318+1,(i*53)%38+1]);

/* les neuf appartements : [type, x, y, options] */
const APTS=[
 {wall:"#2b1f28",floor:"#3b2422",acc:"#7a1f2f",acc2:"#5a1622",it:[["neon",4,4,{s:"SAME CHAOS",c:"#ff3b5c"}],["win",62,8],["lamp",48,0],["bed",2,34],["cat",30,27],["candle",56,42],["candle",88,42],["plant",76,28]]},
 {wall:"#3a2a22",floor:"#7a5230",acc:"#2f6b55",acc2:"#22503f",it:[["neon",4,4,{s:"DISCIPLINE",c:"#ff8a3d"}],["win",62,10],["lamp",48,0],["guitar",4,26],["turntable",16,38],["piano",46,34],["plant",80,30]]},
 {wall:"#cfe0c0",floor:"#9a7048",acc:"#3f9a5f",acc2:"#2f7d4f",it:[["win",34,8],["lamp",62,0],["plant",2,28],["plant",16,30],["tank",48,36],["plant",74,28]]},
 {wall:"#f3e9dc",floor:"#c8996b",acc:"#3f5a4a",acc2:"#2f4438",it:[["neon",8,4,{s:"MORE SUN",c:"#e08a00",bg:"#fff8e8"}],["win",44,8],["lamp",28,0],["coffee",4,34],["shelf",76,18],["plant",58,30]]},
 {wall:"#e2cdb6",floor:"#a8693f",acc:"#b5651d",acc2:"#8a4a14",it:[["win",40,4],["lamp",30,0],["tv",6,30,{ch:1}],["sofa",34,36],["cat",52,29],["plant",78,28]]},
 {wall:"#1f2233",floor:"#2b2f3f",acc:"#5b7cff",acc2:"#3f57c7",it:[["desk",6,28],["lamp",54,0],["win",62,14],["neon",70,4,{s:"ON",c:"#5b7cff"}],["plant",80,30]]},
 {wall:"#cfd8e6",floor:"#9c7b5a",acc:"#6a7fb0",acc2:"#4f6290",it:[["win",56,8],["lamp",40,0],["bed",2,34],["cat",8,27],["plant",80,28]]},
 {wall:"#4a3628",floor:"#6b4a2f",acc:"#a4552b",acc2:"#7a3a1c",it:[["win",44,4],["shelf",2,18],["shelf",22,18],["sofa",48,36],["lamp",76,0],["candle",90,42]]},
 {wall:"#3a1a1a",floor:"#2a1e1e",acc:"#ff3b3b",acc2:"#b02020",it:[["shelf",2,18],["desk",24,28],["neon",66,4,{s:"PLAN",c:"#ff5b5b"}],["lamp",84,0],["candle",84,42]]}
];
const SZ={win:[28,24],plant:[14,20],sofa:[40,16],bed:[44,14],cat:[12,8],lamp:[8,11],guitar:[8,22],turntable:[22,10],coffee:[12,14],tv:[22,16],desk:[44,20],candle:[4,8],shelf:[18,30],tank:[22,14],piano:[30,16]};
const size=it=>it.t==="neon"?[it.s.length*4,5]:SZ[it.t];
APTS.forEach((a,i)=>{a.ox=12+(i%3)*100;a.oy=48+(i/3|0)*68;a.lit=true;
  a.items=a.it.map(([t,x,y,o],j)=>Object.assign({t,x,y,a,ax:a.ox+x,ay:a.oy+y,id:"a"+i+"-"+j},o||{}))});

/* dessin des objets */
const D={
 win:(x,y)=>{R(x,y,28,24,"#e9e4dc");SK[T].forEach((c,i)=>R(x+2,y+2+i*5,24,5,c));
  if(T==="matin")R(x+6,y+5,5,5,"#ffd54a");else if(T==="soir")R(x+13,y+13,7,4,"#fff1c1");else{R(x+18,y+5,5,5,"#eef1ff");R(x+6,y+8,1,1,"#fff");R(x+10,y+4,1,1,"#fff")}
  R(x+2,y+16,24,6,MT[T]);R(x+6,y+13,6,3,MT[T]);R(x+16,y+12,8,4,MT[T]);R(x+13,y+2,2,20,"#e9e4dc");R(x-1,y+23,30,2,"#cfc8bc");if(rain)for(let k=0;k<6;k++)R(x+3+k*4,y+3+((t*30+k*7)%18),1,2,"rgba(200,220,255,.85)")},
 plant:(x,y,it)=>{const s=it.sway>t?Math.sin(t*14)*1.5:Math.sin(t*1.2+x)*.6;R(x+4,y+14,6,6,"#b5651d");R(x+3,y+13,8,2,"#8a4a14");
  R(x+6+s,y+2,3,12,"#2f7d4f");R(x+2+s,y+6,4,6,"#3f9a5f");R(x+9+s,y+5,4,7,"#3f9a5f");R(x+4+s,y,4,5,"#4fb06f")},
 sofa:(x,y,it,a)=>{R(x+2,y,36,8,a.acc2);R(x,y+6,40,8,a.acc);R(x,y+4,4,10,a.acc2);R(x+36,y+4,4,10,a.acc2);R(x+8,y+2,8,7,"#d9a441");R(x+3,y+14,2,2,"#222");R(x+35,y+14,2,2,"#222")},
 bed:(x,y,it,a)=>{R(x,y+8,44,6,"#5a3820");R(x,y,4,14,"#5a3820");R(x+4,y+6,40,6,"#f1ece4");R(x+16,y+5,28,7,a.acc);R(x+6,y+3,10,5,"#fff")},
 cat:(x,y)=>{const c="#c87f3f";R(x+2,y+3,8,5,c);R(x,y,5,5,c);R(x,y-1,1,1,c);R(x+4,y-1,1,1,c);R(x+10+Math.round(Math.sin(t*3)),y+2,2,4,c);R(x+1,y+2,1,1,"#111");R(x+3,y+2,1,1,"#111");R(x+4,y+4,4,1,"#8a4f22")},
 lamp:(x,y,it,a)=>{R(x+3,y,1,6,"#222");R(x,y+6,8,3,"#242424");R(x+2,y+9,4,2,a.lit?"#ffe08a":"#666");
  if(a.lit&&T!=="matin"){R(x-12,y+11,32,4,"rgba(255,210,120,.10)");R(x-8,y+15,24,6,"rgba(255,210,120,.08)")}},
 neon:(x,y,it)=>{const w=it.s.length*4,on=!it.off&&Math.sin(t*23+x)<.985;
  R(x-2,y-2,w+3,9,it.bg||"rgba(0,0,0,.35)");if(on){if(!it.bg)R(x-3,y-3,w+5,11,it.c+"22");TX(it.s,x,y,it.c)}else TX(it.s,x,y,"#555")},
 guitar:(x,y,it)=>{const w=it.wob>t?Math.round(Math.sin(t*40)):0;R(x+3+w,y,2,12,"#6b4a2b");R(x+2+w,y-2,4,3,"#3a2a1a");R(x+w,y+12,8,10,"#c4823a");R(x+3,y+15,2,2,"#2a1a10")},
 turntable:(x,y,it)=>{R(x,y,22,10,"#2b2624");R(x+3,y+2,7,7,"#0e0e0e");R(x+6,y+5,1,1,"#d9663a");R(x+14,y+1,6,1,"#ccc");
  if(it.on){const g=t*4;R(x+6+Math.round(Math.cos(g)*2.5),y+5+Math.round(Math.sin(g)*2.5),1,1,"#888");R(x+14,y-((t*10)%12),2,2,"#ffd166")}},
 coffee:(x,y,it)=>{R(x,y+10,12,4,"#8a5d34");R(x+1,y,9,10,"#c9ced3");R(x+1,y,9,2,"#9aa1a8");R(x+4,y+7,3,3,"#fff");
  if(it.steam>t)for(let i=0;i<3;i++)R(x+4+Math.round(Math.sin(t*5+i)),y-2-((t*12+i*4)%10),1,2,"rgba(255,255,255,.7)")},
 tv:(x,y,it)=>{const B=["#fff","#ff0","#0ff","#0f0","#f0f","#f00"];R(x,y,22,14,"#111");
  if(!it.ch)R(x+2,y+2,18,10,"#1a1a1a");else if(it.ch===1)B.forEach((c,i)=>R(x+2+i*3,y+2,3,10,c));
  else if(it.ch===2){R(x+2,y+2,18,10,"#444");for(let k=0;k<26;k++)R(x+2+Math.random()*17|0,y+2+Math.random()*9|0,2,1,Math.random()>.5?"#fff":"#999")}
  else{R(x+2,y+2,18,10,"#0b2a4a");R(x+2,y+2+(t*6)%9|0,18,2,"#3b6a8a")}
  R(x+4,y+14,14,2,"#333");if(it.ch&&T!=="matin")R(x-3,y-3,28,22,"rgba(120,170,255,.10)")},
 desk:(x,y,it)=>{R(x,y+14,44,3,"#8a5d34");R(x+2,y+17,2,3,"#5a3820");R(x+40,y+17,2,3,"#5a3820");R(x+4,y+2,16,11,"#111");R(x+24,y+2,16,11,"#111");R(x+11,y+13,2,1,"#333");R(x+31,y+13,2,1,"#333");
  if(!it.off)for(let i=0;i<4;i++){R(x+6,y+4+i*2,4+(((t*3+i*5)|0)%9),1,"#7bd0ff");R(x+26,y+4+i*2,3+(((t*4+i*3)|0)%10),1,"#8fe38f")}},
 candle:(x,y,it)=>{R(x,y+3,4,5,"#f3ead2");if(!it.off){R(x+1,y-1+Math.round(Math.sin(t*20+x)),2,3,"#ffb238");if(T!=="matin")R(x-6,y-6,16,12,"rgba(255,170,60,.10)")}},
 shelf:(x,y,it)=>{const C=["#c94f4f","#4f7ac9","#d9b44a","#4fa96b","#9a5fc9","#e0e0e0"];R(x,y,18,30,"#5a3820");R(x+1,y+1,16,28,"#3a2412");
  for(let r=0;r<3;r++){R(x+1,y+9+r*10,16,1,"#5a3820");for(let c=0;c<5;c++)R(x+2+c*3,y+2+r*10+(c%2),2,7-(c%2),C[(c+r*2)%6])}
  if(it.fall>t)R(x+13,y+29-Math.min(8,(1-(it.fall-t))*8),3,3,"#c94f4f")},
 tank:(x,y,it)=>{R(x,y,22,14,"#1c6d8a");R(x+1,y+1,20,10,"#3fa9d1");R(x+1,y+11,20,2,"#d9c08a");
  for(let i=0;i<2;i++){const f=x+3+((t*6+i*9)%15)|0;R(f,y+4+i*3,3,2,i?"#ff8a3d":"#ffd166");R(f-1,y+4+i*3,1,2,i?"#ff8a3d":"#ffd166")}
  R(x+18,y+9-((t*8)%9),1,1,"#cfeaff");if(it.feed>t)for(let k=0;k<4;k++)R(x+6+k*3,y+2+((t*9+k)%8),1,1,"#e8c060")},
 piano:(x,y,it)=>{R(x,y,30,16,"#1a1a1a");for(let i=0;i<7;i++)R(x+2+i*4,y+6,3,9,it.key===i&&it.kt>t?"#ffd166":"#f5f5f5");[0,1,3,4,5].forEach(i=>R(x+4+i*4,y+6,2,5,"#111"))}
};

function drops(a,b){for(let k=0;k<70;k++){const x=(k*53+7)%LW,y=(t*110+k*41)%LH;if(y>=a&&y<b)R(x,y,1,3,"rgba(190,210,255,.6)")}}
function draw(){
  SK[T].forEach((c,i)=>R(0,i*75,LW,75,c));
  if(T==="nuit"){STARS.forEach(([x,y],i)=>{if(Math.sin(t*2+i)>-.6)R(x,y,1,1,"#fff")});R(272,10,9,9,"#eef1ff")}
  else{R(266,8,10,10,T==="matin"?"#ffd54a":"#ffb060");
    [[8,14],[30,26],[15,20]].forEach(([s,y],i)=>{const x=((t*4+s*9+i*70)%360)-40;R(x,y,16,4,T==="matin"?"#fff":"#ffd9b0");R(x+4,y-2,9,3,T==="matin"?"#fff":"#ffd9b0")})}
  if(rain){R(0,0,LW,44,"rgba(20,30,50,.35)");drops(0,44)}
  /* toit */
  R(0,40,LW,6,"#4a4a5a");R(30,28,20,10,"#7a5a3a");R(30,26,20,2,"#5a3f26");R(32,38,2,2,"#333");R(46,38,2,2,"#333");
  R(280,18,1,22,"#999");R(279,16,3,3,(t%1.2<.6)?"#ff3b3b":"#552222");
  R(140,18,42,21,"#222");TX("7B",150,21,"#ffd166",3);
  /* façade */
  R(4,44,312,208,"#3b3a4a");
  APTS.forEach(a=>{
    R(a.ox,a.oy,96,48,a.wall);R(a.ox,a.oy+48,96,16,a.floor);R(a.ox,a.oy+48,96,1,"rgba(0,0,0,.35)");
    for(let k=0;k<96;k+=12)R(a.ox+k,a.oy+49,1,15,"rgba(0,0,0,.12)");
    a.items.forEach(it=>D[it.t](a.ox+it.x,a.oy+it.y,it,a));
    if(T==="nuit")R(a.ox,a.oy,96,64,a.lit?"rgba(255,170,80,.10)":"rgba(5,5,25,.55)");
    else if(T==="soir")R(a.ox,a.oy,96,64,a.lit?"rgba(255,140,50,.08)":"rgba(255,120,40,.16)");
  });
  /* rue et porte du 7B */
  R(0,252,LW,48,"#2a2a33");R(0,252,LW,3,"#5a5b70");R(0,286,LW,2,"#444");
  for(let k=0;k<LW;k+=24)R(k,292,12,1,"#666");
  R(144,256,32,42,"#20402f");R(146,258,28,38,"#2f5a46");circ(160,273,9,"#c8a24a");circ(160,273,6,T==="matin"?"#bfe3ff":"#ffdba0");
  R(154,285,12,7,"#c8a24a");TX("7B",156,287,"#222");
  R(60,262,2,30,"#555");R(56,260,10,3,"#777");if(T!=="matin"&&lampOn)R(52,264,18,8,"rgba(255,220,140,.22)");
  const cxp=((t*9)%360)-20,cy=283;catX=cxp;const c=T==="nuit"?"#151515":"#c87f3f",lg=Math.sin(t*10)>0;
  R(cxp,cy,7,4,c);R(cxp+7,cy-1,4,4,c);R(cxp-2,cy-2+Math.round(Math.sin(t*6)),2,3,c);R(cxp+(lg?1:2),cy+4,1,2,c);R(cxp+(lg?5:4),cy+4,1,2,c);
  if(rain){drops(252,LH);if((t%9)<.12)R(0,0,LW,LH,"rgba(255,255,255,.16)")}
  /* coeurs */
  const H=["01010","11111","11111","01110","00100"];
  hearts=hearts.filter(h=>t-h.t0<1.3);
  hearts.forEach(h=>{const a=t-h.t0;H.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==="1")R(h.x+i,h.y+j-a*14,1,1,"#ff5b7a")}))});
}
(function frame(ms){t=ms/1000;draw();requestAnimationFrame(frame)})(0);

/* son : tout est généré, aucun fichier */
let ac=null;
function audio(){if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(ac&&ac.state==="suspended")ac.resume()}
function tone(f,d,ty,v,w){if(!ac||muted)return;const s=ac.currentTime+(w||0),o=ac.createOscillator(),g=ac.createGain();o.type=ty||"sine";o.frequency.value=f;g.gain.setValueAtTime(v||.1,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g);g.connect(ac.destination);o.start(s);o.stop(s+d)}
function noise(d,fc,v){if(!ac||muted)return;const n=ac.sampleRate*d,b=ac.createBuffer(1,n,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=b;f.type="bandpass";f.frequency.value=fc;g.gain.value=v||.1;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);s.connect(f);f.connect(g);g.connect(ac.destination);s.start()}
function music(on){clearInterval(mus);if(!on)return;const N=[220,247,262,294,330,392,440];let i=3;mus=setInterval(()=>{i=Math.max(0,Math.min(6,i+Math.floor(Math.random()*3)-1));tone(N[i],1.4,"triangle",.05);if(Math.random()<.3)tone(N[i]/2,1.8,"sine",.05)},560)}
$("#mute").onclick=e=>{muted=!muted;e.target.textContent=muted?"🔇":"🔊"};

/* interactions */
let tt;
function toast(s){const e=$("#toast");e.textContent=s;e.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>e.classList.remove("on"),1800)}
function setT(k){T=k;document.querySelectorAll("nav [data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===k))}
const ACT={
 win:()=>{setT(ORD[(ORD.indexOf(T)+1)%3]);tone(520,.3,"sine",.06);return{matin:"Matin",soir:"Coucher de soleil",nuit:"Nuit"}[T]},
 lamp:it=>{it.a.lit=!it.a.lit;tone(900,.05,"square",.04);return it.a.lit?"Lumière allumée":"Lumière éteinte"},
 neon:it=>{it.off=!it.off;tone(1200,.04,"square",.03);return it.off?"Néon éteint":"Néon allumé"},
 candle:it=>{it.off=!it.off;noise(.3,1500,.04);return it.off?"Bougie soufflée":"Bougie allumée"},
 cat:it=>{hearts.push({x:it.ax+4,y:it.ay-2,t0:t});tone(30,1.4,"sawtooth",.09);tone(60,1.4,"sine",.06);return"Il ronronne"},
 guitar:it=>{it.wob=t+.6;[196,247,294,392].forEach((f,i)=>tone(f,1.6,"triangle",.1,i*.06));return"Un petit accord"},
 turntable:it=>{it.on=!it.on;music(it.on);return it.on?"Le vinyle tourne":"Silence"},
 coffee:it=>{it.steam=t+3.5;noise(1.6,600,.12);tone(140,1.2,"sawtooth",.03);return"Un café, ça sent bon"},
 tv:it=>{it.ch=((it.ch||0)+1)%4;noise(.15,2000,.08);return["Écran éteint","Mire de couleurs","Neige","Film du soir"][it.ch]},
 desk:it=>{it.off=!it.off;tone(660,.1,"sine",.06);return it.off?"Écrans en veille":"3 idées non lues"},
 shelf:it=>{it.fall=t+1;noise(.2,300,.1);return"Un livre est tombé"},
 tank:it=>{it.feed=t+3;noise(.3,3000,.03);return"Les poissons mangent"},
 piano:it=>{const k=Math.floor(Math.random()*7);it.key=k;it.kt=t+.3;tone([262,294,330,349,392,440,494][k],1.2,"triangle",.12);return"Do ré mi..."},
 plant:it=>{it.sway=t+1;noise(.5,4000,.03);return"Elle a soif"}
};
/* secrets à trouver et compteur */
const SEC=[
 {id:"sign",x:140,y:18,w:42,h:21,f:()=>{[523,659,784].forEach((f,i)=>tone(f,.8,"triangle",.1,i*.1));return"Le 7B, ton chez-toi"}},
 {id:"tank",x:30,y:26,w:20,h:12,f:()=>{noise(1,250,.15);return"Le château d'eau gargouille"}},
 {id:"ant",x:277,y:14,w:8,h:26,f:()=>{[1200,900,1200,900].forEach((f,i)=>tone(f,.08,"square",.05,i*.12));return"Signal capté"}},
 {id:"sky",x:264,y:6,w:20,h:14,f:()=>{setT(ORD[(ORD.indexOf(T)+1)%3]);return T==="nuit"?"La lune":"Le soleil"}},
 {id:"slamp",x:52,y:258,w:18,h:36,f:()=>{lampOn=!lampOn;tone(900,.05,"square",.04);return lampOn?"Réverbère allumé":"Réverbère éteint"}},
 {id:"scat",get x(){return catX-3},y:278,w:16,h:12,f:()=>{hearts.push({x:catX+4,y:276,t0:t});tone(30,1.4,"sawtooth",.09);return"Un chat de gouttière"}}
];
const TOTAL=APTS.reduce((n,a)=>n+a.items.length,0)+SEC.length+1;
let found=new Set();try{found=new Set(JSON.parse(localStorage.getItem("7b")||"[]"))}catch(e){}
const shown=()=>{$("#score").textContent=found.size+" / "+TOTAL+" trouvés"};
function mark(id){if(found.has(id))return;found.add(id);try{localStorage.setItem("7b",JSON.stringify([...found]))}catch(e){}shown();if(found.size===TOTAL)setTimeout(()=>toast("Bravo, tu as tout trouvé !"),1900)}
function tap(px,py){
  const r=cv.getBoundingClientRect(),lx=(px-r.left)/r.width*LW,ly=(py-r.top)/r.height*LH;
  if(lx>144&&lx<176&&ly>256&&ly<298){tone(880,1.2,"sine",.1);tone(1108,1.2,"sine",.08,.15);toast("Ding. Personne n'ouvre... pour l'instant");mark("door");return}
  for(const s of SEC){if(lx>=s.x&&lx<=s.x+s.w&&ly>=s.y&&ly<=s.y+s.h){toast(s.f());mark(s.id);return}}
  for(let i=APTS.length-1;i>=0;i--){const a=APTS[i];
    for(let j=a.items.length-1;j>=0;j--){const it=a.items[j],[w,h]=size(it);
      if(lx>=it.ax-2&&lx<=it.ax+w+2&&ly>=it.ay-2&&ly<=it.ay+h+2){toast(ACT[it.t](it));mark(it.id);return}}}
}

/* déplacement et zoom au doigt */
const v=$("#view");let cam={x:0,y:0,z:1},zMin=1;
const apply=()=>cv.style.transform=`translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
function clampCam(){cam.x=Math.min(v.clientWidth-60,Math.max(60-LW*cam.z,cam.x));cam.y=Math.min(v.clientHeight-60,Math.max(60-LH*cam.z,cam.y))}
function fit(){zMin=v.clientWidth/LW;cam.z=Math.min(zMin,v.clientHeight/LH);cam.x=(v.clientWidth-LW*cam.z)/2;cam.y=(v.clientHeight-LH*cam.z)/2;apply()}
function zoomAt(px,py,nz){nz=Math.min(14,Math.max(Math.min(zMin,v.clientHeight/LH)*.9,nz));const k=nz/cam.z;cam.x=px-(px-cam.x)*k;cam.y=py-(py-cam.y)*k;cam.z=nz;clampCam();apply()}
const P=new Map();let dn=null;
v.addEventListener("pointerdown",e=>{v.setPointerCapture(e.pointerId);P.set(e.pointerId,{x:e.clientX,y:e.clientY});dn={t:performance.now(),m:0};audio()});
v.addEventListener("pointermove",e=>{
  const p=P.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(P.size===1){cam.x+=dx;cam.y+=dy;dn.m+=Math.abs(dx)+Math.abs(dy);clampCam();apply()}
  else if(P.size===2){const o=[...P.entries()].find(([id])=>id!==e.pointerId)[1],r=v.getBoundingClientRect();
    zoomAt((e.clientX+o.x)/2-r.left,(e.clientY+o.y)/2-r.top,cam.z*Math.hypot(e.clientX-o.x,e.clientY-o.y)/Math.max(1,Math.hypot(p.x-o.x,p.y-o.y)));dn.m+=99}
  p.x=e.clientX;p.y=e.clientY});
v.addEventListener("pointerup",e=>{P.delete(e.pointerId);if(dn&&P.size===0&&dn.m<8&&performance.now()-dn.t<450)tap(e.clientX,e.clientY);if(!P.size)dn=null});
v.addEventListener("pointercancel",e=>P.delete(e.pointerId));
v.addEventListener("wheel",e=>{e.preventDefault();const r=v.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,cam.z*(e.deltaY<0?1.15:1/1.15))},{passive:false});
document.querySelectorAll("nav [data-t]").forEach(b=>b.onclick=()=>{audio();setT(b.dataset.t)});
$("#fit").onclick=fit;
addEventListener("resize",fit);
$("#rain").onclick=e=>{rain=!rain;e.target.classList.toggle("on",rain);clearInterval(thunder);if(rain){audio();noise(1.5,3000,.05);thunder=setInterval(()=>noise(1.6,180,.18),11000)}};
setT(T);fit();shown();toast("Glisse, pince, touche les objets");
