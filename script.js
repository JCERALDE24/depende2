// script.js - Handles galaxy canvas, particles, typewriter, cursor trail, click hearts,
// surprise sequence, flower spawning, and audio controls.

/* ==========================
   Utility & configuration
   ========================== */
const cfg = {
  starCount: 120,
  particleLimit: 300,
  shootingInterval: 7000,
  flowerBurst: 60
};

// (minimal mode removed) 

// runtime guards for heavy animations
let flowerCount = 0; const maxFlowers = 220; // cap DOM flowers
let shootingIntervalId = null; let floatersIntervalId = null;
let renderActive = true; let heavyMode = true;

// query DOM
const canvas = document.getElementById('galaxy');
const ctx = canvas.getContext('2d');
const flora = document.getElementById('flora');
const trailContainer = document.getElementById('cursorTrail');
const audio = document.getElementById('audio');
const volume = document.getElementById('volume');
const typeEl = document.getElementById('typewriter');
const openHeart = document.getElementById('openHeart');
const finalOverlay = document.getElementById('finalOverlay');
const closeFinal = document.getElementById('closeFinal');
const intro = document.getElementById('intro');
const introOpen = document.getElementById('introOpen');
const mainWrap = document.querySelector('.wrap');
// create aurora element for dynamic lighting
const auroraEl = document.createElement('div'); auroraEl.className = 'aurora'; document.body.appendChild(auroraEl);
// landing text
const landingLine = document.createElement('div'); landingLine.className='landing-line'; landingLine.innerHTML = '<div class="handwritten">for someone who deserves more than they realize</div>'; document.body.appendChild(landingLine);

// Safety: ensure page is visible even if later JS throws — prevents blank screen
document.addEventListener('DOMContentLoaded', ()=>{
  try{ document.body.style.opacity = 1; }catch(e){}
  if(intro){ intro.style.display = 'flex'; intro.style.opacity = 1; }
  // ensure final overlay is hidden on load
  try{ if(finalOverlay) { finalOverlay.classList.add('hidden'); finalOverlay.setAttribute('aria-hidden','true'); } }catch(e){}
  // hide star canvas on the home/intro page until revealed
  try{ if(canvas) canvas.style.display = 'none'; }catch(e){}
    // ensure stars-bg is hidden on the initial intro/home screen (no bg, no animation)
    try{ const sb = document.querySelector('.stars-bg'); if(sb){ sb.style.display = 'none'; sb.style.opacity = 0; } }catch(e){}
  // normal startup behavior
});

/* ==========================
   Canvas: Galaxy & stars
   ========================== */
let W, H; function resize(){
  W = canvas.width = innerWidth; H = canvas.height = innerHeight;
}
window.addEventListener('resize', resize, {passive:true}); resize();

// create stars
class Star{constructor(){this.reset(true)} reset(init){
  this.x = Math.random()*W; this.y = Math.random()*H;
  this.r = Math.random()*1.6 + 0.2; this.alpha = Math.random()*0.9+0.1;
  this.twinkle = Math.random()*0.02 + 0.002; this.base = this.alpha;
  this.vx = (Math.random()-0.5)*0.02; this.vy = (Math.random()-0.5)*0.02;
  if(!init){this.x = Math.random()*W; this.y = H + 10}
}}

const stars=[]; for(let i=0;i<cfg.starCount;i++)stars.push(new Star());

// shooting stars
function shoot(){
  const sx = W + 200, sy = Math.random()*H*0.5; const len= Math.random()*200+200;
  const speed = Math.random()*6+8; const angle = -Math.PI*0.6;
  shooting.push({x:sx,y:sy,dx:Math.cos(angle)*speed,dy:Math.sin(angle)*speed,len,life:0});
}
const shooting = [];

function render(){
  if(!renderActive) return;
  ctx.clearRect(0,0,W,H);
  // soft vignette
  const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(10,8,20,0.2)'); g.addColorStop(1,'rgba(2,4,10,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // stars
  for(const s of stars){
    s.alpha += (Math.random()-0.5)*s.twinkle;
    s.alpha = Math.max(0.05, Math.min(1, s.alpha));
    s.x += s.vx; s.y += s.vy;
    if(s.x<0||s.x>W||s.y<0||s.y>H){s.reset();}
    ctx.beginPath(); ctx.globalAlpha = s.alpha; ctx.fillStyle = 'white';
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  }

  // shooting stars
  for(let i=shooting.length-1;i>=0;i--){
    const p = shooting[i]; p.x+=p.dx; p.y+=p.dy; p.life+=1;
    ctx.beginPath(); const grad = ctx.createLinearGradient(p.x,p.y,p.x-p.dx*p.len,p.y-p.dy*p.len);
    grad.addColorStop(0,'rgba(255,255,255,0.9)'); grad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.globalAlpha = Math.max(0,1 - p.life/60);
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.dx*p.len,p.y-p.dy*p.len); ctx.stroke();
    if(p.life>120) shooting.splice(i,1);
  }
  ctx.globalAlpha = 1;
  // gradually reveal landing text and stars: small fade in handled elsewhere
  if(renderActive) requestAnimationFrame(render);
}
render();

