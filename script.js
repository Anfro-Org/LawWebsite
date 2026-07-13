(function(){
"use strict";
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=matchMedia('(pointer: fine)').matches;
const isTouch=matchMedia('(pointer: coarse)').matches;
const useSmooth=finePointer&&!reduceMotion;
const vh=()=>innerHeight;

/* ---------- SMOOTH SCROLL ENGINE ---------- */
const smooth=document.getElementById('smooth'),
      content=document.getElementById('page-content'),
      ghost=document.getElementById('ghost');
let target=0,current=0;
function setGhost(){ ghost.style.height=(content.offsetHeight+document.querySelector('.hero-spacer').offsetHeight)+'px'; }
if(useSmooth){
  document.body.classList.add('js-smooth');
  setGhost();
  if('ResizeObserver' in window) new ResizeObserver(setGhost).observe(content);
  addEventListener('resize',setGhost);
}else{
  addEventListener('scroll',()=>{ current=scrollY; onScroll(current); },{passive:true});
}

/* ---------- SCROLL-DRIVEN EFFECTS ---------- */
const heroDim=document.getElementById('hero-dim'),
      heroBg=document.getElementById('hero-bg'),
      heroInner=document.getElementById('hero-inner'),
      sealEl=document.getElementById('seal'),
      progress=document.getElementById('progress'),
      header=document.getElementById('header'),
      spacerEl=document.querySelector('.hero-spacer'),
      fcards=[...document.querySelectorAll('.fcard')];
let lastY=0,ticking=false;
function onScroll(v){
  const h=vh(), spH=spacerEl.offsetHeight,
        max=(useSmooth?spH+content.offsetHeight:document.documentElement.scrollHeight)-h;
  progress.style.width=Math.min(v/max*100,100)+'%';
  /* phase A: headline fades to a ghost   phase B: cards fly through   phase C: content arrives */
  const kText=Math.min(v/(h*.55),1);
  const kDim=Math.max(0,Math.min(v/(Math.max(spH-h,1)),1));
  heroDim.style.opacity=(kDim*1.02).toFixed(3);
  if(!reduceMotion){
    heroInner.style.transform=`translateY(${v*.16}px) scale(${1-kText*.06})`;
    heroInner.style.opacity=(1-kText*.92).toFixed(3);
    heroBg.style.transform=`scale(${1.06+kDim*.07}) translateY(${v*.045}px)`;
    sealEl.style.opacity=(1-kText*2).toFixed(2);
    for(const c of fcards){
      const y=(+c.dataset.start)*h - v*(+c.dataset.speed);
      c.style.transform=`translate3d(0,${y.toFixed(1)}px,0)`;
    }
  }
  /* header hide/show */
  if(v>160&&v>lastY+1&&!document.body.classList.contains('menu-open'))header.classList.add('hide');
  else if(v<lastY-1||v<=160)header.classList.remove('hide');
  lastY=v;
  spy(v);
}

/* ---------- RAF LOOP ---------- */
function raf(){
  if(useSmooth){
    target=scrollY;
    current+=(target-current)*.085;
    if(Math.abs(target-current)<.05)current=target;
    smooth.style.transform=`translate3d(0,${-current}px,0)`;
    onScroll(current);
  }
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* ---------- ANCHORS ---------- */
function scrollToEl(sel){
  if(sel==='#home'){window.scrollTo({top:0,behavior:useSmooth?'auto':'smooth'});return;}
  const el=document.querySelector(sel); if(!el)return;
  const y=current+el.getBoundingClientRect().top-(sel==='#practice'?40:110);
  window.scrollTo({top:Math.max(y,0),behavior:useSmooth?'auto':'smooth'});
}
document.querySelectorAll('[data-anchor]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    document.body.classList.remove('menu-open');
    scrollToEl(a.getAttribute('href'));
  });
});

/* ---------- SCROLL SPY ---------- */
const spyLinks=document.querySelectorAll('[data-spy]');
const spySections=['home','practice','about','faq'];
function spy(v){
  let active='home';
  spySections.forEach(id=>{
    if(id==='home')return;
    const el=document.getElementById(id);
    if(el&&el.getBoundingClientRect().top<vh()*.45)active=id;
  });
  spyLinks.forEach(l=>l.classList.toggle('active',l.dataset.spy===active));
}

