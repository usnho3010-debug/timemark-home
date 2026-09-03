/* ===== DEMO SLIDER AUTO ===== */

const slides = document.querySelectorAll(".demo-img");
const dotsContainer = document.getElementById("demoDots");

let currentSlide = 0;

if(slides.length && dotsContainer){
  slides.forEach((_, index)=>{
    const dot = document.createElement("button");
    dot.classList.add("dot");
    dot.type = "button";
    dot.setAttribute("aria-label", `Xem ảnh demo ${index + 1}`);
    if(index === 0) dot.classList.add("active");
    dot.addEventListener("click", ()=> showSlide(index));
    dotsContainer.appendChild(dot);
  });
}

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

if(slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
  setInterval(()=>showSlide((currentSlide + 1) % slides.length),4500);
}

/* Decorative snow and sakura petals share one lightweight animation layer. */
if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
  const seasonalLayer = document.createElement("div");
  seasonalLayer.className = "seasonal-effects";
  seasonalLayer.setAttribute("aria-hidden","true");

  for(let index = 0; index < 32; index++){
    const snow = document.createElement("span");
    snow.className = "snowflake";
    snow.style.setProperty("--x", `${Math.random() * 100}vw`);
    snow.style.setProperty("--drift", `${Math.random() * 110 - 55}px`);
    snow.style.setProperty("--size", `${4 + Math.random() * 7}px`);
    snow.style.setProperty("--duration", `${8 + Math.random() * 10}s`);
    snow.style.setProperty("--delay", `${Math.random() * -18}s`);
    seasonalLayer.appendChild(snow);
  }

  for(let index = 0; index < 14; index++){
    const petal = document.createElement("span");
    petal.className = "sakura-petal";
    petal.style.setProperty("--x", `${Math.random() * 100}vw`);
    petal.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    petal.style.setProperty("--duration", `${11 + Math.random() * 10}s`);
    petal.style.setProperty("--delay", `${Math.random() * -20}s`);
    petal.style.setProperty("--scale", `${.65 + Math.random() * .7}`);
    seasonalLayer.appendChild(petal);
  }

  document.body.prepend(seasonalLayer);
}
