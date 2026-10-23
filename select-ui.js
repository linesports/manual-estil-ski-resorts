(function () {
  'use strict';
  const desktop = matchMedia('(min-width:1024px)');
  const controls = new WeakMap();
  let opened = null, pending = 0;
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const svg = path => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
  function close(restoreFocus = false) {
    if (!opened) return;
    const current = opened; opened = null;
    current.popup.remove(); current.button.setAttribute('aria-expanded', 'false');
    if (restoreFocus && current.button.isConnected) current.button.focus({preventScroll:true});
  }
  function enhance(select) {
    if (controls.has(select) || select.closest('dialog') || !select.id) return;
    const label = select.closest('label'); if (!label) return;
    const caption = label.querySelector(':scope>span');
    if (caption && !caption.id) caption.id = select.id + 'Caption';
    const wrapper = document.createElement('span'); wrapper.className = 'enhanced-select';
    select.before(wrapper); wrapper.append(select);
    select.classList.add('enhanced-select-native'); select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'select-trigger'; button.id = select.id + 'Trigger';
    button.setAttribute('aria-haspopup', 'listbox'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', select.id + 'Options');
    const value = document.createElement('span'); value.id = select.id + 'Value';
    button.setAttribute('aria-labelledby', [caption?.id,value.id].filter(Boolean).join(' '));
    button.append(value); button.insertAdjacentHTML('beforeend', svg('m6 9 6 6 6-6')); button.querySelector('svg').classList.add('select-chevron'); wrapper.append(button);
    const sync = () => { const text = select.selectedOptions[0]?.textContent || 'Selecciona'; if (value.textContent !== text) value.textContent = text; if (button.disabled !== select.disabled) button.disabled = select.disabled; };
    function open(fromKeyboard) {
      if (opened?.select === select) { close(true); return; }
      close(); sync();
      const popup = document.createElement('div'); popup.className = 'select-popup';
      const list = document.createElement('div'); list.className = 'select-options'; list.id = select.id + 'Options'; list.setAttribute('role','listbox'); list.setAttribute('aria-label',caption?.textContent || 'Opcions');
      let search = null;
      if (select.options.length > 8) { search = document.createElement('input'); search.type = 'search'; search.className = 'select-search'; search.placeholder = 'Cerca una opció…'; search.setAttribute('aria-label','Cerca entre les opcions'); popup.append(search); }
      popup.append(list); document.body.append(popup); button.setAttribute('aria-expanded','true');
      function position() {
        const rect = button.getBoundingClientRect(), width = Math.min(Math.max(rect.width,280),innerWidth-32);
        if (rect.bottom < 0 || rect.top > innerHeight) { close(); return; }
        const below = innerHeight-rect.bottom-16, above = rect.top-16, up = below<220&&above>below;
        const maxHeight = Math.max(120,Math.min(380,up?above:below));
        Object.assign(popup.style,{width:width+'px',left:Math.min(Math.max(16,rect.left),innerWidth-width-16)+'px',maxHeight:maxHeight+'px',top:'auto',bottom:'auto'});
        if(up) popup.style.bottom = (innerHeight-rect.top+8)+'px'; else popup.style.top=(rect.bottom+8)+'px';
      }
      opened = {select,button,popup,position}; position();
      function options() { return [...list.querySelectorAll('[role="option"]')]; }
      function render() {
        list.replaceChildren();
        [...select.options].filter(option => !option.disabled && !option.hidden && (!search?.value || normalize(option.textContent).includes(normalize(search.value)))).forEach(option => {
          const item = document.createElement('button'); item.type='button'; item.className='select-option'; item.setAttribute('role','option'); item.setAttribute('aria-selected',String(option.selected)); item.tabIndex=-1;
          const text=document.createElement('span');text.textContent=option.textContent;item.append(text);
          if(option.selected)item.insertAdjacentHTML('beforeend',svg('m5 12 4 4L19 6'));
          item.addEventListener('click',()=>{
            const changed=select.value!==option.value; select.value=option.value; close();sync();button.focus({preventScroll:true});
            if(changed)select.dispatchEvent(new Event('change',{bubbles:true}));
          });list.append(item);
        });
        if(!list.children.length){const empty=document.createElement('p');empty.className='select-empty';empty.textContent='Cap opció coincideix amb la cerca.';list.append(empty);}
      }
      render();search?.addEventListener('input',render);
      popup.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
        if(event.key==='Tab'){close(true);return;}
        const items=options();if(!items.length)return;
        const index=items.indexOf(document.activeElement);
        let next;
        if(event.key==='ArrowDown')next=(index+1)%items.length;
        if(event.key==='ArrowUp')next=(index<=0?items.length:index)-1;
        if(event.key==='Home'&&event.target!==search)next=0;
        if(event.key==='End'&&event.target!==search)next=items.length-1;
        if(next!=null){event.preventDefault();items[next].focus();items[next].scrollIntoView({block:'nearest'});}
        else if(search&&event.target!==search&&event.key.length===1&&!event.metaKey&&!event.ctrlKey){search.focus();search.value=event.key;render();}
      });
      if(search&&!fromKeyboard)search.focus();
      else {const selected=list.querySelector('[aria-selected="true"]')||options()[0];selected?.focus({preventScroll:true});selected?.scrollIntoView({block:'nearest'});}
    }
    button.addEventListener('click',()=>open(false));
    button.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open(true);}});
    select.addEventListener('change',sync);
    new MutationObserver(()=>{sync();if(opened?.select===select)close(true);}).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','selected','label']});
    controls.set(select,{button,sync});sync();
  }
  function scan() {
    pending=0;if(!desktop.matches)return;
    if(opened&&!opened.button.isConnected)close();
    document.querySelectorAll('select').forEach(select=>{enhance(select);controls.get(select)?.sync();});
  }
  function queue(){if(!pending)pending=requestAnimationFrame(scan);}
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('olaf:viewchange',queue);
  document.addEventListener('pointerdown',event=>{if(opened&&!opened.popup.contains(event.target)&&!opened.button.contains(event.target))close();},true);
  document.addEventListener('scroll',event=>{if(opened&&!opened.popup.contains(event.target))opened.position();},true);
  window.addEventListener('resize',()=>close());
  desktop.addEventListener('change',()=>{close();queue();});scan();
})();