/* ---------- PRELOADER ---------- */
const loader=document.getElementById('loader'),lFill=document.getElementById('l-fill'),lCount=document.getElementById('l-count');
let p=0,loaded=false;
function finishLoad(){
  if(loaded)return; loaded=true;
  loader.classList.add('done');
  document.getElementById('home').classList.add('hero-in');
  animateHeroLetters();
  setTimeout(()=>loader.style.display='none',1000);
}
if(reduceMotion)finishLoad();
else{
  const tick=setInterval(()=>{
    p+=Math.random()*15+7;
    if(p>=100){p=100;clearInterval(tick);setTimeout(finishLoad,300);}
    lFill.style.width=p+'%';lCount.textContent=Math.floor(p)+'%';
  },100);
  setTimeout(finishLoad,4000);
}

/* ---------- HERO LETTERS ---------- */
const heroTitle=document.getElementById('hero-title');
(function split(){
  const words=heroTitle.textContent.split(' ');
  heroTitle.textContent='';
  words.forEach((w,wi)=>{
    const ws=document.createElement('span');ws.className='word';
    [...w].forEach(ch=>{const s=document.createElement('span');s.className='ltr';s.textContent=ch;ws.appendChild(s);});
    heroTitle.appendChild(ws);
    if(wi<words.length-1)heroTitle.appendChild(document.createTextNode(' '));
  });
})();
function animateHeroLetters(){
  if(reduceMotion)return;
  document.querySelectorAll('.hero-title .ltr').forEach((el,i)=>{
    el.animate(
      [{transform:'translateY(110%) rotate(6deg)',opacity:0},{transform:'translateY(0) rotate(0)',opacity:1}],
      {duration:950,delay:150+i*48,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}
    );
  });
}
if(reduceMotion)document.querySelectorAll('.hero-title .ltr').forEach(el=>{el.style.transform='none';el.style.opacity='1';});

