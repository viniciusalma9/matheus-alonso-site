/* Matheus Alonso · área do cliente e painel — base compartilhada (API, sessão, login, diálogos, visor). */
(() => {
  'use strict';
  const MA = window.MA;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const app = $('#app');

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const lm = (cls = '', st = '') => `<svg class="lm ${cls}" viewBox="${MA.lm.vb}" aria-hidden="true"${st ? ` style="${st}"` : ''}><path pathLength="1" d="${MA.lm.d}"/></svg>`;
  const logo = (cls = 'logo', id = 'logo-h') => `<svg class="${cls}" viewBox="${id === 'logo-v' ? MA.logoV : MA.logo}" role="img" aria-label="Matheus Alonso, Arquitetura e Interiores"><use href="#${id}"/></svg>`;
  const dataUTC = (s) => (s ? new Date(String(s).replace(' ', 'T') + (String(s).includes('Z') ? '' : 'Z')) : null);
  const fmtData = (s) => { const d = dataUTC(s); return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '') : ''; };
  const fmtDataHora = (s) => { const d = dataUTC(s); return d ? d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '') : ''; };
  const relativo = (s) => {
    const d = dataUTC(s); if (!d) return '';
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 1) return 'agora'; if (m < 60) return `há ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `há ${h} h`;
    const dd = Math.round(h / 24); if (dd < 7) return dd === 1 ? 'ontem' : `há ${dd} dias`;
    return fmtData(s);
  };
  const iniciais = (n) => String(n || '?').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
  const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const ICONE_CAT = { plantas: 'i-planta', renders: 'i-imagem', documentos: 'i-documento', materiais: 'i-amostra', obra: 'i-obra', outros: 'i-arquivo' };
  const icCat = (c) => ICONE_CAT[c] || 'i-arquivo';

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg, erro) {
    const t = $('#toast'); t.textContent = msg; t.classList.toggle('erro', !!erro); t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3400);
  }

  /* ---------- API ---------- */
  const S = { usuario: null, csrf: '', parte_bytes: 1 << 20, categorias: {}, etapas: [], contato: {} };
  async function api(r, { body, query = '', metodo } = {}) {
    const method = metodo || (body !== undefined ? 'POST' : 'GET');
    if (window.MA_MOCK) return window.MA_MOCK(r, { body, query, method });
    const opts = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    if (method === 'POST') {
      opts.headers['X-CSRF'] = S.csrf;
      if (body instanceof FormData) opts.body = body;
      else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body || {}); }
    }
    let res;
    try { res = await fetch(`${MA.api}?r=${encodeURIComponent(r)}${query ? '&' + query : ''}`, opts); }
    catch { throw new Error('Sem conexão com o servidor. Verifique a internet e tente de novo.'); }
    const j = await res.json().catch(() => ({ erro: 'Resposta inesperada do servidor.' }));
    if (res.status === 401 && r !== 'entrar') { S.usuario = null; window.dispatchEvent(new Event('ma:saiu')); }
    if (!res.ok) { const e = new Error(j.erro || 'Algo deu errado.'); e.status = res.status; throw e; }
    if (j.csrf) S.csrf = j.csrf;
    return j;
  }
  async function carregarSessao() { Object.assign(S, await api('sessao')); return S; }
  const urlArquivo = (id, ver) => (window.MA_MOCK_URL ? window.MA_MOCK_URL(id, ver) : `${MA.api}?r=arquivo&id=${id}${ver ? '&ver=1' : ''}`);
  const urlZip = (pid, cat) => `${MA.api}?r=zip&projeto=${pid}${cat ? '&categoria=' + encodeURIComponent(cat) : ''}`;
  function baixar(url, nome) {
    if (window.MA_PREVIA) { toast(`Na prévia o download é simulado${nome ? ': ' + nome : ''}.`); return; }
    const a = document.createElement('a'); a.href = url; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
  }
  async function copiar(txt, msg = 'Copiado.') {
    try { await navigator.clipboard.writeText(txt); }
    catch { const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
    toast(msg);
  }
  async function sair() {
    try { await api('sair', { body: {} }); } catch {}
    S.usuario = null; location.hash = ''; window.dispatchEvent(new Event('ma:saiu'));
  }

  /* ---------- diálogos ---------- */
  function modal({ titulo, corpo, pe = '', largo = false, aoAbrir, aoFechar }) {
    const d = document.createElement('dialog');
    d.className = 'pt-modal' + (largo ? ' pt-modal--largo' : '');
    d.setAttribute('aria-label', titulo);
    d.innerHTML = `<form method="dialog" class="pt-modal-form" novalidate>
      <div class="pt-modal-cab"><h2>${esc(titulo)}</h2><button type="button" class="btn-icon" data-fechar aria-label="Fechar">${ic('i-fechar')}</button></div>
      <div class="pt-modal-corpo">${corpo}</div>${pe ? `<div class="pt-modal-pe">${pe}</div>` : ''}</form>`;
    document.body.append(d);
    const fechar = () => { d.classList.remove('on'); setTimeout(() => { d.close(); d.remove(); aoFechar?.(); }, 300); };
    d.fechar = fechar;
    $$('[data-fechar]', d).forEach((b) => b.addEventListener('click', fechar));
    d.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
    d.addEventListener('close', () => setTimeout(() => d.remove(), 350));
    $('form', d).addEventListener('submit', (e) => { if (!e.defaultPrevented && !e.submitter?.hasAttribute('data-fechar')) e.preventDefault(); });
    d.addEventListener('click', (e) => { if (e.target === d) fechar(); });
    d.showModal(); requestAnimationFrame(() => d.classList.add('on'));
    aoAbrir?.(d);
    return d;
  }
  function confirmar(titulo, texto, rotulo = 'Confirmar') {
    return new Promise((ok) => {
      let r = false;
      const d = modal({ titulo, corpo: `<p>${texto}</p>`, pe: `<button type="button" class="btn btn-line btn-sm" data-fechar>Cancelar</button><button type="button" class="btn btn-sm" data-ok>${esc(rotulo)}</button>`, aoFechar: () => ok(r) });
      $('[data-ok]', d).addEventListener('click', () => { r = true; d.fechar(); });
    });
  }
  function carregando(btn, on) { if (!btn) return; btn.classList.toggle('is-loading', on); btn.disabled = on; }
  const campo = (id, rotulo, attrs = '', ajuda = '') => `<div class="field"><label for="${id}">${rotulo}</label><div class="field-line"><input class="input" id="${id}" ${attrs}></div>${ajuda ? `<p class="help">${ajuda}</p>` : ''}</div>`;
  const campoSenha = (id, rotulo, attrs = '') => `<div class="field"><label for="${id}">${rotulo}</label><div class="field-line pt-senha"><input class="input" id="${id}" type="password" ${attrs}><button type="button" data-ver-senha aria-label="Mostrar senha">${ic('i-olho', 'ic-sm')}</button></div></div>`;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver-senha]'); if (!b) return;
    const i = b.parentElement.querySelector('input'); const ver = i.type === 'password';
    i.type = ver ? 'text' : 'password'; b.setAttribute('aria-label', ver ? 'Ocultar senha' : 'Mostrar senha');
  });

  /* ---------- visor de imagens ---------- */
  function visor(itens, i = 0) {
    let at = i;
    const d = document.createElement('dialog'); d.className = 'pt-visor'; d.setAttribute('aria-label', 'Visualizar imagem');
    d.innerHTML = `<div class="pt-visor-top"><span data-nome></span><div class="row" style="gap:8px"><button type="button" class="btn btn-sm" data-baixar>${ic('i-baixar')} Baixar</button><button type="button" class="btn-icon" data-fechar aria-label="Fechar">${ic('i-fechar')}</button></div></div>
      <div class="pt-visor-palco"><img alt="" data-img></div>
      <div class="pt-visor-pe"><button type="button" class="btn-icon" data-ant aria-label="Anterior">${ic('i-seta-esq')}</button><span class="t-note" style="color:rgb(var(--creme-rgb)/.7)" data-cont></span><button type="button" class="btn-icon" data-prox aria-label="Próxima">${ic('i-seta')}</button></div>`;
    document.body.append(d);
    const mostrar = (k) => {
      at = (k + itens.length) % itens.length; const it = itens[at];
      $('[data-img]', d).src = urlArquivo(it.id, true); $('[data-img]', d).alt = it.nome;
      $('[data-nome]', d).textContent = it.nome; $('[data-cont]', d).textContent = `${at + 1} de ${itens.length}`;
    };
    const fechar = () => { d.close(); d.remove(); };
    $('[data-fechar]', d).onclick = fechar;
    $('[data-ant]', d).onclick = () => mostrar(at - 1);
    $('[data-prox]', d).onclick = () => mostrar(at + 1);
    $('[data-baixar]', d).onclick = () => baixar(urlArquivo(itens[at].id), itens[at].nome);
    d.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') mostrar(at - 1); if (e.key === 'ArrowRight') mostrar(at + 1); });
    d.addEventListener('close', () => d.remove());
    let x0 = null;
    d.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    d.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mostrar(at + (dx < 0 ? 1 : -1)); x0 = null; });
    if (itens.length < 2) { $('[data-ant]', d).hidden = true; $('[data-prox]', d).hidden = true; }
    mostrar(i); d.showModal();
  }
  function abrirArquivo(a, lista) {
    if (a.imagem) { const imgs = (lista || [a]).filter((x) => x.imagem); visor(imgs, Math.max(0, imgs.findIndex((x) => x.id === a.id))); return; }
    if (a.visualizavel && !window.MA_PREVIA) { window.open(urlArquivo(a.id, true), '_blank', 'noopener'); return; }
    baixar(urlArquivo(a.id), a.nome);
  }

  /* ---------- telas de acesso ---------- */
  const FOTOS_LOGIN = [
    ['casa-de-campo/varanda', 'Uma casa que recebe antes mesmo da porta, e que convida a ficar.', 'Casa de Campo'],
    ['casa-varanda/gourmet', 'Arquitetura não é apenas construir espaços. É sobre a forma como eles serão vividos.', 'Casa Varanda'],
    ['casa-de-campo/circulacao', 'Cada detalhe começa no planejamento.', 'Casa de Campo'],
  ];
  function moldeAcesso(miolo) {
    const [f, frase, proj] = FOTOS_LOGIN[Math.floor(Math.random() * FOTOS_LOGIN.length)];
    app.innerHTML = `<main class="pt-login pt-entra" id="principal" tabindex="-1">
      <figure class="pt-login-foto"><img src="${MA.img}${f}.webp" alt="">${lm()}<blockquote>${esc(frase)}</blockquote><figcaption>${esc(proj)} · Matheus Alonso</figcaption></figure>
      <div class="pt-login-lado">
        <a href="${MA.site}" aria-label="Voltar ao site">${logo()}</a>
        <div class="pt-login-form">${miolo}</div>
        <div class="pt-login-rodape"><a class="link-sub" href="${MA.site}">Voltar ao site</a><span>Acesso protegido ${ic('i-cadeado', 'ic-sm')}</span></div>
      </div></main>`;
  }
  function contatoEscritorio() {
    const c = S.contato || {};
    if (c.whatsapp) return `<a class="btn btn-line btn-sm" href="https://wa.me/${esc(c.whatsapp)}?text=${encodeURIComponent('Olá, Matheus! Preciso de um novo link de acesso à área do cliente.')}" target="_blank" rel="noopener">${ic('i-whatsapp')} Falar no WhatsApp</a>`;
    if (c.email) return `<a class="btn btn-line btn-sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Novo link de acesso à área do cliente')}">${ic('i-email')} Enviar e-mail</a>`;
    return `<a class="link-fio" href="${MA.site}contato">Fale com o escritório</a>`;
  }
  function telaLogin({ titulo, sub, aoEntrar }) {
    moldeAcesso(`<div class="stack" style="gap:14px"><p class="eyebrow"><b>${esc(titulo)}</b></p><h1>Bem-vindo.</h1><p class="t-lead">${esc(sub)}</p></div>
      <form class="form" data-login novalidate>
        <div data-erro></div>
        ${campo('l-email', 'E-mail', 'type="email" name="email" autocomplete="username" required inputmode="email"')}
        ${campoSenha('l-senha', 'Senha', 'name="senha" autocomplete="current-password" required')}
        <button class="btn" type="submit">Entrar ${ic('i-seta')}</button>
        <p class="t-small muted">Primeiro acesso? Use o link que você recebeu do escritório. <button type="button" class="pt-link" data-esqueci>Esqueci minha senha</button></p>
      </form>`);
    const f = $('[data-login]');
    setTimeout(() => $('#l-email').focus(), 100);
    $('[data-esqueci]').onclick = () => modal({ titulo: 'Esqueceu a senha?', corpo: `<p>Por segurança, um novo acesso é gerado pelo escritório. Peça um novo link e você cria uma senha nova em poucos segundos.</p><div>${contatoEscritorio()}</div>` });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = f.email.value.trim(), senha = f.senha.value, btn = $('[type=submit]', f), err = $('[data-erro]', f);
      err.innerHTML = '';
      if (!email || !senha) { err.innerHTML = `<p class="pt-erro">Informe e-mail e senha.</p>`; return; }
      carregando(btn, true);
      try { const j = await api('entrar', { body: { email, senha } }); S.usuario = j.usuario; aoEntrar(); }
      catch (x) { err.innerHTML = `<p class="pt-erro" role="alert">${esc(x.message)}</p>`; carregando(btn, false); f.senha.select(); }
    });
  }
  async function telaConvite(token, aoEntrar) {
    let u;
    try { u = await api('convite', { body: { token } }); }
    catch (x) {
      moldeAcesso(`<div class="stack" style="gap:14px"><p class="eyebrow"><b>Primeiro acesso</b></p><h1>Link expirado.</h1><p class="t-lead">${esc(x.message)}</p></div><div class="row">${contatoEscritorio()}<button type="button" class="link-fio" data-ir-login>Já tenho senha</button></div>`);
      $('[data-ir-login]').onclick = () => { location.hash = ''; aoEntrar(); };
      return;
    }
    moldeAcesso(`<div class="stack" style="gap:14px"><p class="eyebrow"><b>Primeiro acesso</b></p><h1>Olá, ${esc(primeiroNome(u.nome))}.</h1><p class="t-lead">Crie uma senha para acompanhar o seu projeto. Seu login é <strong>${esc(u.email)}</strong>.</p></div>
      <form class="form" data-convite novalidate><div data-erro></div>
        ${campoSenha('c-s1', 'Nova senha', 'name="s1" autocomplete="new-password" minlength="8" required')}
        ${campoSenha('c-s2', 'Repita a senha', 'name="s2" autocomplete="new-password" minlength="8" required')}
        <p class="help">Use pelo menos 8 caracteres.</p>
        <button class="btn" type="submit">Criar senha e entrar ${ic('i-seta')}</button></form>`);
    const f = $('[data-convite]');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('[data-erro]', f), btn = $('[type=submit]', f);
      err.innerHTML = '';
      if (f.s1.value.length < 8) { err.innerHTML = '<p class="pt-erro">A senha precisa ter pelo menos 8 caracteres.</p>'; return; }
      if (f.s1.value !== f.s2.value) { err.innerHTML = '<p class="pt-erro">As senhas não são iguais.</p>'; return; }
      carregando(btn, true);
      try { const j = await api('convite/senha', { body: { token, senha: f.s1.value } }); S.usuario = j.usuario; history.replaceState(null, '', location.pathname); toast('Senha criada. Bem-vindo!'); aoEntrar(); }
      catch (x) { err.innerHTML = `<p class="pt-erro" role="alert">${esc(x.message)}</p>`; carregando(btn, false); }
    });
  }
  function trocarSenha() {
    const d = modal({ titulo: 'Alterar senha', corpo: `<div data-erro></div>${campoSenha('t-a', 'Senha atual', 'autocomplete="current-password"')}${campoSenha('t-n', 'Nova senha', 'autocomplete="new-password" minlength="8"')}<p class="help">Use pelo menos 8 caracteres.</p>`,
      pe: `<button type="button" class="btn btn-line btn-sm" data-fechar>Cancelar</button><button type="submit" class="btn btn-sm" data-salvar>Salvar senha</button>` });
    $('form', d).addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[data-salvar]', d); carregando(btn, true);
      try { await api('senha', { body: { atual: $('#t-a', d).value, nova: $('#t-n', d).value } }); toast('Senha alterada.'); d.fechar(); }
      catch (x) { $('[data-erro]', d).innerHTML = `<p class="pt-erro">${esc(x.message)}</p>`; carregando(btn, false); }
    });
  }
  function menuUsuario(el) {
    const b = $('[data-menu-usuario]', el), m = $('.pt-menu', el);
    if (!b) return;
    const set = (on) => { m.classList.toggle('on', on); b.setAttribute('aria-expanded', on); };
    b.onclick = (e) => { e.stopPropagation(); set(!m.classList.contains('on')); };
    document.addEventListener('click', () => set(false));
    $('[data-senha]', m)?.addEventListener('click', trocarSenha);
    $('[data-sair]', m)?.addEventListener('click', sair);
  }

  window.PT = { $, $$, app, esc, ic, lm, logo, fmtData, fmtDataHora, relativo, iniciais, primeiroNome, icCat, toast, api, S, carregarSessao, urlArquivo, urlZip, baixar, copiar, sair,
    modal, confirmar, carregando, campo, campoSenha, visor, abrirArquivo, telaLogin, telaConvite, trocarSenha, menuUsuario, contatoEscritorio };
})();
