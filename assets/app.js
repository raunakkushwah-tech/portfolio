'use strict';
/* Core behaviour: navigation, project filters, inquiry form, optional analytics.
   Logic for the form, direct delivery and consent is unchanged from v4. */
(() => {
 const cfg=window.PORTFOLIO_CONFIG||{};
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

 /* ---------- mobile navigation ---------- */
 const menu=$('.menu'),nav=$('#nav'),label=$('.menu-label');
 const setMenu=open=>{if(!nav||!menu)return;nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));if(label)label.textContent=open?'Close':'Menu';document.body.classList.toggle('nav-open',open);};
 menu?.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){setMenu(false);menu.focus();}});
 nav?.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
 matchMedia('(min-width: 821px)').addEventListener?.('change',e=>{if(e.matches)setMenu(false);});

 /* ---------- project search & filters ---------- */
 const cards=$$('#project-grid .card'), search=$('#project-search');
 let category='all';
 if(cards.length&&search){
  $('#project-controls').hidden=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const apply=()=>{
   let count=0;const query=search.value.trim().toLowerCase();
   cards.forEach(card=>{
    const visible=(category==='all'||card.dataset.cats.split(' ').includes(category))&&card.textContent.toLowerCase().includes(query);
    const was=!card.hidden;card.hidden=!visible;
    if(visible){count++;if(!was&&!reduce){card.classList.remove('is-entering');void card.offsetWidth;card.classList.add('is-entering');}}
    if(visible){card.classList.remove('reveal-pending');card.classList.add('reveal-done');}
   });
   $('#project-count').textContent=`${count} of ${cards.length} projects`;
   $('#no-results').hidden=count!==0;
   $('#project-grid').classList.toggle('filtered',count!==cards.length);
  };
  // Re-run entrance animation on every visible card when the category changes.
  const replay=()=>{if(reduce)return;let i=0;cards.forEach(c=>{if(c.hidden)return;c.classList.remove('is-entering');void c.offsetWidth;c.style.animationDelay=Math.min(i++,8)*40+'ms';c.classList.add('is-entering');});};
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));apply();replay();}));
  search.addEventListener('input',apply);
  $('#reset-filter').addEventListener('click',()=>{search.value='';$('[data-filter="all"]').click();search.focus();});
  cards.forEach(c=>c.addEventListener('animationend',()=>{c.classList.remove('is-entering');c.style.animationDelay='';}));
 }

 /* ---------- inquiry form ---------- */
 const validHttps=s=>{try{return new URL(s).protocol==='https:';}catch{return false;}};
 // Direct delivery is enabled only when its provider disclosure is configured too.
 const direct=validHttps(cfg.inquiryEndpoint)&&cfg.inquiryProviderName&&validHttps(cfg.inquiryProviderPrivacyUrl);
 const form=$('#inquiry');
 if(form){
  const status=$('#form-status'),submit=$('#submit-inquiry');
  submit.disabled=false;$('#copy-inquiry').disabled=false;
  const inform=(text,error=false)=>{status.hidden=false;status.textContent=text;status.classList.toggle('error',error);};
  const params=new URLSearchParams(location.search);const service=params.get('service');
  if([...form.elements.service.options].some(o=>o.value===service))form.elements.service.value=service;
  const project=params.get('project');if(project&&/^[a-z0-9-]{1,50}$/.test(project))form.elements.message.value=`I would like to discuss a requirement similar to your ${project.toUpperCase()} project.\n\n`;
  const msg=form.elements.message,now=$('#char-now');
  const countChars=()=>{if(now)now.textContent=msg.value.length;};msg.addEventListener('input',countChars);countChars();
  const data=()=>Object.fromEntries(new FormData(form));
  const compose=d=>`Name: ${d.name}\nCompany: ${d.company||'-'}\nEmail: ${d.email}\nPhone: ${d.phone||'-'}\nService: ${d.service||'Not sure'}\n\n${d.message}`;
  if(direct){submit.textContent='Send inquiry';$('#form-help').textContent='Send your project details directly. A confirmation appears after the inquiry is accepted.';}
  form.addEventListener('submit',async e=>{
   e.preventDefault();form.classList.add('was-validated');if(!form.reportValidity())return;const d=data();if(d._gotcha){inform('Please clear the extra field and try again.',true);return;}
   if(!direct){const mail=`mailto:${'raunakkushwah.tech@gmail.com'}?subject=${encodeURIComponent('Project inquiry — '+d.name)}&body=${encodeURIComponent(compose(d))}`;location.href=mail;inform('Your email app should open with a draft. The inquiry has not been sent by this website. If no app opens, use Copy inquiry and paste it into an email.');return;}
   submit.disabled=true;submit.textContent='Sending…';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(cfg.inquiryEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(d),signal:controller.signal});
    if(!response.ok)throw new Error('Delivery was not accepted');
    inform('Your inquiry was accepted. Thank you for sharing your project details.');form.reset();form.classList.remove('was-validated');countChars();track('inquiry_accepted');
   }catch{inform('We could not confirm delivery. Your details are still here. Copy the inquiry and email raunakkushwah.tech@gmail.com, or try again.',true);}
   finally{clearTimeout(timer);submit.disabled=false;submit.textContent='Send inquiry';}
  });
  $('#copy-inquiry').addEventListener('click',async()=>{const text=compose(data());try{await navigator.clipboard.writeText(text);inform('Inquiry copied. Paste it into your email or WhatsApp conversation.');}catch{let box=$('#copy-fallback');if(!box){box=document.createElement('textarea');box.id='copy-fallback';box.setAttribute('aria-label','Inquiry text to copy');status.after(box);}box.value=text;box.focus();box.select();inform('Select and copy the text below, then paste it into your email.');}});
 }
 const privacy=$('#direct-privacy');
 if(direct&&privacy){privacy.hidden=false;privacy.textContent=`Direct inquiry delivery is enabled using ${cfg.inquiryProviderName}. Submitted form details are transferred to that provider to deliver your message. `;const link=document.createElement('a');link.href=cfg.inquiryProviderPrivacyUrl;link.textContent='Read the provider privacy policy';privacy.append(link);const heading=privacy.previousElementSibling;if(heading)heading.textContent='The contact form sends your inquiry to the configured delivery service when you choose Send inquiry. Phone and WhatsApp links open the relevant service, whose own privacy terms apply.';}

 /* ---------- optional analytics (opt-in) ---------- */
 const measurement=/^G-[A-Z0-9]+$/.test(cfg.gaMeasurementId||'')?cfg.gaMeasurementId:null;
 let enabled=false;
 function track(name){if(enabled&&typeof window.gtag==='function')window.gtag('event',name);}
 if(measurement){
  const banner=$('#consent'),settings=$('#privacy-settings');settings.hidden=false;
  const stored=()=>{try{return localStorage.getItem('portfolio-analytics');}catch{return null;}};
  function start(){if(enabled)return;enabled=true;window['ga-disable-'+measurement]=false;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};window.gtag('js',new Date());window.gtag('config',measurement,{send_page_view:false});window.gtag('event','page_view',{page_location:location.origin+location.pathname,page_title:document.title,page_referrer:document.referrer?new URL(document.referrer).origin:''});const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurement);document.head.append(script);}
  if(stored()==='yes')start();else if(stored()!=='no')banner.hidden=false;
  settings.addEventListener('click',()=>{banner.hidden=false;banner.querySelector('button').focus();});
  $$('[data-consent]').forEach(b=>b.addEventListener('click',()=>{const answer=b.dataset.consent;try{localStorage.setItem('portfolio-analytics',answer);}catch{}banner.hidden=true;if(answer==='yes')start();else{enabled=false;window['ga-disable-'+measurement]=true;document.cookie.split(';').forEach(c=>{const name=c.trim().split('=')[0];if(name.startsWith('_ga')){const pieces=location.hostname.split('.');const domains=['',...pieces.map((_,i)=>'.'+pieces.slice(i).join('.'))];domains.forEach(domain=>{document.cookie=`${name}=; Max-Age=0; path=/`+(domain?`; domain=${domain}`:'');});}});}}));
  const p=$('#analytics-privacy');if(p)p.textContent='Optional Google Analytics measures page visits and contact-link clicks only after you allow it. Form content is not sent as an analytics event. Google processes usage information under its privacy terms.';
 }
 $$('a[href^="tel:"],a[href^="mailto:"],a[href^="https://wa.me/"]').forEach(a=>a.addEventListener('click',()=>track(a.href.startsWith('tel:')?'phone_click':a.href.startsWith('mailto:')?'email_click':'whatsapp_click')));
})();