/* ---------- CURSOR ---------- */
if(finePointer&&!reduceMotion){
  const dot=document.getElementById('cursor-dot'),ring=document.getElementById('cursor-ring'),halo=document.getElementById('cursor-halo');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,hx=mx,hy=my;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px';document.body.classList.add('halo-on');});
  (function loop(){
    rx+=(mx-rx)*.16;ry+=(my-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';
    hx+=(mx-hx)*.09;hy+=(my-hy)*.09;halo.style.transform='translate3d('+hx+'px,'+hy+'px,0)';
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover',e=>{
    if(e.target.closest('a,button,select,input,textarea,label'))document.body.classList.add('cursor-hover');
    else document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mouseleave',()=>document.body.classList.remove('halo-on'));
  document.addEventListener('mouseenter',()=>document.body.classList.add('halo-on'));
}else{
  document.getElementById('cursor-dot').style.display='none';
  document.getElementById('cursor-ring').style.display='none';
  const _halo=document.getElementById('cursor-halo');if(_halo)_halo.style.display='none';
}

/* ---------- REVEALS ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- PRACTICE TREE CONNECTORS ---------- */
const treeSvg=document.getElementById('tree-svg'),tree=document.getElementById('tree'),treeHeading=document.getElementById('tree-heading');
const cards=[...document.querySelectorAll('.p-card')];
let paths=[],dots=[];
function drawTree(){
  if(innerWidth<900){treeSvg.innerHTML=treeSvg.innerHTML.split('</defs>')[0]+'</defs>';return;}
  const defs=treeSvg.querySelector('defs').outerHTML;
  const tRect=tree.getBoundingClientRect(),hRect=treeHeading.getBoundingClientRect();
  const hx=hRect.left+hRect.width/2-tRect.left;
  const hy=hRect.bottom-tRect.top+8;
  let svg='';
  const n=cards.length;
  cards.forEach((c,i)=>{
    const tile=c.querySelector('.p-tile'),r=tile.getBoundingClientRect();
    const cx=r.left+r.width/2-tRect.left, cy=r.top-tRect.top-6;
    const rad=14, dir=cx>hx?1:-1;
    const centerDist=Math.abs(i-(n-1)/2);           /* 2.5 outer … 0.5 center */
    const my=Math.min(cy-24, hy+20+(((n-1)/2)-centerDist)*44); /* outer high, center low */
    let d;
    if(Math.abs(cx-hx)<rad*2){ d=`M ${hx} ${hy} L ${cx} ${cy}`; }
    else{
      d=`M ${hx} ${hy} L ${hx} ${my-rad} Q ${hx} ${my} ${hx+dir*rad} ${my} L ${cx-dir*rad} ${my} Q ${cx} ${my} ${cx} ${my+rad} L ${cx} ${cy}`;
    }
    svg+=`<path d="${d}" data-i="${i}"/>`;
    svg+=`<circle cx="${cx}" cy="${cy}" r="3" data-i="${i}"/>`;
  });
  treeSvg.innerHTML=defs+svg;
  paths=[...treeSvg.querySelectorAll('path')];
  dots=[...treeSvg.querySelectorAll('circle')];
  paths.forEach(pt=>{
    const L=pt.getTotalLength();
    pt.style.strokeDasharray=L; pt.style.strokeDashoffset=treeDrawn?0:L;
  });
  dots.forEach(d=>{d.style.opacity=treeDrawn?1:0;});
}
let treeDrawn=false;
function animateTree(){
  if(treeDrawn)return; treeDrawn=true;
  paths.forEach((pt,i)=>{
    pt.animate([{strokeDashoffset:pt.style.strokeDashoffset},{strokeDashoffset:0}],
      {duration:1100,delay:i*130,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    setTimeout(()=>pt.style.strokeDashoffset=0,1100+i*130);
  });
  dots.forEach((d,i)=>{
    d.animate([{opacity:0},{opacity:1}],{duration:400,delay:900+i*130,fill:'forwards'});
    setTimeout(()=>d.style.opacity=1,1300+i*130);
  });
}
function treeInit(){ drawTree(); }
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(treeInit); else setTimeout(treeInit,600);
addEventListener('resize',()=>{const was=treeDrawn;drawTree();});
new IntersectionObserver(es=>{ if(es[0].isIntersecting){ drawTree(); if(!reduceMotion)animateTree(); else{treeDrawn=true;drawTree();} } },{threshold:.25}).observe(tree);

/* ---------- STAT COUNTERS ---------- */
const statIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target,tgt=+el.dataset.count,suf=el.dataset.suffix||'',dur=1800,t0=performance.now();
  (function step(t){const k=Math.min((t-t0)/dur,1),eased=1-Math.pow(1-k,4);
    el.textContent=Math.floor(eased*tgt)+suf;
    if(k<1)requestAnimationFrame(step);})(t0);
  statIO.unobserve(el);
}),{threshold:.6});
document.querySelectorAll('[data-count]').forEach(el=>statIO.observe(el));

/* ---------- ABOUT TILT ---------- */
if(finePointer&&!reduceMotion){
  const card=document.getElementById('tilt-card'),frame=document.getElementById('about-frame');
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    frame.style.transform=`rotateY(${x*10}deg) rotateX(${-y*10}deg)`;
  });
  card.addEventListener('mouseleave',()=>{frame.style.transition='transform .8s cubic-bezier(.22,1,.36,1)';frame.style.transform='';setTimeout(()=>frame.style.transition='transform .2s linear',800);});
}

/* ---------- FAQ ---------- */
document.querySelectorAll('.faq').forEach(item=>{
  const q=item.querySelector('.faq-q'),a=item.querySelector('.faq-a');
  q.addEventListener('click',()=>{
    const open=item.classList.contains('open');
    document.querySelectorAll('.faq.open').forEach(f=>{
      f.classList.remove('open');f.querySelector('.faq-a').style.maxHeight=null;
      f.querySelector('.faq-q').setAttribute('aria-expanded','false');
    });
    if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';q.setAttribute('aria-expanded','true');}
    setTimeout(setGhostSafe,650);
  });
});
function setGhostSafe(){ if(useSmooth)setGhost(); }

