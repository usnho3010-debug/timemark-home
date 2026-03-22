document.addEventListener("DOMContentLoaded",()=>{

/* ===================================================
🔥 SMART DAILY COUNTER (AUTO GROW)
=================================================== */

const counter = document.getElementById("fakeCounter");

if(counter){

const startDate = new Date("2026-01-01");
const baseValue = 1200;
const dailyGrow = 18;

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

counter.innerText = current.toLocaleString();

},20);

}

});
/* ===== DEMO SLIDER AUTO ===== */

const slides = document.querySelectorAll(".demo-img");
const dotsContainer = document.getElementById("demoDots");

let currentSlide = 0;

/* tạo dots tự động */
slides.forEach((_, index)=>{
  const dot = document.createElement("span");
  dot.classList.add("dot");

  if(index === 0) dot.classList.add("active");

  dot.addEventListener("click", ()=> showSlide(index));

  dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll(".dot");

function showSlide(index){
  slides.forEach((img,i)=>{
    img.classList.remove("active");
    dots[i].classList.remove("active");
  });

  slides[index].classList.add("active");
  dots[index].classList.add("active");

  currentSlide = index;
}

/* auto chạy */
setInterval(()=>{
  let next = (currentSlide + 1) % slides.length;
  showSlide(next);
},3000);
/* ===== TICKER SINGLE MESSAGE ===== */

const ticker = document.getElementById("fakeTicker");

if(ticker){

const names = [
"Nguyễn V.","Anh T.","Minh K.","Phúc L.",
"Huy N.","Tuấn P.","Long D.","Khang V.",
"Nam T.","Đạt Q."
];

const actions = [
"vừa kích hoạt thành công",
"đã mua gói 7 ngày",
"vừa gia hạn key",
"đã xác thực thiết bị",
"đã kết nối hệ thống"
];

function randomMessage(){
  const name = names[Math.floor(Math.random()*names.length)];
  const action = actions[Math.floor(Math.random()*actions.length)];

  return `🟢 <b style="color:#00f0ff">${name}</b> ${action}`;
}

function showMessage(){

  ticker.classList.remove("show");

  setTimeout(()=>{
    ticker.innerHTML = randomMessage();
    ticker.classList.add("show");
  },200);

}

/* chạy lần đầu */
showMessage();

/* đổi mỗi 3s */
setInterval(showMessage,3000);

}
document.addEventListener("DOMContentLoaded",()=>{

const welcome = document.getElementById("welcomeOverlay");

if(!welcome) return;

const now = Date.now();
const savedTime = localStorage.getItem("hide_welcome_time");

/* kiểm tra 24h */
if(!savedTime || (now - savedTime > 24*60*60*1000)){

  setTimeout(()=>{
    welcome.classList.add("show");
  },800);

}

/* OK */
window.closeWelcome = function(){
  welcome.classList.remove("show");
}

/* Không hiển thị lại */
window.skipWelcome = function(){
  welcome.classList.remove("show");

  /* lưu thời gian hiện tại */
  localStorage.setItem("hide_welcome_time", Date.now());
}

});