// staged star reveal for cinematic landing
let revealIndex = 0; function revealStarsStep(){
  if(revealIndex < stars.length){
    // brighten a handful
    for(let i=0;i<6;i++){ const s = stars[(revealIndex + i) % stars.length]; s.alpha = Math.max(s.alpha, 0.05 + Math.random()*0.6); }
    revealIndex += 6; setTimeout(revealStarsStep, 120);
  } else {
    // show landing text fade
    landingLine.style.transition = 'opacity 1200ms ease'; landingLine.style.opacity = 1;
    setTimeout(()=>{ landingLine.style.opacity = 0; }, 2200);
  }
}

/* ==========================
   Nebula subtle animations
   ========================== */
// simple drifting via CSS transforms (handled in CSS with animation if desired)

/* ==========================
   Typewriter + emotional cues
   ========================== */
function parseDataText(str){try{return JSON.parse(str)}catch(e){return [str]}}
const lines = parseDataText(typeEl.getAttribute('data-text'));
let lineIndex=0;
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function runTypewriter(){
  // soft dream fade-in
  document.documentElement.style.scrollBehavior='auto';
  await fadeIn(document.querySelector('.glass-card'), 700);
  // fade each line in and out, centered
  for(let i=0;i<lines.length;i++){
    const text = lines[i];
    typeEl.style.opacity = 0; typeEl.textContent = text;
    // fade in
    typeEl.style.transition = 'opacity 900ms ease';
    requestAnimationFrame(()=>{ typeEl.style.opacity = 1; });
    // wait duration proportional to length
    const wait = Math.max(2600, Math.min(7000, text.split(' ').length * 450));
    await sleep(wait);
    // fade out
    typeEl.style.opacity = 0;
    await sleep(700);
  }
  // final glow only; flower will appear later in the final constellation sequence
  brightenStars(1.8);
}

function spawnTinySpark(){
  const el = document.createElement('div'); el.className = 'trail-heart'; el.innerHTML = `<svg viewBox="0 0 8 8" width="8" height="8"><circle cx="4" cy="4" r="3" fill="rgba(230,199,132,0.95)"/></svg>`;
  const x = innerWidth*0.4 + Math.random()*innerWidth*0.2; const y = innerHeight*0.35 + Math.random()*innerHeight*0.2;
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.opacity = 0.95; el.style.transform = 'translate(-50%,-50%) scale(0.6)'; trailContainer.appendChild(el);
  el.style.transition = 'transform 1200ms ease, opacity 1200ms ease'; requestAnimationFrame(()=>{el.style.transform='translate(-50%,-160%) scale(1)'; el.style.opacity=0});
  setTimeout(()=>el.remove(),1400);
}

function fadeIn(el,ms=600){return new Promise(r=>{el.style.opacity=0;el.style.transition=`opacity ${ms}ms ease`;requestAnimationFrame(()=>{el.style.opacity=1});setTimeout(r,ms)})}

function brightenStars(factor=1.6){for(let s of stars){s.alpha = Math.min(1, s.alpha*factor)} }

/* ==========================
   Cursor trail and click hearts
   ========================== */
function createHeart(x,y,opts={size:20,life:120}){
  const el = document.createElement('div'); el.className='trail-heart';
  el.style.left = x+'px'; el.style.top = y+'px';
  el.innerHTML = heartSVG(opts.size, opts.color || 'rgba(255,111,181,0.95)');
  trailContainer.appendChild(el);
  // animate and remove
  el.style.transition = `transform 1200ms cubic-bezier(.2,.8,.2,1),opacity 1200ms`; el.style.transform='translate(-50%,-50%) scale(1.2)';
  setTimeout(()=>{el.style.opacity=0; el.style.transform='translate(-50%,-200%) scale(0.8)';},60);
  setTimeout(()=>el.remove(),1400);
}

function heartSVG(size=18,color='pink'){return `
  <svg viewBox="0 0 32 29" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.6 2C21.3 2 19.5 3.2 18.6 4.6 17.7 3.2 15.9 2 13.6 2 9.6 2 6.6 5 6.6 9.1 6.6 16.1 16 21.4 16 21.4s9.4-5.3 9.4-12.3C25.4 5 22.4 2 23.6 2z" fill="${color}" />
  </svg>`}

