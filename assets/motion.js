/* Motion layer — progressive enhancement only.
   Content is fully readable without JavaScript, and every effect is skipped
   when the visitor prefers reduced motion. */
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const mq=matchMedia('(prefers-reduced-motion: reduce)');
 let reduce=mq.matches;
 const hasIO='IntersectionObserver' in window;

 /* ---------- header state, scroll progress, mobile bar ---------- */
 const header=$('.header'),bar=$('.progress span'),mobile=$('.mobile-contact');
 let lastY=scrollY,ticking=false;
 const onScroll=()=>{
  const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  header?.classList.toggle('scrolled',y>8);
  if(bar)bar.style.setProperty('--p',max>0?Math.min(y/max,1):0);
  if(mobile){const down=y>lastY&&y>240;mobile.classList.toggle('away',down&&!reduce);}
  lastY=y;ticking=false;
 };
 addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
 onScroll();

 /* ---------- reveal on scroll ---------- */
 const revealAll=()=>$$('.reveal-pending').forEach(el=>{el.classList.remove('reveal-pending');el.classList.add('reveal-done');});
 if(!reduce&&hasIO){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('reveal-pending');e.target.classList.add('reveal-done');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  $$('[data-reveal]').forEach(el=>{
   if(el.parentElement.closest('[data-reveal]'))return;            // no nested reveals
   if(el.getBoundingClientRect().top<innerHeight*.92)return;        // never hide what is already on screen
   const sibs=[...el.parentElement.children].filter(c=>c.hasAttribute('data-reveal'));
   el.style.setProperty('--d',Math.min(sibs.indexOf(el),5)*80+'ms');
   el.classList.add('reveal-ready','reveal-pending');io.observe(el);
  });
  document.addEventListener('focusin',e=>{const el=e.target.closest('.reveal-pending');if(el){el.classList.remove('reveal-pending');el.classList.add('reveal-done');}});
 }
 addEventListener('beforeprint',revealAll);

 /* ---------- animated counters ---------- */
 const counters=$$('[data-count]');
 if(counters.length&&!reduce&&hasIO){
  const run=el=>{const target=+el.dataset.count,dur=1400,t0=performance.now();
   const step=t=>{const k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,4);el.textContent=Math.round(target*e);if(k<1)requestAnimationFrame(step);};
   requestAnimationFrame(step);};
  const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){run(e.target);cio.unobserve(e.target);}}),{threshold:.6});
  counters.forEach(el=>{el.textContent='0';cio.observe(el);});
  addEventListener('beforeprint',()=>counters.forEach(el=>{el.textContent=el.dataset.count;}));
 }

 /* ---------- sequence lines (process steps, project workflow) ---------- */
 const sequences=$$('[data-steps],[data-flow]');
 if(sequences.length){
  if(reduce||!hasIO){sequences.forEach(s=>{s.style.setProperty('--fill',1);$$('li',s).forEach(li=>li.classList.add('lit'));});}
  else{
   const sio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;sio.unobserve(e.target);
     const list=e.target,items=$$('li',list),n=items.length,per=Math.max(260,1400/n);
     items.forEach((li,i)=>setTimeout(()=>{li.classList.add('lit');list.style.setProperty('--fill',n>1?i/(n-1):1);},250+i*per));
   }),{threshold:.45});
   sequences.forEach(s=>sio.observe(s));
  }
 }
 // smooth fill transitions are defined here so the CSS file stays declarative
 const style=document.createElement('style');
 style.textContent='.steps::after,.flow::after{transition:transform .5s cubic-bezier(.2,.7,.2,1)}';
 document.head.append(style);

 /* ---------- live workflow monitor (home hero) ---------- */
 const monitor=$('.monitor');
 if(monitor){
  const clock=$('.mon-clock',monitor),stages=$$('.stage',monitor),devices=$$('.devices span',monitor),
        ops=$$('.op-step',monitor),result=$('.op-result',monitor),log=$('.log',monitor);
  const pad=n=>String(n).padStart(2,'0');
  const tick=()=>{const d=new Date();clock.textContent=`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;};
  tick();setInterval(tick,1000);
  let part=411,dev=0,timer=null;
  const set=(i)=>stages.forEach((s,j)=>s.classList.toggle('on',j===i));
  const cycle=async()=>{
   const wait=ms=>new Promise(r=>timer=setTimeout(r,ms));
   while(true){
    // 1. read the hardware
    set(0);devices.forEach((d,i)=>d.classList.toggle('hit',i===dev));await wait(1100);
    // 2. guide the operation
    set(1);ops[0].classList.add('hit');await wait(450);ops[1].classList.add('hit');await wait(450);result.classList.add('show');await wait(700);
    // 3. record what matters
    set(2);part++;
    const row=document.createElement('div');row.className='log-row new';
    row.innerHTML=`<span>#0${part}</span><span class="ok">OK</span><span>${devices[dev].textContent.trim()} · saved</span>`;
    log.append(row);while(log.children.length>3)log.firstElementChild.remove();
    await wait(1300);
    devices.forEach(d=>d.classList.remove('hit'));ops.forEach(o=>o.classList.remove('hit'));result.classList.remove('show');
    dev=(dev+1)%devices.length;
    if(document.hidden)await new Promise(r=>document.addEventListener('visibilitychange',r,{once:true}));
   }
  };
  const seed=$('.log-row',monitor);if(seed)seed.lastElementChild.textContent='Instrument · saved';
  if(reduce){stages.forEach(s=>s.classList.add('on'));devices.forEach(d=>d.classList.add('hit'));ops.forEach(o=>o.classList.add('hit'));result.classList.add('show');}
  else setTimeout(cycle,1100);
 }

 /* ---------- pointer spotlight on project cards ---------- */
 if(!reduce&&matchMedia('(hover:hover)').matches){
  document.addEventListener('pointermove',e=>{const c=e.target.closest?.('.project-card');if(!c)return;const r=c.getBoundingClientRect();
   c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');},{passive:true});
 }

 /* ---------- services scroll-spy ---------- */
 const spy=$$('[data-spy]');
 if(spy.length&&hasIO){
  const map=new Map(spy.map(a=>[a.dataset.spy,a]));
  const vio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){spy.forEach(a=>a.classList.remove('active'));map.get(e.target.id)?.classList.add('active');}}),{rootMargin:'-40% 0px -55% 0px'});
  map.forEach((_,id)=>{const t=document.getElementById(id);if(t)vio.observe(t);});
  spy[0].classList.add('active');
 }

 /* ---------- FAQ: animate open / close height ---------- */
 $$('.faq details').forEach(d=>{
  const sum=$('summary',d),body=$('.details-body',d);if(!sum||!body)return;
  sum.addEventListener('click',e=>{
   if(reduce||!body.animate)return;
   e.preventDefault();
   if(d.open){const h=body.offsetHeight;const a=body.animate({height:[h+'px','0px'],opacity:[1,0]},{duration:280,easing:'cubic-bezier(.2,.7,.2,1)'});d.classList.add('closing');a.onfinish=()=>{d.open=false;d.classList.remove('closing');};}
   else{d.open=true;const h=body.offsetHeight;body.animate({height:['0px',h+'px'],opacity:[0,1]},{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});}
  });
 });

 mq.addEventListener?.('change',e=>{reduce=e.matches;if(reduce)revealAll();});
})();
