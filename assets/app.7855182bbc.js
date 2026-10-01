(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const track = (name, detail = {}) => window.dispatchEvent(new CustomEvent('velora:analytics', { detail: { name, page: location.pathname, ...detail } }));
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const menu = $('.menu-toggle'), nav = $('#primary-nav');
  const closeMenu = () => { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded','false'); menu?.setAttribute('aria-label','Open navigation'); };
  menu?.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open',open); menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open?'Close navigation':'Open navigation'); });
  document.addEventListener('keydown', event => { if(event.key==='Escape' && nav?.classList.contains('open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if(nav?.classList.contains('open') && !event.target.closest('.header')) closeMenu(); });
  $$('input[type="date"]').forEach(input => input.min = today);
  $$('.faqs details').forEach(detail => detail.addEventListener('toggle', () => { if(detail.open) track('faq_open'); }));
  $$('.quick-form').forEach(form => {
    const checkRoute = () => { form.elements.to.setCustomValidity(form.elements.from.value.trim().toLowerCase()===form.elements.to.value.trim().toLowerCase()?'Please choose different departure and arrival locations.':''); };
    form.elements.from.addEventListener('input',checkRoute);form.elements.to.addEventListener('input',checkRoute);
    form.addEventListener('submit',() => track('flight_planner_start',{tripType:form.elements.trip.value}));
  });
  const cost = $('#cost-form');
  const updateCost = () => {
    if(!cost?.checkValidity())return;
    const {hours,rate,fees}=cost.elements;
    const value=Number(hours.value)*Number(rate.value)+Number(fees.value);
    $('#cost-result').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  };
  cost?.addEventListener('input',updateCost);
  cost?.addEventListener('submit',event=>{event.preventDefault();updateCost();track('cost_worksheet_use');});
  const aircraftCards = $$('.aircraft-card');
  const compareChoices = $$('[data-compare]');
  const readCategory = card => ({ name:$('h3',card).textContent, passengers:$('.aircraft-meta strong',card).textContent, mission:$('.aircraft-meta > span:last-child',card).textContent, path:$('h3 a',card).getAttribute('href'), selected:!!$('[data-compare]',card)?.checked });
  $('#passenger-filter')?.addEventListener('change',event=>{
    const passengers=Number(event.target.value);let shown=0;
    aircraftCards.forEach(card=>{const visible=Number(card.dataset.capacity)>=passengers;card.hidden=!visible;if(visible)shown++;});
    $('#filter-status').textContent=`${shown} cabin ${shown===1?'category':'categories'} shown. Seating is representative; confirm the actual aircraft.`;
    track('aircraft_filter',{passengers});
  });
  const updateComparison=()=>{
    const selected=aircraftCards.filter(card=>$('[data-compare]',card)?.checked).map(readCategory);
    const container=$('.comparison');if(!container)return;container.hidden=selected.length===0;
    const table=$('#comparison-table');table.replaceChildren();if(!selected.length)return;
    const head=document.createElement('thead'),body=document.createElement('tbody'),row=document.createElement('tr');
    ['Compare cabins',...selected.map(a=>a.name)].forEach(text=>{const cell=document.createElement('th');cell.scope='col';cell.textContent=text;row.append(cell);});head.append(row);
    [['Representative seating','passengers'],['Consider for','mission']].forEach(([label,key])=>{const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=label;tr.append(th);selected.forEach(a=>{const td=document.createElement('td');td.textContent=a[key];tr.append(td);});body.append(tr);});
    table.append(head,body);track('aircraft_compare',{count:selected.length});
  };
  compareChoices.forEach(choice=>choice.addEventListener('change',updateComparison));
  const form=$('#quote-form');
  if(form){
    form.noValidate=true;
    const staticHosting=document.body.dataset.staticHosting==='true';
    const query=new URLSearchParams(location.search),steps=$$('.form-step',form),errors=$('#form-errors');
    if(staticHosting){steps.forEach(step=>step.disabled=false);const submit=$('.submit-enquiry');submit.disabled=false;submit.type='submit';}
    let currentStep=1,started=false;
    for(const name of ['from','to','date','passengers','aircraft','trip','service']){
      const value=query.get(name),field=form.elements[name];
      if(value&&field){if(field.tagName==='SELECT'){if([...field.options].some(o=>o.value===value))field.value=value;}else field.value=value.slice(0,100);}
    }
    form.elements.source.value=(document.referrer&&new URL(document.referrer).origin===location.origin)?new URL(document.referrer).pathname:'/JetRentalWebsite/request-quote/';
    const showStep=(number,focus=true)=>{currentStep=number;steps.forEach(s=>s.hidden=Number(s.dataset.step)!==number);$$('.form-progress li').forEach((li,i)=>{li.classList.toggle('active',i===number-1);if(i===number-1)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});errors.hidden=true;if(focus)$(number===1?'select':'input',steps[number-1]).focus();};
    $('.next-step').hidden=false;$('.prev-step').hidden=false;
    const addLeg=()=>{
      const wrap=$('#extra-legs');if(wrap.children.length>=4)return;
      const index=wrap.children.length+2,div=document.createElement('div');div.className='extra-leg';
      div.innerHTML=`<h3>Additional flight</h3><div class="form-grid"><label>Departure city or airport<input name="legFrom" list="airports" maxlength="100" required></label><label>Arrival city or airport<input name="legTo" list="airports" maxlength="100" required></label><label>Departure date<input name="legDate" type="date" required></label></div><button type="button" class="text-link">Remove this flight −</button>`;
      $('input[type=date]',div).min=form.elements.date.value||today;
      const previous=wrap.lastElementChild;
      $('input[name=legFrom]',div).value=previous?$('input[name=legTo]',previous).value:form.elements.to.value;
      $('button',div).addEventListener('click',()=>{div.remove();$('#add-leg').hidden=wrap.children.length>=4;$('#add-leg').focus();});
      wrap.append(div);$('#add-leg').hidden=wrap.children.length>=4;
      return div;
    };
    const updateTrip=()=>{
      const round=form.elements.trip.value==='round-trip',multi=form.elements.trip.value==='multi-city';
      $('#return-field').hidden=!round;form.elements.returnDate.required=round;form.elements.returnDate.disabled=!round;
      $('#multi-city-fields').hidden=!multi;
      if(multi&&!$('#extra-legs').children.length)addLeg();
      $$('input',$('#extra-legs')).forEach(input=>{input.disabled=!multi;input.required=multi;});
      $('#add-leg').hidden=!multi||$('#extra-legs').children.length>=4;
      form.elements.returnDate.min=form.elements.date.value||today;
    };
    const validateJourney=()=>{
      if(form.elements.trip.value==='multi-city'&&!$('#extra-legs').children.length)addLeg();
      const from=form.elements.from,to=form.elements.to;
      to.setCustomValidity(from.value.trim().toLowerCase()===to.value.trim().toLowerCase()?'Departure and arrival must be different.':'');
      const date=form.elements.date.value;
      form.elements.returnDate.min=date||today;
      let previous=date;
      $$('.extra-leg').forEach(leg=>{
        const origin=$('[name=legFrom]',leg),destination=$('[name=legTo]',leg),departure=$('[name=legDate]',leg);
        departure.min=previous||today;previous=departure.value||previous;
        destination.setCustomValidity(origin.value.trim().toLowerCase()===destination.value.trim().toLowerCase()?'Departure and arrival must be different.':'');
      });
      const fields=$$('input,select,textarea',steps[0]).filter(f=>!f.disabled);
      const invalid=fields.find(field=>!field.checkValidity());
      if(invalid){showStep(1,false);invalid.reportValidity();invalid.focus();return false;}return true;
    };
    $('#add-leg').addEventListener('click',()=>{const leg=addLeg();$('input',leg||$('#extra-legs').lastElementChild)?.focus();});
    form.elements.trip.addEventListener('change',updateTrip);form.elements.date.addEventListener('change',updateTrip);
    form.addEventListener('input',()=>{if(!started){track('enquiry_start');started=true;}form.elements.to.setCustomValidity('');$$('[name=legTo]',form).forEach(f=>f.setCustomValidity(''));});
    $('.next-step').addEventListener('click',()=>{if(validateJourney()){showStep(2);track('enquiry_contact_step');}});
    $('.prev-step').addEventListener('click',()=>showStep(1));
    form.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName==='INPUT'&&currentStep===1){event.preventDefault();$('.next-step').click();}});
    form.addEventListener('submit',async event=>{
      event.preventDefault();errors.hidden=true;
      if(!validateJourney())return;
      const invalid=$$('input,select,textarea',steps[1]).find(field=>!field.disabled&&!field.checkValidity());
      if(invalid){showStep(2,false);invalid.reportValidity();invalid.focus();return;}
      if(staticHosting){
        steps.forEach(step=>step.hidden=true);$('.form-progress').hidden=true;
        $('#success-title').textContent='Your demo brief is ready.';
        $('#success-message').textContent='This is a preview only. Your details have not been sent or saved, and no flight is reserved. Start another journey to try the planner again.';
        $('#success-reference').textContent='';$('#form-success').hidden=false;$('#form-success').focus();
        return;
      }
      const data=new FormData(form),payload=Object.fromEntries(data.entries());
      payload.legs=form.elements.trip.value==='multi-city'?$$('.extra-leg').map(leg=>({from:$('[name=legFrom]',leg).value,to:$('[name=legTo]',leg).value,date:$('[name=legDate]',leg).value})):[];
      delete payload.legFrom;delete payload.legTo;delete payload.legDate;
      const submit=$('.submit-enquiry'),label=submit.textContent;submit.disabled=true;submit.textContent='Saving your enquiry…';form.setAttribute('aria-busy','true');
      try{
        const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'Your enquiry could not be saved. Please try again.');
        steps.forEach(s=>s.hidden=true);$('.form-progress').hidden=true;
        $('#success-title').textContent=result.demo?'Your demo enquiry is saved.':'Your enquiry has been delivered.';
        $('#success-message').textContent=result.demo?'Saved on this computer for the demonstration. No charter provider has received the request and no flight is reserved.':'The business’s enquiry system has accepted your request. Aircraft availability, pricing and any booking require separate confirmation.';
        $('#success-reference').textContent=`Reference: ${result.id}`;$('#form-success').hidden=false;$('#form-success').focus();track('enquiry_success',{demo:result.demo});
      }catch(error){errors.textContent=error.name==='TimeoutError'?'The response timed out. Your request may have arrived; avoid duplicate submissions until its status is checked.':error.message||'There was a connection problem. Please try again.';errors.hidden=false;errors.scrollIntoView({block:'center'});track('enquiry_error');}
      finally{submit.disabled=false;submit.textContent=label;form.removeAttribute('aria-busy');}
    });
    $('#new-enquiry').addEventListener('click',()=>{form.reset();$('#extra-legs').replaceChildren();$('#form-success').hidden=true;$('.form-progress').hidden=false;started=false;updateTrip();showStep(1);});
    updateTrip();showStep(1,false);
  }
  // Optional proposed WebMCP interface: read-only access to the same visible comparison.
  if(document.modelContext?.registerTool&&compareChoices.length){
    const lifecycle=new AbortController();
    try{Promise.resolve(document.modelContext.registerTool({name:'read_aircraft_comparison',title:'Read aircraft comparison',description:'Read the guide categories and the current comparison selection. Does not query live aircraft inventory.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');return {categories:aircraftCards.map(readCategory),passengerFilter:$('#passenger-filter').value,illustrative:true};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();

// Progressive visual enhancement: content stays visible if JS is unavailable.
(() => {
  const cards=[...document.querySelectorAll('.destination-card,.service-card,.aircraft-card,.guide-card')];
  const motion=window.matchMedia?.('(prefers-reduced-motion: no-preference)');
  const fine=window.matchMedia?.('(hover: hover) and (pointer: fine) and (min-width: 961px)');
  if(!motion)return;
  if(motion.matches && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('visual-arrive');entry.target.addEventListener('animationend',()=>entry.target.classList.remove('visual-arrive'),{once:true});observer.unobserve(entry.target);}
    }),{threshold:.08});
    document.querySelectorAll('.destination-grid,.service-grid,.aircraft-grid,.guide-grid,.editorial-visual,.destination-banner').forEach(el=>observer.observe(el));
    motion.addEventListener?.('change',()=>{if(!motion.matches){observer.disconnect();document.querySelectorAll('.visual-arrive').forEach(el=>el.classList.remove('visual-arrive'));}});
  }
  cards.forEach(card=>{
    let frame=0;
    const reset=()=>{cancelAnimationFrame(frame);frame=0;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');};
    card.addEventListener('pointermove',event=>{
      if(!motion.matches||!fine?.matches||event.pointerType==='touch')return;
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect();if(!r.width||!r.height)return;const x=Math.max(-.5,Math.min(.5,(event.clientX-r.left)/r.width-.5));const y=Math.max(-.5,Math.min(.5,(event.clientY-r.top)/r.height-.5));card.style.setProperty('--tilt-x',(-y*5).toFixed(2)+'deg');card.style.setProperty('--tilt-y',(x*5).toFixed(2)+'deg');});
    },{passive:true});
    card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);
    motion.addEventListener?.('change',reset);fine?.addEventListener?.('change',reset);
  });
})();