// cursor trail
let trailTimer; window.addEventListener('mousemove', e=>{
  clearTimeout(trailTimer); createHeart(e.clientX,e.clientY,{size:18});
  trailTimer = setTimeout(()=>{},50);
  // update aurora position CSS variables for dynamic lighting
  document.documentElement.style.setProperty('--cursor-x', (e.clientX / innerWidth * 100) + '%');
  document.documentElement.style.setProperty('--cursor-y', (e.clientY / innerHeight * 100) + '%');
});

// click hearts
window.addEventListener('click', e=>{
  // spawn multiple small hearts
  for(let i=0;i<6;i++){
    const x = e.clientX + (Math.random()-0.5)*80; const y = e.clientY + (Math.random()-0.5)*40;
    const el = document.createElement('div'); el.className='trail-heart'; el.innerHTML = heartSVG(22,'rgba(255,200,220,0.98)');
    el.style.left = x+'px'; el.style.top = y+'px'; el.style.zIndex=7; trailContainer.appendChild(el);
    el.style.transition = `transform 1800ms cubic-bezier(.2,.9,.2,1),opacity 1800ms`;
    setTimeout(()=>{el.style.transform='translate(-50%,-180%) scale(1.2)'; el.style.opacity=0},40);
    setTimeout(()=>el.remove(),2200);
  }
});



/* ==========================
   Flora: petals & flowers
   ========================== */
function spawnFlower(x,y,size=36,srcColor='linear-gradient(45deg,#ff6fb5,#8a4fff)'){
  // safety: avoid creating too many flower DOM nodes
  if(!heavyMode && size <= 60) return;
  if(flowerCount >= maxFlowers) return;
  const el = document.createElement('div'); el.className='flower';
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = size+'px'; el.style.height = size+'px';
  el.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 20%), ' + srcColor;
  el.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%'; el.style.opacity = 0.95;
  el.style.transform = `translate(-50%,-50%) rotate(${Math.random()*360}deg)`;
  if(size > 60){
    // place large bloom above UI so it's visible
    el.style.position = 'fixed'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.zIndex = 9998;
    el.style.animation = `bloom 1200ms cubic-bezier(.2,.9,.2,1) forwards`; el.style.opacity = 0;
    document.body.appendChild(el); flowerCount++;
    setTimeout(()=>{ el.style.opacity = 1; el.style.transition = 'opacity 1800ms ease'; }, 50);
    setTimeout(()=>{ try{ el.remove(); }catch(e){}; flowerCount = Math.max(0, flowerCount-1); }, 6000);
  } else {
    // small floaters go into flora layer
    flora.appendChild(el); flowerCount++;
    const dur = 8000 + Math.random()*8000; el.style.animation = `floatUp ${dur}ms linear forwards`;
    setTimeout(()=>{ try{ el.remove(); }catch(e){}; flowerCount = Math.max(0, flowerCount-1); }, dur+200);
  }
}

// periodic slow floaters (stored id so we can clear if needed)
floatersIntervalId = setInterval(()=>{
  if(!heavyMode) return;
  const x = Math.random()*innerWidth; const y = innerHeight + 40; spawnFlower(x,y,20+Math.random()*40);
},800);

// emergency stop function to kill heavy animations and clear DOM if things crash
function emergencyStop(){
  heavyMode = false; renderActive = false;
  try{ if(shootingIntervalId) clearInterval(shootingIntervalId); }catch(e){}
  try{ if(floatersIntervalId) clearInterval(floatersIntervalId); }catch(e){}
  // remove many DOM nodes created by animations
  document.querySelectorAll('.flower').forEach(n=>n.remove());
  document.querySelectorAll('.trail-heart').forEach(n=>n.remove());
  try{ removeFrontEffects(); }catch(e){}
  flowerCount = 0;
  // gently lower audio
  fadeAudioTo(0.0, 800);
  // stop rotating galaxy
  removeCanvasRotate();
}
window.emergencyStop = emergencyStop;

/* ==========================
   Surprise bloom & final scene
   ========================== */
function surprise(){
  // brighten stars
  for(let i=0;i<stars.length;i++) stars[i].alpha = Math.min(1, stars[i].alpha*1.6);
  // aurora intensify
  auroraEl.style.transition = 'opacity 900ms ease, filter 900ms ease'; auroraEl.style.opacity = 1;
  auroraEl.style.filter = 'blur(18px) saturate(150%)';
  // many flowers
  for(let i=0;i<cfg.flowerBurst;i++){
    const x = Math.random()*innerWidth; const y = innerHeight - Math.random()*innerHeight; spawnFlower(x,y,14+Math.random()*32);
  }
  // hearts float up
  for(let i=0;i<80;i++){
    setTimeout(()=>{
      const x = innerWidth*0.2 + Math.random()*innerWidth*0.6; const y = innerHeight - 40 - Math.random()*60;
      const el = document.createElement('div'); el.className='trail-heart'; el.innerHTML = heartSVG(18,'rgba(255,111,181,0.98)');
      el.style.left = x+'px'; el.style.top = y+'px'; trailContainer.appendChild(el);
      el.style.transition = `transform ${4000+Math.random()*3000}ms cubic-bezier(.2,.9,.2,1),opacity 4000ms`;
      setTimeout(()=>{el.style.transform='translate(-50%,-600%) scale(1.2)'; el.style.opacity=0},50);
      setTimeout(()=>el.remove(),8000);
    }, i*20);
  }
  // animate stars to heart shape
  setTimeout(()=>{formStarHeart();},1400);
}

