/* Matheus Alonso · site público — comportamentos (vanilla, sem dependências). Base: DS 2.0 (ds2.js). */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- toast ---------- */
  let toastEl, toastT;
  function toast(msg, erro) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.classList.toggle('erro', !!erro); toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 3200);
  }

  /* ---------- índices automáticos ---------- */
  $$('[data-stagger]').forEach((g) => [...g.children].forEach((c, i) => c.style.getPropertyValue('--i') || c.style.setProperty('--i', i)));
  $$('.linhas').forEach((l) => $$('.ln > span', l).forEach((s, i) => s.style.getPropertyValue('--i') || s.style.setProperty('--i', i)));

  /* ---------- revelação ao rolar ---------- */
  const REVEAL = '.rv, .rv-cortina, .linhas, .tracking-in, [data-stagger], .lm.draw';
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('visible'); io.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const cortinas = new Map();
  const ioPai = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    (cortinas.get(en.target) || []).forEach((c) => c.classList.add('visible')); ioPai.unobserve(en.target);
  }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$(REVEAL).forEach((el) => {
    if (el.matches('.rv-cortina')) { const p = el.parentElement; cortinas.set(p, (cortinas.get(p) || []).concat(el)); ioPai.observe(p); }
    else io.observe(el);
  });

  /* ---------- header, progresso, parallax, processo ---------- */
  const hdr = $('#hdr');
  const fixo = hdr.classList.contains('is-fixo');
  const parEls = new Set();
  const parIO = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? parEls.add(e.target) : parEls.delete(e.target))));
  if (!reduced) $$('[data-par]').forEach((el) => parIO.observe(el));
  const processo = $('[data-processo]');
  const etapas = processo ? $$('.etapa', processo) : [];
  let ticking = false;
  function onScroll() {
    const y = scrollY, max = root.scrollHeight - innerHeight, vh = innerHeight;
    if (!fixo) hdr.classList.toggle('is-solid', y > 50 && !root.classList.contains('menu-open'));
    hdr.style.setProperty('--p', (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4));
    parEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = (r.top + r.height / 2 - vh / 2) * -(+el.dataset.par || 0.1);
      if (el.classList.contains('bg-m')) el.style.setProperty('--par', d.toFixed(1) + 'px'); else el.style.translate = `0 ${d.toFixed(1)}px`;
    });
    if (processo) {
      const r = processo.getBoundingClientRect();
      processo.style.setProperty('--pp', clamp((vh * 0.55 - r.top) / r.height, 0, 1).toFixed(3));
      etapas.forEach((et) => et.classList.toggle('on', et.getBoundingClientRect().top < vh * 0.62));
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- menu tela cheia ---------- */
  const burger = $('.hdr .burger'), menu = $('#menu'), menuImgs = $$('.menu-img img');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', !open);
    if (!fixo) hdr.classList.toggle('is-solid', !open && scrollY > 50);
    else hdr.classList.toggle('is-solid', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('a', menu).focus(), 350); else burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false); });
  $$('.menu-list a').forEach((a) => {
    const show = () => menuImgs.forEach((im, i) => im.classList.toggle('on', i === +(a.dataset.menuImg || 0)));
    a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
  });

  /* ---------- transição de página (cortina com Linha M) ---------- */
  const cortina = $('#page-cortina');
  if (cortina && !reduced) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash) || u.href === location.href) return;
      e.preventDefault();
      cortina.classList.add('cobre');
      setTimeout(() => { location.href = u.href; }, 750);
    });
    addEventListener('pageshow', (e) => { if (e.persisted) cortina.classList.remove('cobre'); });
  }

  /* ---------- cursor "Ver" sobre os projetos ---------- */
  const cur = $('#cursor-ver');
  if (cur && finePointer && !reduced) {
    addEventListener('pointermove', (e) => { cur.style.setProperty('--cx', e.clientX + 'px'); cur.style.setProperty('--cy', e.clientY + 'px'); }, { passive: true });
    $$('[data-cursor-ver] .proj').forEach((p) => {
      p.addEventListener('mouseenter', () => cur.classList.add('on'));
      p.addEventListener('mouseleave', () => cur.classList.remove('on'));
    });
  }

  /* ---------- capa da página inicial: renders em sequência ---------- */
  const capas = $('[data-capas]');
  if (capas && !reduced) {
    const fotos = $$('.capa', capas), links = $$('.capa-link');
    let atual = 0;
    setInterval(() => {
      if (document.hidden) return;
      const prox = (atual + 1) % fotos.length;
      [[fotos, false], [links, true]].forEach(([lista, link]) => {
        lista[atual]?.classList.remove('on'); lista[prox]?.classList.add('on');
        if (link && lista[prox]) { lista[atual].setAttribute('tabindex', '-1'); lista[atual].setAttribute('aria-hidden', 'true'); lista[prox].removeAttribute('tabindex'); lista[prox].removeAttribute('aria-hidden'); }
      });
      atual = prox;
    }, 6500);
  }

  /* ---------- filtro de projetos ---------- */
  const grade = $('[data-grade]');
  if (grade) {
    const btns = $$('[data-filtrar]'), vazio = $('[data-vazio]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filtrar;
      btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
      let n = 0;
      $$('.proj', grade).forEach((p) => { const ok = f === 'todos' || p.dataset.filtro.split(' ').includes(f); p.classList.toggle('is-oculto', !ok); if (ok) { n++; p.classList.add('visible'); } });
      vazio.hidden = n > 0;
    }));
  }

  /* ---------- lightbox da galeria ---------- */
  const lb = $('#lightbox'), itens = $$('[data-lb]');
  if (lb && itens.length) {
    const img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb), cnt = $('[data-lb-count]', lb);
    let at = 0;
    const show = (i) => {
      at = (i + itens.length) % itens.length; const it = itens[at];
      img.classList.remove('on'); img.src = it.dataset.src; img.alt = it.dataset.cap;
      img.onload = () => img.classList.add('on');
      cap.textContent = it.dataset.cap; cnt.textContent = `${String(at + 1).padStart(2, '0')} / ${String(itens.length).padStart(2, '0')}`;
    };
    itens.forEach((b, i) => b.addEventListener('click', () => { show(i); lb.showModal(); requestAnimationFrame(() => lb.classList.add('on')); }));
    const close = () => { lb.classList.remove('on'); setTimeout(() => lb.close(), 400); };
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => show(at - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => show(at + 1));
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); if (e.key === 'Escape') { e.preventDefault(); close(); } });
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* ---------- formulário de contato ---------- */
  $$('[data-contato]').forEach((form) => {
    const tipo = form.querySelector('[name="tipo"]'), st = $('[data-status]', form);
    $$('[data-chip]', form).forEach((c) => c.addEventListener('click', () => {
      $$('[data-chip]', form).forEach((x) => x.setAttribute('aria-pressed', x === c)); tipo.value = c.dataset.chip;
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      $$('.field', form).forEach((f) => f.classList.remove('is-erro'));
      const nome = form.nome.value.trim(), email = form.email.value.trim();
      const erros = [];
      if (!nome) erros.push(form.nome);
      if (!/^\S+@\S+\.\S+$/.test(email)) erros.push(form.email);
      if (erros.length) { erros.forEach((i) => i.closest('.field').classList.add('is-erro')); st.textContent = 'Confira nome e e-mail.'; erros[0].focus(); return; }
      const btn = form.querySelector('[type="submit"]');
      btn.classList.add('is-loading'); st.textContent = '';
      try {
        if (window.MA_PREVIA) { await new Promise((r) => setTimeout(r, 900)); }
        else {
          const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.erro || 'Não foi possível enviar agora.');
        }
        form.innerHTML = `<div class="form-ok"><svg class="lm draw visible" viewBox="0 -3.01 602.56 125.89" aria-hidden="true"><path pathLength="1" d="M0 116.9 C69.45 77.93 138.9 38.96 208.35 0 C238.41 47.19 301.44 70.47 354.96 54.15 C388.14 44.03 419.01 20.36 453.47 24.38 C513.49 31.39 542.22 116.66 602.56 119.86"/></svg><h3 class="t-h3">Mensagem recebida, ${nome.split(' ')[0].replace(/[<>&"]/g, '')}.</h3><p class="muted">Eu respondo pessoalmente em breve para marcarmos uma conversa.</p></div>`;
      } catch (err) {
        btn.classList.remove('is-loading'); st.textContent = err.message; toast(err.message, true);
      }
    });
  });
})();
