/* =========================================
👁 TIMEMARK GOD INTERFACE ENGINE
Radar + HUD + Core Sync
========================================= */

/* CURSOR CORE */
(()=>{
const glow=document.createElement("div");
glow.className="cursorGlow";
glow.style.pointerEvents="none";
document.body.appendChild(glow);

document.addEventListener("mousemove",(e)=>{
glow.style.left=e.clientX+"px";
glow.style.top=e.clientY+"px";
});
})();

/* RADAR CORE CREATE */
(()=>{
const radar=document.createElement("div");
radar.className="radarCore";
document.body.appendChild(radar);
})();

/* HERO PARALLAX */
(()=>{
const hero=document.querySelector(".hero");
if(!hero) return;

window.addEventListener("scroll",()=>{
hero.style.transform=`translateY(${window.scrollY*0.06}px)`;
});
})();

/* HERO HUD LINES */
(()=>{
const hero=document.querySelector(".hero");
if(!hero) return;

for(let i=0;i<4;i++){
const line=document.createElement("div");
line.className="hudLine";
line.style.top=(120+i*40)+"px";
line.style.left="-100px";
hero.appendChild(line);
}
})();

/* PETAL LIGHT */
(()=>{
function createPetal(){
const p=document.createElement("div");
p.className="petal";
p.innerText="✦";
p.style.left=Math.random()*100+"vw";
p.style.animationDuration=(14+Math.random()*6)+"s";
document.body.appendChild(p);
setTimeout(()=>p.remove(),18000);
}

setInterval(()=>{
if(document.hidden) return;
createPetal();
},2600);
})();

/* SPARK + CORE WAVE */
(()=>{
const buttons=document.querySelectorAll(".btnMain");

buttons.forEach(btn=>{

btn.addEventListener("mousemove",(e)=>{
const s=document.createElement("div");
s.className="spark";
btn.appendChild(s);

const rect=btn.getBoundingClientRect();
s.style.left=(e.clientX-rect.left)+"px";
s.style.top=(e.clientY-rect.top)+"px";

setTimeout(()=>s.remove(),500);
});

btn.addEventListener("mouseenter",()=>{
const wave=document.createElement("div");
wave.className="energyWave";
btn.appendChild(wave);

wave.style.width=btn.offsetWidth+"px";
wave.style.height=btn.offsetWidth+"px";
wave.style.left="50%";
wave.style.top="50%";
wave.style.transform="translate(-50%,-50%)";

setTimeout(()=>wave.remove(),700);
});

});
})();