// If there was an old `openHeart` element, ensure we don't try to bind to it.
if(typeof openHeart !== 'undefined' && openHeart){
  openHeart.addEventListener('click', ()=>{ if(audio){ try{ audio.currentTime=0; audio.volume = volume.value; audio.play().catch(()=>{}); }catch(e){} } surprise();});
}

closeFinal && closeFinal.addEventListener('click', ()=>{finalOverlay.classList.add('hidden'); finalOverlay.setAttribute('aria-hidden','true');});

/* ==========================
   Star heart formation
   ========================== */
function formStarHeart(){
  // move some stars to approximate heart shape
  const heartPts = makeHeartPoints(180, innerWidth/2, innerHeight/2 - 40, Math.min(innerWidth,innerHeight)/3);
  for(let i=0;i<Math.min(heartPts.length, stars.length); i++){
    const s = stars[i]; const p = heartPts[i];
    // animate position over time
    animateStarTo(s, p.x, p.y, 1800 + Math.random()*1600);
  }
}

function animateStarTo(s, tx, ty, dur=1500){
  const sx = s.x, sy = s.y; const start = performance.now(); function step(t){
    const p = Math.min(1,(t-start)/dur); const ease = (--p)*p*p+1; s.x = sx + (tx - sx)*ease; s.y = sy + (ty - sy)*ease; s.alpha = Math.min(1,0.4 + ease*1.2);
    if(t-start < dur) requestAnimationFrame(step);
  } requestAnimationFrame(step);
}

function makeHeartPoints(count, cx, cy, scale){
  const pts=[]; for(let i=0;i<count;i++){const t = Math.PI*2*(i/count);
    // parametric heart curve
    const x = 16*Math.pow(Math.sin(t),3);
    const y = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
    pts.push({x: cx + x*scale/32, y: cy - y*scale/32});
  } return pts;
}

/* ==========================
   Audio player handling
   ========================== */
volume.addEventListener('input', ()=>{if(audio) audio.volume = volume.value});

/* ==========================
   Initial boot
   ========================== */
window.addEventListener('load', ()=>{
  // subtle page fade-in but keep main content hidden until intro clicked
  document.body.style.opacity = 0; document.body.style.transition = 'opacity 900ms ease'; requestAnimationFrame(()=>document.body.style.opacity=1);
});

/* ==========================
   Audio helpers
   ========================== */
