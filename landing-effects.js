document.addEventListener("DOMContentLoaded",()=>{

const hero    = document.querySelector(".hero");
const ticker  = document.getElementById("fakeHistory");
const counter = document.getElementById("fakeCounter");


/* ===================================================
🤖 GOD HUD TICKER – FINAL STABLE
=================================================== */
if(ticker){

const fakeNames=[
"Nguyễn V.","Anh T.","Minh K.","Phúc L.",
"Huy N.","Tuấn P.","Long D.","Khang V.",
"Nam T.","Đạt Q.","User***"
];

const fakeActions=[
"kích hoạt thành công",
"vừa mua gói 7 ngày",
"đã gia hạn key",
"kết nối hệ thống",
"thiết bị đã xác thực"
];

let pos = document.body.offsetWidth;

/* ===== RANDOM MESSAGE ===== */
function randomMessage(){

const name   = fakeNames[Math.floor(Math.random()*fakeNames.length)];
const action = fakeActions[Math.floor(Math.random()*fakeActions.length)];

return `🟢 ${name} ${action}`;
}

/* ===== TYPE EFFECT (KHÔNG KHÓA ANIMATE) ===== */
function typeText(text){

ticker.innerHTML="";
let i=0;

const typer=setInterval(()=>{

ticker.innerHTML += text.charAt(i);
i++;

if(i>=text.length){
clearInterval(typer);
}

},25);

}

function newMessage(){

typeText(randomMessage());
pos=document.body.offsetWidth;

}

newMessage();

/* ===== ANIMATE LUÔN CHẠY ===== */
function animate(){

pos -= 1.8; // ⭐ tốc độ mới (mượt hơn)

ticker.style.transform=`translate3d(${pos}px,0,0)`;

if(pos < -ticker.offsetWidth-40){
newMessage();
}

requestAnimationFrame(animate);
}

animate();

}


/* ===================================================
🔥 SMART DAILY COUNTER (AUTO GROW)
=================================================== */

if(counter){

const startDate = new Date("2026-01-01"); // ⭐ ngày bắt đầu
const baseValue = 1200;                   // ⭐ số key ban đầu
const dailyGrow = 18;                     // ⭐ mỗi ngày tăng bao nhiêu

const today = new Date();

const diffDays = Math.floor(
 (today - startDate) / (1000*60*60*24)
);

let target = baseValue + (diffDays * dailyGrow);

let current = 0;

const runCounter=setInterval(()=>{

current += Math.ceil(target/80);

if(current>=target){
current=target;
clearInterval(runCounter);
}

counter.innerText=current;

},20);

}

});