/* ---------- THEME TOGGLE ---------- */
const toggle=document.getElementById('theme-toggle');
toggle.addEventListener('click',()=>{
  const html=document.documentElement;
  const next=html.dataset.theme==='dark'?'light':'dark';
  if(!reduceMotion){
    const ripple=document.createElement('div');
    ripple.className='theme-ripple';
    const r=toggle.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const rad=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy));
    ripple.style.cssText+=`left:${cx}px;top:${cy}px;width:${rad*2}px;height:${rad*2}px;background:${next==='light'?'#F6EFE1':'#0E0A06'};`;
    document.body.appendChild(ripple);
    ripple.animate([{transform:'translate(-50%,-50%) scale(0)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
    setTimeout(()=>{html.dataset.theme=next;ripple.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});setTimeout(()=>ripple.remove(),520);},340);
  }else html.dataset.theme=next;
});

/* ---------- MOBILE MENU ---------- */
document.getElementById('hamburger').addEventListener('click',()=>document.body.classList.toggle('menu-open'));

/* ---------- SELECT / FORM ---------- */
const sel=document.getElementById('f-service');
sel.addEventListener('change',()=>document.getElementById('service-field').classList.toggle('filled',!!sel.value));
const form=document.getElementById('book-form'),success=document.getElementById('success');
form.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('f-name'),email=document.getElementById('f-email');
  let ok=true;
  [name,email,sel].forEach(f=>{if(!f.value){ok=false;f.style.borderBottomColor='#b3452f';setTimeout(()=>f.style.borderBottomColor='',1800);}});
  if(!ok)return;
  success.classList.add('show');
  form.reset();
  document.getElementById('service-field').classList.remove('filled');
});
document.getElementById('success-close').addEventListener('click',()=>success.classList.remove('show'));
success.addEventListener('click',e=>{if(e.target===success)success.classList.remove('show');});

/* ---------- CLIENT REVIEWS CAROUSEL ---------- */
(function reviews(){
  const stage=document.getElementById('rv-stage');
  if(!stage)return;
  const people=[...stage.querySelectorAll('.rv-person')];
  const textEl=document.getElementById('rv-text');
  const quoteBox=document.getElementById('rv-quote');
  const N=people.length;
  if(!N||!textEl||!quoteBox)return;
  let active=0,timer=null,inView=false,hovered=false,swapT=null;

  function setQuote(i,animate){
    const q=people[i].getAttribute('data-quote')||'';
    if(!animate){textEl.textContent=q;return;}
    quoteBox.classList.add('is-swap');
    clearTimeout(swapT);
    swapT=setTimeout(()=>{textEl.textContent=q;quoteBox.classList.remove('is-swap');},320);
  }

  function place(animate){
    people.forEach((el,i)=>{
      const prev=el.dataset.pos||'';
      let pos='prev';
      if(i===active)pos='active';
      else if(i===(active+1)%N)pos='next';
      // an element crossing directly between top(next) and bottom(prev) must not animate through the middle
      const wrap=(prev==='next'&&pos==='prev')||(prev==='prev'&&pos==='next');
      if(!animate||wrap)el.classList.add('rv-noanim');
      el.classList.remove('is-active','is-next','is-prev');
      el.classList.add('is-'+pos);
      el.dataset.pos=pos;
      el.setAttribute('aria-hidden',pos==='active'?'false':'true');
      if(!animate||wrap){void el.offsetWidth;el.classList.remove('rv-noanim');}
    });
    setQuote(active,animate);
  }

  function go(i,animate){active=((i%N)+N)%N;place(animate);}
  function next(){go(active+1,true);}
  function start(){if(timer||reduceMotion)return;timer=setInterval(()=>{if(inView&&!hovered)next();},5000);}
  function stop(){clearInterval(timer);timer=null;}
  function sync(){(inView&&!hovered&&!reduceMotion)?start():stop();}

  place(false); // initial positions, no animation

  people.forEach(el=>{
    el.addEventListener('click',()=>{
      const pos=el.dataset.pos;
      if(pos==='active')return;
      go(pos==='prev'?active-1:active+1,true);
      if(timer){stop();start();} // reset the dwell timer after a manual jump
    });
  });
  stage.addEventListener('mouseenter',()=>{hovered=true;sync();});
  stage.addEventListener('mouseleave',()=>{hovered=false;sync();});
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():sync();});
  new IntersectionObserver(es=>{inView=es[0].isIntersecting;sync();},{threshold:.35}).observe(stage);
})();

document.getElementById('year').textContent=new Date().getFullYear();
})();