function fadeAudioTo(target, duration=1200){
  if(!audio) return; const start = audio.volume; const delta = target - start; const t0 = performance.now();
  function step(t){ const p = Math.min(1,(t-t0)/duration); audio.volume = Math.max(0, Math.min(1, start + delta * p)); if(p<1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}

/* ==========================
   Cinematic entry sequence
   ========================== */
const motorcycleEl = document.getElementById('motorcycle');
const continueBtn = document.getElementById('continueBtn');
const countdownEl = document.getElementById('countdown');

function showMotorcycle(){
  if(!motorcycleEl) return; motorcycleEl.classList.add('show'); motorcycleEl.classList.add('orbit');
  // headlights glow
  const head = motorcycleEl.querySelector('.headlight'); if(head) { head.style.transition = 'opacity 900ms ease'; head.style.opacity = 0.95; }
}

function showLandingText(text, duration=4000){
  landingLine.innerHTML = `<div class="handwritten">${text}</div>`;
  landingLine.style.transition = 'opacity 900ms ease'; landingLine.style.opacity = 1;
  return new Promise(res=>{ setTimeout(()=>{ landingLine.style.opacity = 0; setTimeout(res,500); }, duration); });
}

function startContinueCountdown(seconds=15){
  if(!continueBtn) return; continueBtn.disabled = true; countdownEl.textContent = 'please wait'; countdownEl.style.display = 'flex';
  // Fade the text out slowly over the duration, then enable the button
  countdownEl.style.transition = `opacity ${seconds}s linear`;
  countdownEl.style.opacity = 1;
  // trigger fade on next frame
  requestAnimationFrame(()=>{ countdownEl.style.opacity = 0; });
  setTimeout(()=>{ continueBtn.disabled = false; countdownEl.style.display='none'; countdownEl.style.opacity = 1; }, seconds*1000 + 200);
}

// Track whether user has activated intro (safety for stuck/hidden UI)
let introActivated = false;
function forceReveal(){
  if(introActivated) return;
  try{ if(intro){ intro.style.display='none'; intro.style.opacity=0; } }catch(e){}
  try{ if(mainWrap){ mainWrap.classList.remove('pre-hidden'); mainWrap.style.opacity=1; mainWrap.style.pointerEvents='auto'; } }catch(e){}
  try{ addFrontEffects(); }catch(e){}
}

// Front-layer cinematic effects: sheen + a few bokeh elements
let frontFxNodes = [];
function addFrontEffects(){
  try{
    const card = document.getElementById('glassCard'); if(!card) return;
    // sheen overlay on card
    if(!card.querySelector('.card-sheen')){
      const s = document.createElement('div'); s.className='card-sheen animate'; card.appendChild(s); frontFxNodes.push(s);
      // remove sheen after one run (6s) to reduce continuous CPU/GPU usage
      setTimeout(()=>{ try{ s.remove(); frontFxNodes = frontFxNodes.filter(n=>n!==s); }catch(e){} }, 6500);
    }
    // a few subtle bokeh particles near the card
    const rect = card.getBoundingClientRect();
    const count = 5;
    for(let i=0;i<count;i++){
      const b = document.createElement('div'); b.className='front-bokeh';
      const x = rect.left + rect.width*(0.15 + Math.random()*0.7) + (Math.random()*120-60);
      const y = rect.top + rect.height*(0.15 + Math.random()*0.7) + (Math.random()*100-50);
      b.style.left = x + 'px'; b.style.top = y + 'px';
      const dur = 4800 + Math.random()*4200; b.style.animation = `bokehFloat ${dur}ms ease-in-out infinite`;
      b.style.opacity = 0.12 + Math.random()*0.18; document.body.appendChild(b); frontFxNodes.push(b);
    }
  }catch(e){}
}

function removeFrontEffects(){ frontFxNodes.forEach(n=>{ try{ n.remove(); }catch(e){} }); frontFxNodes = []; }

// Updated intro handler to orchestrate the cinematic opening
introOpen && introOpen.addEventListener('click', async ()=>{
  // user interaction - hide intro overlay
  introActivated = true;
  intro.style.transition = 'opacity 700ms ease'; intro.style.opacity = 0;
  setTimeout(()=>{ intro.style.display = 'none'; }, 800);
  if(mainWrap){ mainWrap.classList.remove('pre-hidden'); mainWrap.style.opacity=1; mainWrap.style.pointerEvents='auto'; }
  try{ addFrontEffects(); }catch(e){}
  // start ambient audio (fade in)
  try{ audio.currentTime = 0; audio.play().catch(()=>{}); audio.volume = 0; fadeAudioTo(0.65, 1800); }catch(e){}
  // reveal the star canvas and start shooting stars
  try{ if(canvas) canvas.style.display = ''; }catch(e){}
  // show and animate the subtle stars-bg now that user has entered
  try{ const sb = document.querySelector('.stars-bg'); if(sb){ sb.style.display = ''; sb.style.animation = 'starStart 900ms ease forwards'; setTimeout(()=>sb.style.opacity = 0.7, 900); } }catch(e){}
  try{ if(!shootingIntervalId) shootingIntervalId = setInterval(shoot, cfg.shootingInterval); }catch(e){}
  // start staged star reveal for 4 seconds with no text
  revealIndex = 0; revealStarsStep();
  // wait 4 seconds (quiet cinematic moment)
  await new Promise(r=>setTimeout(r, 4000));
  // fade in motorcycle and start subtle orbit
  showMotorcycle();
  // after bike is visible, show the two intro lines
  await new Promise(r=>setTimeout(r, 3000));
  await showLandingText('some words deserve time.', 4000);
  await showLandingText('and some people deserve to hear them.', 4000);
  // automatically proceed to the message sequence
  await runTypewriter();
  // short pause then begin journey
  await sleep(600);
  startJourney();
});

// safety: if the user can't interact with the intro (stuck/overlay issues), auto-reveal after a short delay
// NOTE: auto-reveal disabled so the experience waits for user's explicit click
// setTimeout(()=>{ try{ forceReveal(); }catch(e){} }, 1800);

// Intro button shows the site and triggers surprise sequence


// Accessibility: stop animations on reduced motion
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('*').forEach(n=>n.style.animation = 'none');
}

/* ==========================
   Journey sequence and messaging
   ========================== */
function fadeOut(el,ms=600){return new Promise(r=>{el.style.transition=`opacity ${ms}ms ease`; el.style.opacity=0; setTimeout(r,ms)})}

async function showMessage(text, minDisplay=5000){
  // display text in the glass card area with cinematic fade
  if(!typeEl) return; typeEl.style.opacity = 0; typeEl.textContent = '';
  typeEl.textContent = text; typeEl.style.transition = 'opacity 900ms ease'; requestAnimationFrame(()=>typeEl.style.opacity = 1);
  const wait = Math.max(minDisplay, Math.min(9000, text.split(' ').length * 350));
  await new Promise(r=>setTimeout(r, wait));
  await fadeOut(typeEl,700);
}

function addCanvasRotate(){ canvas.classList.add('galaxy-rotate'); }
function removeCanvasRotate(){ canvas.classList.remove('galaxy-rotate'); }

function startJourney(){
  // audio emotional build
  fadeAudioTo(0.9, 2000);
  // start galaxy rotate
  addCanvasRotate();
  // motorcycle begins journey
  if(motorcycleEl) motorcycleEl.classList.add('move');
  // messages for journey - paragraphs trimmed for pacing
  const paragraphs = [
    "i hope one day you realize just how much you deserve.",
    "you deserve people who stay consistent.",
    "you deserve honesty that remains honest even when the truth is difficult.",
    "you deserve conversations that leave you feeling understood instead of alone.",
    "you deserve respect that never changes behind your back.",
    "you deserve kindness on the days when you are struggling.",
    "you deserve patience on the days when you feel lost.",
    "you deserve support without having to beg for it.",
    "you deserve appreciation without needing to earn it every single day.",
    "you deserve to be around people who celebrate your happiness and care about your sadness.",
    "you deserve effort. you deserve sincerity. you deserve understanding. you deserve peace.",
    "there may be moments when life convinces you that you are not enough.",
    "but your value has never depended on how others treated you.",
    "you have always been worthy. worthy of respect. worthy of kindness. worthy of happiness.",
    "if you remember anything from this moment, remember this: you deserve the same kindness you give."
  ];

  (async ()=>{ for(const p of paragraphs){ await showMessage(p); } await finalConstellationSequence(); })();
}

/* ==========================
   Final constellation formation
   ========================== */
function makeTextPoints(text, font='120px Playfair Display', sample=8){
  // draw text to offscreen canvas and sample points
  const oc = document.createElement('canvas'); const ow = Math.min(1600, innerWidth); oc.width = ow; oc.height = Math.min(400, innerHeight/2);
  const octx = oc.getContext('2d'); octx.fillStyle = 'white'; octx.font = font; octx.textAlign='center'; octx.textBaseline='middle';
  octx.fillText(text, oc.width/2, oc.height/2);
  const img = octx.getImageData(0,0,oc.width,oc.height).data; const pts = [];
  for(let y=0;y<oc.height;y+=sample){ for(let x=0;x<oc.width;x+=sample){ const idx = (y*oc.width + x)*4; if(img[idx+3] > 128){ pts.push({x:x/(oc.width)*innerWidth, y:y/(oc.height)*(innerHeight*0.45)}); } } }
  return pts;
}

function animateStarsToPoints(points, duration=2000){
  for(let i=0;i<Math.min(points.length, stars.length); i++){
    const s = stars[i]; const p = points[i]; animateStarTo(s, p.x, p.y, duration + Math.random()*1000);
  }
}

async function finalConstellationSequence(){
  // slow camera pull and music swell
  fadeAudioTo(0.95, 2200);
  // phrase 1
  const pts1 = makeTextPoints('you deserve more than you think.', '120px Playfair Display', 6);
  animateStarsToPoints(pts1, 2400);
  await new Promise(r=>setTimeout(r, 8000));
  // phrase 2
  const pts2 = makeTextPoints('never forget that.', '100px Playfair Display', 6);
  animateStarsToPoints(pts2, 2000);
  await new Promise(r=>setTimeout(r, 6000));
  // phrase 3
  const pts3 = makeTextPoints('take care of yourself.', '100px Playfair Display', 6);
  animateStarsToPoints(pts3, 2000);
  await new Promise(r=>setTimeout(r, 6000));
  // finale: immediately show the persistent final flower (no bursts/balloons)
  try{
    // Do not create any flowers per user request. Instead show signature/final message
    // only while music is playing. If music isn't playing yet, wait for it to start.
    const audio = document.getElementById('audio');
    const showFinals = ()=>{
      try{ const prevB = document.getElementById('finalBouquet'); if(prevB) prevB.remove(); }catch(e){}
      try{ const prevF = document.getElementById('finalFlower'); if(prevF) prevF.remove(); }catch(e){}
      try{ const prevS = document.getElementById('finalFlowerSvg'); if(prevS) prevS.remove(); }catch(e){}
      const card = document.getElementById('glassCard');
      const x = card ? (card.getBoundingClientRect().left + card.getBoundingClientRect().width/2) : innerWidth/2;
      const y = card ? (card.getBoundingClientRect().top + card.getBoundingClientRect().height/2) : innerHeight/2;
      // show signature immediately
      createSignature(x,y,'--Troy--',220);
      // reveal final overlay message while music continues
      const overlay = document.getElementById('finalOverlay');
      if(overlay){ overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden','false'); }
    };
    if(audio){
      if(!audio.paused && !audio.ended) showFinals();
      else {
        const onplay = ()=>{ showFinals(); audio.removeEventListener('play', onplay); };
        audio.addEventListener('play', onplay);
      }
    } else { // no audio element, just show finals
      showFinals();
    }
  }catch(e){}
  // keep music audible and give a short breathing moment
  fadeAudioTo(0.95, 800);
  for(let s of stars) s.alpha = Math.max(0, s.alpha*0.3);
  await new Promise(r=>setTimeout(r, 3000));
}

// Create a persistent final flower that stays visible while music continues
function createPersistentFlower(x,y,size=200,srcColor='linear-gradient(45deg,#ffdca8,#ff6fb5)'){
  // remove any previous final flower
  try{ const prev = document.getElementById('finalFlower'); if(prev) prev.remove(); }catch(e){}
  const el = document.createElement('div'); el.id = 'finalFlower'; el.className = 'flower persistent';
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = size+'px'; el.style.height = size+'px';
  el.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), transparent 12%), ' + srcColor;
  el.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%'; el.style.position = 'fixed'; el.style.transform = 'translate(-50%,-50%)'; el.style.zIndex = 99999;
  // subtle pulse
  el.style.boxShadow = '0 40px 140px rgba(0,0,0,0.62), 0 8px 40px rgba(255,140,190,0.06) inset';
  document.body.appendChild(el);
  // keep it present — do not schedule removal so music can continue with the bloom visible
}

