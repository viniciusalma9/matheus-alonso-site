/* Matheus Alonso · área do cliente. Rotas: #/ (projetos), #/projeto/ID, #convite=TOKEN */
(() => {
  'use strict';
  const { $, $$, app, esc, ic, lm, logo, fmtData, relativo, iniciais, primeiroNome, icCat, toast, api, S, carregarSessao,
    urlArquivo, urlZip, baixar, abrirArquivo, telaLogin, telaConvite, menuUsuario, contatoEscritorio } = window.PT;
  const MA = window.MA;
  let projetos = [];
  const estado = { cat: 'todos', busca: '', vista: 'lista' };
  try { estado.vista = localStorage.getItem('ma-vista') || 'lista'; } catch {}

  function topo() {
    const u = S.usuario;
    return `<header class="pt-topo"><div class="wrap pt-topo-in">
      <div class="pt-marca"><a href="#/" aria-label="Meus projetos">${logo()}</a><span class="tag">Área do cliente</span></div>
      <div class="pt-usuario">
        <button type="button" data-menu-usuario aria-haspopup="true" aria-expanded="false"><span class="pt-avatar" aria-hidden="true">${esc(iniciais(u.nome))}</span><span class="pt-usuario-nome">${esc(u.nome)}<small>${esc(u.email)}</small></span></button>
        <div class="pt-menu" role="menu">
          <a href="#/" role="menuitem">${ic('i-pasta', 'ic-sm')} Meus projetos</a>
          ${u.papel === 'admin' ? `<a href="${MA.site}painel/" role="menuitem">${ic('i-grade', 'ic-sm')} Ir para o painel</a>` : ''}
          <button type="button" data-senha role="menuitem">${ic('i-cadeado', 'ic-sm')} Alterar senha</button>
          <a href="${MA.site}" role="menuitem">${ic('i-link', 'ic-sm')} Ver o site</a>
          <hr><button type="button" data-sair role="menuitem">${ic('i-sair', 'ic-sm')} Sair</button>
        </div>
      </div></div></header>`;
  }
  const etapasMini = (p) => `<div class="pt-etapas-mini" style="--n:${p.total_etapas}">${Array.from({ length: p.total_etapas }, (_, i) => `<i class="${i + 1 < p.etapa ? 'feita' : i + 1 === p.etapa ? 'atual' : ''}"></i>`).join('')}</div>`;

  /* ---------- lista de projetos ---------- */
  async function telaProjetos() {
    const j = await api('projetos'); projetos = j.projetos;
    if (projetos.length === 1 && S.usuario.papel !== 'admin' && !(() => { try { return sessionStorage.getItem('ma-lista'); } catch { return null; } })()) { location.replace('#/projeto/' + projetos[0].id); return; }
    const hora = new Date().getHours(), saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    app.innerHTML = topo() + `<main class="wrap pt-corpo pt-entra" id="principal" tabindex="-1">
      <div class="pt-intro"><p class="eyebrow"><b>${saud}, ${esc(primeiroNome(S.usuario.nome))}</b></p><h1>${projetos.length ? 'Seus projetos.' : 'Tudo pronto por aqui.'}</h1></div>
      ${projetos.length ? `<div class="pt-projetos">${projetos.map((p) => `
        <a class="pt-projeto" href="#/projeto/${p.id}">
          <div class="pt-projeto-foto">${p.capa ? `<img src="${esc(p.capa)}" alt="" loading="lazy">` : lm()}${p.novos ? `<span class="pt-selo">${p.novos} ${p.novos > 1 ? 'novos' : 'novo'}</span>` : ''}</div>
          <div class="stack" style="gap:8px"><h2>${esc(p.nome)}</h2><p>${esc(p.tipo)}${p.local ? ' · ' + esc(p.local) : ''}</p>${etapasMini(p)}<p>Etapa ${p.etapa} de ${p.total_etapas} · ${esc(p.etapa_nome)}</p></div>
        </a>`).join('')}</div>`
        : `<div class="pt-vazio"><svg class="ilus" viewBox="0 0 100 100" aria-hidden="true"><use href="#casa"/></svg><h3>Seu projeto ainda está sendo preparado.</h3><p>Assim que os primeiros arquivos estiverem prontos, eles aparecem aqui. Qualquer dúvida, fale com o escritório.</p>${contatoEscritorio()}</div>`}
    </main>`;
    menuUsuario(app); $('#principal').focus({ preventScroll: true });
  }

  /* ---------- projeto ---------- */
  let atual = null;
  async function telaProjeto(id) {
    const [j, listaProj] = await Promise.all([api('projeto', { query: 'id=' + id }), projetos.length ? null : api('projetos')]);
    if (listaProj) projetos = listaProj.projetos;
    atual = j.projeto;
    const p = atual, et = p.etapas.find((e) => e.n === p.etapa) || {};
    const cats = S.categorias;
    const cont = { todos: p.arquivos.length }; p.arquivos.forEach((a) => { cont[a.categoria] = (cont[a.categoria] || 0) + 1; });
    if (estado.cat !== 'todos' && !cont[estado.cat]) estado.cat = 'todos';
    const novos = p.arquivos.filter((a) => a.novo).length;
    const c = S.contato || {};
    app.innerHTML = topo() + `<main id="principal" tabindex="-1" class="pt-entra">
      <section class="pt-capa${p.capa ? '' : ' pt-capa--sem-foto'}">${p.capa ? `<img src="${esc(p.capa)}" alt="">` : lm()}
        <div class="wrap pt-capa-in">
          <div>${projetos.length > 1 || S.usuario.papel === 'admin' ? `<a class="pt-voltar" href="#/" data-lista>${ic('i-seta-esq', 'ic-sm')} Meus projetos</a>` : ''}
            <p class="eyebrow"><b>${esc(p.tipo)}</b></p><h1>${esc(p.nome)}</h1>
            <div class="pt-capa-meta">${p.local ? `<span>${esc(p.local)}</span>` : ''}<span>${p.total_arquivos} ${p.total_arquivos === 1 ? 'arquivo' : 'arquivos'}</span><span>Atualizado ${esc(relativo(p.atualizado_em))}</span></div></div>
          <div class="pt-capa-acoes">${p.total_arquivos ? `<button type="button" class="btn btn-creme" data-zip>${ic('i-zip')} Baixar tudo (.zip)</button>` : ''}</div>
        </div>
      </section>
      <div class="wrap pt-corpo">
        <section aria-labelledby="et-t">
          <h2 class="sr-only" id="et-t">Etapas do projeto</h2>
          <ol class="pt-etapas" style="--n:${p.etapas.length}">${p.etapas.map((e) => `<li class="pt-etapa ${e.n < p.etapa ? 'feita' : e.n === p.etapa ? 'atual' : ''}"${e.n === p.etapa ? ' aria-current="step"' : ''}><span>${String(e.n).padStart(2, '0')}</span><b>${esc(e.nome)}</b></li>`).join('')}</ol>
          <div class="pt-etapa-atual"><p class="eyebrow"><b>Agora · etapa ${p.etapa} de ${p.etapas.length}</b></p><p><strong style="color:var(--texto)">${esc(et.nome || '')}.</strong> ${esc(et.texto || '')}</p></div>
        </section>
        <div class="pt-grade">
          <section class="pt-bloco" aria-labelledby="arq-t">
            <div class="pt-bloco-cab"><h2 id="arq-t">Arquivos ${novos ? `<span class="pt-selo">${novos} ${novos > 1 ? 'novos' : 'novo'}</span>` : ''}</h2>
              <div class="segmented" role="group" aria-label="Modo de exibição"><button type="button" data-vista="lista" aria-pressed="${estado.vista === 'lista'}">${ic('i-lista', 'ic-sm')}<span class="sr-only">Lista</span></button><button type="button" data-vista="grade" aria-pressed="${estado.vista === 'grade'}">${ic('i-grade', 'ic-sm')}<span class="sr-only">Grade</span></button></div></div>
            ${p.arquivos.length ? `
            <div class="pt-abas" role="tablist" aria-label="Categorias">
              <button type="button" class="pt-aba" role="tab" data-cat="todos" aria-selected="${estado.cat === 'todos'}">Todos <small>${cont.todos}</small></button>
              ${Object.entries(cats).filter(([k]) => cont[k]).map(([k, v]) => `<button type="button" class="pt-aba" role="tab" data-cat="${k}" aria-selected="${estado.cat === k}">${ic(icCat(k), 'ic-sm')} ${esc(v)} <small>${cont[k]}</small></button>`).join('')}
            </div>
            <div class="pt-ferramentas"><label class="pt-busca">${ic('i-busca', 'ic-sm')}<span class="sr-only">Buscar arquivo</span><input class="input" type="search" placeholder="Buscar arquivo" data-busca value="${esc(estado.busca)}"></label><button type="button" class="link-fio" data-zip-cat hidden>Baixar esta pasta</button></div>
            <div data-arquivos></div>`
            : `<div class="pt-vazio"><svg class="ilus" viewBox="0 0 100 100" aria-hidden="true"><use href="#casa"/></svg><h3>Os arquivos chegam em breve.</h3><p>Plantas, imagens e documentos aparecem aqui assim que cada etapa for concluída.</p></div>`}
          </section>
          <aside class="pt-lateral">
            <section class="pt-cartao" aria-labelledby="nov-t"><h3 id="nov-t">Novidades</h3>
              ${p.atualizacoes.length ? `<ol class="pt-novidades">${p.atualizacoes.slice(0, 8).map((n) => `<li class="pt-novidade"><time datetime="${esc(n.criado_em)}">${esc(fmtData(n.criado_em))}</time><p>${esc(n.texto)}</p></li>`).join('')}</ol>` : '<p class="t-small muted">As novidades do projeto aparecem aqui.</p>'}
            </section>
            ${p.descricao ? `<section class="pt-cartao"><h3>Sobre o projeto</h3><p class="t-small">${esc(p.descricao)}</p></section>` : ''}
            <section class="pt-cartao"><h3>Fale com o arquiteto</h3><p class="t-small muted">Dúvida sobre algum arquivo ou etapa? Estou por perto.</p>
              <div class="stack" style="gap:10px">
                ${c.whatsapp ? `<a class="btn btn-sm" href="https://wa.me/${esc(c.whatsapp)}?text=${encodeURIComponent(`Olá, Matheus! Sobre o projeto ${p.nome}: `)}" target="_blank" rel="noopener">${ic('i-whatsapp')} WhatsApp</a>` : ''}
                ${c.email ? `<a class="btn btn-line btn-sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Projeto ' + p.nome)}">${ic('i-email')} E-mail</a>` : ''}
                ${!c.whatsapp && !c.email ? `<a class="link-fio" href="${MA.site}contato">Enviar mensagem</a>` : ''}
              </div></section>
          </aside>
        </div>
      </div>
    </main>`;
    menuUsuario(app);
    $('[data-lista]')?.addEventListener('click', () => { try { sessionStorage.setItem('ma-lista', '1'); } catch {} });
    $('[data-zip]')?.addEventListener('click', () => baixar(urlZip(p.id), `${p.nome}.zip`));
    $('[data-zip-cat]')?.addEventListener('click', () => baixar(urlZip(p.id, estado.cat), `${p.nome} - ${S.categorias[estado.cat]}.zip`));
    $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { estado.cat = b.dataset.cat; $$('[data-cat]').forEach((x) => x.setAttribute('aria-selected', x === b)); lista(); }));
    $$('[data-vista]').forEach((b) => b.addEventListener('click', () => { estado.vista = b.dataset.vista; try { localStorage.setItem('ma-vista', estado.vista); } catch {} $$('[data-vista]').forEach((x) => x.setAttribute('aria-pressed', x === b)); lista(); }));
    $('[data-busca]')?.addEventListener('input', (e) => { estado.busca = e.target.value; lista(); });
    lista();
    $('#principal').focus({ preventScroll: true }); scrollTo(0, 0);
    if (novos) setTimeout(() => api('visto', { body: { id: p.id } }).catch(() => {}), 1500);
  }

  function lista() {
    const box = $('[data-arquivos]'); if (!box) return;
    const b = estado.busca.trim().toLowerCase();
    const arqs = atual.arquivos.filter((a) => (estado.cat === 'todos' || a.categoria === estado.cat) && (!b || (a.nome + ' ' + a.descricao).toLowerCase().includes(b)));
    const zc = $('[data-zip-cat]'); if (zc) zc.hidden = estado.cat === 'todos' || arqs.length < 2;
    if (!arqs.length) { box.innerHTML = `<p class="t-small muted" style="padding:32px 0">Nenhum arquivo encontrado${b ? ` para “${esc(estado.busca)}”` : ''}.</p>`; return; }
    const cat = (a) => S.categorias[a.categoria] || '';
    if (estado.vista === 'grade') {
      box.innerHTML = `<div class="pt-galeria">${arqs.map((a) => `
        <div class="pt-thumb">
          <button type="button" class="pt-thumb-foto" data-abrir="${a.id}" aria-label="Abrir ${esc(a.nome)}">${a.imagem ? `<img src="${esc(urlArquivo(a.id, true))}" alt="" loading="lazy">` : `<span style="display:grid;place-items:center;height:100%;color:var(--musgo)">${ic(icCat(a.categoria), 'ic-lg')}</span>`}${a.novo ? '<span class="pt-selo">Novo</span>' : ''}</button>
          <div class="pt-thumb-acoes"><button type="button" class="btn-icon" data-baixar="${a.id}" aria-label="Baixar ${esc(a.nome)}">${ic('i-baixar')}</button></div>
          <div><p title="${esc(a.nome)}">${esc(a.nome)}</p><small>${esc(cat(a))} · ${esc(a.tamanho_txt)}</small></div>
        </div>`).join('')}</div>`;
    } else {
      box.innerHTML = `<ul class="pt-arqs">${arqs.map((a) => `
        <li class="pt-arq">
          <span class="pt-arq-ic">${a.imagem ? `<img src="${esc(urlArquivo(a.id, true))}" alt="" loading="lazy">` : ic(icCat(a.categoria))}<span>${esc(a.ext)}</span></span>
          <div class="pt-arq-nome"><b title="${esc(a.nome)}">${esc(a.nome)} ${a.novo ? '<span class="pt-selo">Novo</span>' : ''}</b><small>${esc(a.descricao || cat(a))}</small></div>
          <div class="pt-arq-info">${esc(a.tamanho_txt)}<br>${esc(fmtData(a.enviado_em))}</div>
          <div class="pt-arq-acoes">${a.visualizavel ? `<button type="button" class="btn-icon" data-abrir="${a.id}" aria-label="Visualizar ${esc(a.nome)}">${ic('i-olho')}</button>` : ''}<button type="button" class="btn-icon is-solid" data-baixar="${a.id}" aria-label="Baixar ${esc(a.nome)}">${ic('i-baixar')}</button></div>
        </li>`).join('')}</ul>`;
    }
    const porId = (id) => atual.arquivos.find((a) => a.id === +id);
    $$('[data-abrir]', box).forEach((x) => x.addEventListener('click', () => abrirArquivo(porId(x.dataset.abrir), arqs)));
    $$('[data-baixar]', box).forEach((x) => x.addEventListener('click', () => { const a = porId(x.dataset.baixar); baixar(urlArquivo(a.id), a.nome); }));
  }

  /* ---------- roteamento ---------- */
  async function rota() {
    const h = location.hash;
    const conv = h.match(/convite=([\w-]+)/);
    if (conv) { await telaConvite(conv[1], rota); return; }
    if (!S.usuario) { telaLogin({ titulo: 'Área do cliente', sub: 'Acompanhe as etapas e baixe plantas, imagens e documentos do seu projeto.', aoEntrar: rota }); return; }
    try {
      const m = h.match(/^#\/projeto\/(\d+)/);
      if (m) await telaProjeto(+m[1]);
      else await telaProjetos();
    } catch (x) {
      if (x.status === 401) return;
      if (x.status === 404) { toast(x.message, true); location.hash = '#/'; return; }
      app.innerHTML = topo() + `<main class="wrap pt-corpo"><div class="pt-vazio"><h3>Não foi possível carregar.</h3><p>${esc(x.message)}</p><button class="btn btn-sm" type="button" onclick="location.reload()">Tentar de novo</button></div></main>`;
      menuUsuario(app);
    }
  }
  addEventListener('hashchange', rota);
  addEventListener('ma:saiu', rota);
  carregarSessao().then(rota).catch((x) => { app.innerHTML = `<main class="wrap pt-corpo"><div class="pt-vazio"><h3>Área do cliente indisponível.</h3><p>${esc(x.message)}</p></div></main>`; });
})();