// Create a persistent inline SVG flower (based on generate_flower.py) and insert it centered
function createPersistentSVGFlower(x,y,size=260){
  try{ const prev = document.getElementById('finalFlowerSvg'); if(prev) prev.remove(); }catch(e){}
  const wrapper = document.createElement('div'); wrapper.id = 'finalFlowerSvg';
  wrapper.style.position = 'fixed'; wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px';
  wrapper.style.transform = 'translate(-50%,-50%) scale(0.92)'; wrapper.style.zIndex = 99999; wrapper.style.width = size + 'px'; wrapper.style.height = size + 'px';
  wrapper.style.pointerEvents = 'none'; wrapper.style.opacity = '0';
  // Inline SVG content (8 petals + center) — no XML header to avoid insertion issues
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet"> <defs> <radialGradient id="petalGrad" cx="30%" cy="30%" r="70%"> <stop offset="0%" stop-color="#fff0f5" stop-opacity="1"/> <stop offset="60%" stop-color="#ff99cc" stop-opacity="0.95"/> <stop offset="100%" stop-color="#a14fff" stop-opacity="0.9"/> </radialGradient> <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%"> <stop offset="0%" stop-color="#fff6d6"/> <stop offset="100%" stop-color="#f2c36b"/> </radialGradient> </defs> <g transform="translate(300,300)">` +
    Array.from({length:8}).map((_,i)=>{
      const delay = i * 30;
      return `<g transform="rotate(${i*45})"><ellipse class="petal" style="transform-origin:50% 70%; animation: petalUnfurl 260ms cubic-bezier(.2,.9,.2,1) forwards; animation-delay:${delay}ms" cx="0" cy="-120" rx="60" ry="140" fill="url(#petalGrad)" opacity="0.98"/></g>`
    }).join('') +
    `<circle class="flower-center" cx="0" cy="0" r="48" fill="url(#centerGrad)" stroke="#d3a24f" stroke-width="4"/></g></svg>`;
  wrapper.innerHTML = svg;
  document.body.appendChild(wrapper);
  // quick fade+scale for aesthetic appearance
  requestAnimationFrame(()=>{ wrapper.style.transition = 'opacity 180ms ease, transform 260ms cubic-bezier(.2,.9,.2,1)'; wrapper.style.opacity = '1'; wrapper.style.transform = 'translate(-50%,-50%) scale(1)'; });
}

// Create a clustered bouquet of smaller flowers for a bouquet effect
function createPersistentBouquet(cx,cy,size=320){
  try{ const prev = document.getElementById('finalBouquet'); if(prev) prev.remove(); }catch(e){}
  const wrapper = document.createElement('div'); wrapper.id = 'finalBouquet';
  wrapper.style.position = 'fixed'; wrapper.style.left = cx + 'px'; wrapper.style.top = cy + 'px';
  wrapper.style.transform = 'translate(-50%,-50%)'; wrapper.style.zIndex = 99999; wrapper.style.width = size + 'px'; wrapper.style.height = size + 'px';
  wrapper.style.pointerEvents = 'none'; wrapper.style.opacity = '0';

  const flowers = [ {x:-60,y:10,s:0.62,rot:-12},{x:40,y:-20,s:0.72,rot:8},{x:0,y:20,s:0.86,rot:0},{x:70,y:30,s:0.52,rot:22},{x:-20,y:60,s:0.5,rot:-30} ];
  // create small flower svgs inside wrapper
  flowers.forEach((f,i)=>{
    const el = document.createElement('div'); el.className = 'bouquet-flower';
    el.style.position = 'absolute'; el.style.left = (size/2 + f.x) + 'px'; el.style.top = (size/2 + f.y) + 'px';
    el.style.transform = `translate(-50%,-50%) scale(0.9)`; el.style.width = Math.round(size * f.s) + 'px'; el.style.height = Math.round(size * f.s) + 'px'; el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    // inline SVG for each small flower (simpler petals)
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet"> <defs> <radialGradient id="petalGradSmall${i}" cx="30%" cy="30%" r="70%"> <stop offset="0%" stop-color="#fff0f5"/> <stop offset="60%" stop-color="#ff99cc"/> <stop offset="100%" stop-color="#a14fff"/> </radialGradient> <radialGradient id="centerGradSmall${i}" cx="50%" cy="50%" r="50%"> <stop offset="0%" stop-color="#fff6d6"/> <stop offset="100%" stop-color="#f2c36b"/> </radialGradient> </defs><g transform="translate(300,300)">` +
      Array.from({length:6}).map((_,p)=>`<g transform="rotate(${p*60})"><ellipse cx="0" cy="-95" rx="36" ry="100" fill="url(#petalGradSmall${i})" opacity="0.98" class="petal" style="transform-origin:50% 70%; --rot:${f.rot}deg; animation-delay:${i*12 + p*18}ms"/></g>`).join('') +
      `<circle class="flower-center" cx="0" cy="0" r="34" fill="url(#centerGradSmall${i})" stroke="#d3a24f" stroke-width="3"/></g></svg>`;
    wrapper.appendChild(el);
    // staggered quick pop per small flower with fade
    setTimeout(()=>{ el.style.transition = 'transform 180ms cubic-bezier(.2,.9,.2,1), opacity 140ms'; el.style.transform = 'translate(-50%,-50%) scale(1)'; el.style.opacity = '1'; }, 30 + i*30);
  });

  document.body.appendChild(wrapper);
  // wrapper fade-in
  requestAnimationFrame(()=>{ wrapper.style.transition = 'opacity 120ms ease'; wrapper.style.opacity = '1'; });
}

// Create signature text with small flower icons, positioned under the flower
function createSignature(x,y,text="--Troy--",size=220){
  try{ const prev = document.getElementById('finalSignature'); if(prev) prev.remove(); }catch(e){}
  const el = document.createElement('div'); el.id = 'finalSignature';
  el.style.position = 'fixed'; el.style.left = x + 'px'; el.style.top = (y + size/2 + 18) + 'px';
  el.style.transform = 'translateX(-50%)'; el.style.zIndex = 100000; el.style.pointerEvents = 'none'; el.style.opacity = 0;
  el.innerHTML = `
    <svg class="sig-flower" width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#ffdca8" /></svg>
    <span class="sig-text">${text}</span>
    <svg class="sig-flower" width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#ffdca8" /></svg>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(()=>{ el.style.transition = 'opacity 900ms ease, transform 900ms ease'; el.style.opacity = 1; el.style.transform = 'translateX(-50%) translateY(0)'; });
}

function signatureCall(){
  try{
    const card = document.getElementById('glassCard');
    if(card){ const r = card.getBoundingClientRect(); setTimeout(()=>createSignature(r.left + r.width/2, r.top + r.height/2, '--Troy--', 220), 650); }
    else { setTimeout(()=>createSignature(innerWidth/2, innerHeight/2, '--Troy--', 220), 650); }
  }catch(e){}
}

// spawn a visible finale of flowers and floating hearts (no overlay)
function endFlowers(){
  // intentionally left empty — no burst or balloons per user preference
}

/* ==========================
   Comments: This file aims to balance visual richness with performance.
   - Galaxy is canvas-driven with many small stars and occasional shooting stars.
   - Nebula layers are CSS gradients for cheap blur and color.
   - Flowers and petals are lightweight DOM elements animated with CSS transforms.
   - Replace the audio <source> in index.html with an actual mp3 for music.
   ========================== */
