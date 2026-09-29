/* Matheus Alonso · painel do escritório. Rotas: #/ #/projetos #/projeto/ID #/clientes #/contatos */
(() => {
  'use strict';
  const { $, $$, app, esc, ic, lm, logo, fmtData, fmtDataHora, relativo, iniciais, icCat, toast, api, S, carregarSessao,
    urlArquivo, baixar, copiar, sair, modal, confirmar, carregando, campo, abrirArquivo, telaLogin, trocarSenha } = window.PT;
  const MA = window.MA;
  let contatosNovos = 0;

  /* ---------- molde ---------- */
  function molde(ativo, conteudo) {
    const u = S.usuario;
    const item = (r, id, rot, extra = '') => `<li><a href="#/${r}" ${ativo === r ? 'aria-current="page"' : ''}>${ic(id)}<span>${rot}</span>${extra}</a></li>`;
    app.innerHTML = `<div class="pt-painel">
      <nav class="pt-nav" aria-label="Painel">
        <div><a href="#/" aria-label="Visão geral">${logo()}</a><br><span class="tag">Painel</span></div>
        <ul>${item('', 'i-grade', 'Visão geral')}${item('projetos', 'i-pasta', 'Projetos')}${item('clientes', 'i-usuario', 'Clientes')}${item('contatos', 'i-mensagem', 'Contatos', contatosNovos ? `<span class="pt-selo">${contatosNovos}</span>` : '')}</ul>
        <div class="pt-nav-pe"><p class="pt-usuario-nome">${esc(u.nome)}<small>${esc(u.email)}</small></p>
          <a href="${MA.site}" target="_blank" rel="noopener">${ic('i-link', 'ic-sm')} Ver o site</a>
          <a href="#" data-senha>${ic('i-cadeado', 'ic-sm')} Alterar senha</a>
          <a href="#" data-sair>${ic('i-sair', 'ic-sm')} Sair</a></div>
      </nav>
      <main class="pt-main pt-entra" id="principal" tabindex="-1">${conteudo}</main></div>`;
    $('[data-senha]').onclick = (e) => { e.preventDefault(); trocarSenha(); };
    $('[data-sair]').onclick = (e) => { e.preventDefault(); sair(); };
    $('#principal').focus({ preventScroll: true }); scrollTo(0, 0);
  }
  const cab = (eyebrow, titulo, acoes = '') => `<header class="pt-main-cab"><div><p class="eyebrow">${eyebrow}</p><h1>${titulo}</h1></div><div class="row" style="gap:12px">${acoes}</div></header>`;
  const selectOpts = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}"${String(k) === String(sel) ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const etapasObj = () => Object.fromEntries(S.etapas.map((e) => [e.n, `${e.n}. ${e.nome}`]));
  const TIPOS = ['Residencial', 'Interiores', 'Reforma', 'Comercial', 'Institucional', 'Saúde'];

  /* ---------- link de acesso ---------- */
  function mostrarConvite(cliente, link, novo) {
    const txt = `Olá, ${cliente.nome.split(' ')[0]}! Aqui está o seu acesso à área do cliente Matheus Alonso, onde você acompanha as etapas e baixa os arquivos do seu projeto. Crie sua senha por este link: ${link}`;
    const tel = String(cliente.telefone || '').replace(/\D/g, '');
    const wa = `https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(txt)}`;
    modal({
      titulo: novo ? 'Cliente cadastrado' : 'Novo link de acesso',
      corpo: `<p>Envie este link para <strong>${esc(cliente.nome)}</strong>. Com ele, o cliente cria a própria senha. O link vale por 14 dias e funciona uma vez${novo ? '' : '; o link anterior deixa de valer'}.</p>
        <div class="pt-copiar"><code>${esc(link)}</code><button type="button" data-copiar>${ic('i-copiar', 'ic-sm')} Copiar</button></div>`,
      pe: `<a class="btn btn-line btn-sm" href="mailto:${esc(cliente.email)}?subject=${encodeURIComponent('Seu acesso à área do cliente · Matheus Alonso')}&body=${encodeURIComponent(txt)}">${ic('i-email')} E-mail</a><a class="btn btn-sm" href="${esc(wa)}" target="_blank" rel="noopener">${ic('i-whatsapp')} Enviar por WhatsApp</a>`,
      aoAbrir: (d) => { $('[data-copiar]', d).onclick = () => copiar(link, 'Link copiado.'); },
    });
  }
  async function gerarConvite(c) {
    try { const j = await api('admin/cliente/convite', { body: { id: c.id } }); mostrarConvite(c, j.convite, false); }
    catch (x) { toast(x.message, true); }
  }

  /* ---------- formulários ---------- */
  function formCliente(c = {}, depois) {
    const d = modal({
      titulo: c.id ? 'Editar cliente' : 'Novo cliente',
      corpo: `<div data-erro></div>${campo('fc-nome', 'Nome completo', `required value="${esc(c.nome || '')}" autocomplete="off"`)}
        <div class="pt-campos-2">${campo('fc-email', 'E-mail (login)', `type="email" required value="${esc(c.email || '')}" autocomplete="off"`)}${campo('fc-tel', 'WhatsApp', `type="tel" value="${esc(c.telefone || '')}" placeholder="(11) 99999-9999"`)}</div>
        ${c.id ? `<label class="row" style="gap:10px"><input type="checkbox" id="fc-ativo" ${+c.ativo ? 'checked' : ''}> Acesso ativo</label>` : '<p class="help">Depois de salvar, você recebe o link de primeiro acesso para enviar ao cliente.</p>'}`,
      pe: `<button type="button" class="btn btn-line btn-sm" data-fechar>Cancelar</button><button type="submit" class="btn btn-sm" data-salvar>${c.id ? 'Salvar' : 'Cadastrar e gerar acesso'}</button>`,
    });
    setTimeout(() => $('#fc-nome', d).focus(), 80);
    $('form', d).addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[data-salvar]', d); carregando(btn, true);
      const body = { id: c.id || 0, nome: $('#fc-nome', d).value, email: $('#fc-email', d).value, telefone: $('#fc-tel', d).value, ativo: c.id ? ($('#fc-ativo', d).checked ? 1 : 0) : 1 };
      try {
        const j = await api('admin/cliente', { body });
        d.fechar();
        if (j.convite) mostrarConvite({ ...body, id: j.id }, j.convite, true); else toast('Cliente atualizado.');
        depois?.(j.id);
      } catch (x) { $('[data-erro]', d).innerHTML = `<p class="pt-erro">${esc(x.message)}</p>`; carregando(btn, false); }
    });
  }
  async function formProjeto(p = {}, depois) {
    const { clientes } = await api('admin/clientes');
    if (!clientes.length) { toast('Cadastre um cliente primeiro.'); formCliente({}, () => formProjeto(p, depois)); return; }
    const d = modal({
      titulo: p.id ? 'Editar projeto' : 'Novo projeto', largo: true,
      corpo: `<div data-erro></div>
        <div class="pt-campos-2">${campo('fp-nome', 'Nome do projeto', `required value="${esc(p.nome || '')}" placeholder="Ex.: Casa de Campo"`)}
          <div class="field"><label for="fp-cli">Cliente</label><select class="input" id="fp-cli">${selectOpts(Object.fromEntries(clientes.map((c) => [c.id, `${c.nome} · ${c.email}`])), p.cliente_id)}</select></div></div>
        <div class="pt-campos-2"><div class="field"><label for="fp-tipo">Tipo</label><select class="input" id="fp-tipo">${selectOpts(Object.fromEntries(TIPOS.map((t) => [t, t])), p.tipo || 'Residencial')}</select></div>
          ${campo('fp-local', 'Local', `value="${esc(p.local || '')}" placeholder="Bairro, cidade"`)}</div>
        <div class="field"><label for="fp-etapa">Etapa atual</label><select class="input" id="fp-etapa">${selectOpts(etapasObj(), p.etapa || 1)}</select></div>
        <div class="field"><label for="fp-desc">Descrição para o cliente (opcional)</label><div class="field-line"><textarea class="input" id="fp-desc" rows="3" placeholder="Um resumo curto do escopo">${esc(p.descricao || '')}</textarea></div></div>`,
      pe: `<button type="button" class="btn btn-line btn-sm" data-fechar>Cancelar</button><button type="submit" class="btn btn-sm" data-salvar>${p.id ? 'Salvar' : 'Criar projeto'}</button>`,
    });
    setTimeout(() => $('#fp-nome', d).focus(), 80);
    $('form', d).addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[data-salvar]', d); carregando(btn, true);
      try {
        const j = await api('admin/projeto', { body: { id: p.id || 0, nome: $('#fp-nome', d).value, cliente_id: +$('#fp-cli', d).value, tipo: $('#fp-tipo', d).value, local: $('#fp-local', d).value, etapa: +$('#fp-etapa', d).value, descricao: $('#fp-desc', d).value } });
        d.fechar(); toast(p.id ? 'Projeto salvo.' : 'Projeto criado. Agora envie os arquivos.');
        depois ? depois(j.projeto) : (location.hash = '#/projeto/' + j.projeto.id);
      } catch (x) { $('[data-erro]', d).innerHTML = `<p class="pt-erro">${esc(x.message)}</p>`; carregando(btn, false); }
    });
  }

  /* ---------- visão geral ---------- */
  async function telaInicio() {
    const [r, { projetos }] = await Promise.all([api('admin/resumo'), api('projetos')]);
    contatosNovos = r.contatos_novos;
    const h = new Date().getHours();
    molde('', cab(`<b>${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}</b>`, 'Visão geral.', `<button type="button" class="btn btn-line btn-sm" data-novo-cli>${ic('i-mais')} Cliente</button><button type="button" class="btn btn-sm" data-novo-proj>${ic('i-mais')} Projeto</button>`) + `
      <div class="pt-stats">
        <a class="pt-stat" href="#/clientes"><b>${r.clientes}</b><span>clientes com acesso</span></a>
        <a class="pt-stat" href="#/projetos"><b>${r.projetos}</b><span>projetos em andamento</span></a>
        <div class="pt-stat"><b>${r.arquivos}</b><span>arquivos · ${esc(r.espaco)}</span></div>
        <a class="pt-stat" href="#/contatos"><b>${r.contatos_novos}</b><span>contatos novos do site</span></a>
      </div>
      <div class="pt-duas">
        <section class="pt-bloco"><div class="pt-bloco-cab"><h2>Projetos recentes</h2><a class="link-fio" href="#/projetos">Todos</a></div>
          ${projetos.length ? `<ul class="pt-lista-simples">${projetos.slice(0, 6).map((p) => `<li><a href="#/projeto/${p.id}"><b style="font-weight:500">${esc(p.nome)}</b><br><small>Etapa ${p.etapa} · ${esc(p.etapa_nome)} · ${p.total_arquivos} arquivos</small></a><time>${esc(relativo(p.atualizado_em))}</time></li>`).join('')}</ul>`
          : `<div class="pt-vazio"><h3>Nenhum projeto ainda.</h3><p>Cadastre o cliente, crie o projeto e envie os arquivos. O cliente recebe um link para criar a senha.</p><button type="button" class="btn btn-sm" data-novo-proj>Criar primeiro projeto</button></div>`}
        </section>
        <section class="pt-bloco"><div class="pt-bloco-cab"><h2>Últimos downloads</h2></div>
          ${r.downloads.length ? `<ul class="pt-lista-simples">${r.downloads.map((d) => `<li><span>${esc(d.descricao)}<br><small>${esc(d.cliente || '')} · ${esc(d.projeto || '')}</small></span><time>${esc(relativo(d.em))}</time></li>`).join('')}</ul>` : '<p class="t-small muted">Quando os clientes baixarem arquivos, você vê aqui.</p>'}
        </section>
      </div>`);
    $$('[data-novo-cli]').forEach((b) => (b.onclick = () => formCliente({}, rota)));
    $$('[data-novo-proj]').forEach((b) => (b.onclick = () => formProjeto()));
  }

  /* ---------- clientes ---------- */
  async function telaClientes() {
    const { clientes } = await api('admin/clientes');
    const status = (c) => (!+c.ativo ? '<span class="pt-selo pt-selo--suave">Inativo</span>' : +c.ativado ? '<span class="pt-selo pt-selo--ok">Ativo</span>' : +c.convite_pendente ? '<span class="pt-selo pt-selo--alerta">Convite enviado</span>' : '<span class="pt-selo pt-selo--suave">Sem acesso</span>');
    molde('clientes', cab('<b>Clientes</b>', 'Quem acessa a área do cliente.', `<button type="button" class="btn btn-sm" data-novo>${ic('i-mais')} Novo cliente</button>`) +
      (clientes.length ? `<div class="pt-rolar"><table class="pt-tabela"><thead><tr><th>Cliente</th><th class="ocultar-p">WhatsApp</th><th>Status</th><th class="ocultar-p">Projetos</th><th class="ocultar-p">Último acesso</th><th class="acoes"><span class="sr-only">Ações</span></th></tr></thead><tbody>
        ${clientes.map((c) => `<tr><td><b>${esc(c.nome)}</b><small>${esc(c.email)}</small></td><td class="ocultar-p">${esc(c.telefone || '—')}</td><td>${status(c)}</td><td class="ocultar-p">${c.projetos}</td><td class="ocultar-p">${c.ultimo_acesso ? esc(relativo(c.ultimo_acesso)) : '—'}</td>
          <td class="acoes"><button type="button" class="btn-icon" data-link="${c.id}" title="Gerar link de acesso" aria-label="Gerar link de acesso para ${esc(c.nome)}">${ic('i-link')}</button><button type="button" class="btn-icon" data-editar="${c.id}" title="Editar" aria-label="Editar ${esc(c.nome)}">${ic('i-editar')}</button><button type="button" class="btn-icon" data-excluir="${c.id}" title="Excluir" aria-label="Excluir ${esc(c.nome)}">${ic('i-lixo')}</button></td></tr>`).join('')}
        </tbody></table></div><p class="t-note" style="margin-top:20px">Esqueceu a senha? Gere um novo link de acesso ${ic('i-link', 'ic-sm')} e envie ao cliente.</p>`
      : `<div class="pt-vazio"><h3>Nenhum cliente cadastrado.</h3><p>Cadastre o cliente com nome e e-mail. Você recebe um link para enviar por WhatsApp ou e-mail, e ele cria a própria senha.</p><button type="button" class="btn btn-sm" data-novo>Cadastrar cliente</button></div>`));
    const porId = (id) => clientes.find((c) => c.id === +id);
    $$('[data-novo]').forEach((b) => (b.onclick = () => formCliente({}, rota)));
    $$('[data-editar]').forEach((b) => (b.onclick = () => formCliente(porId(b.dataset.editar), rota)));
    $$('[data-link]').forEach((b) => (b.onclick = () => gerarConvite(porId(b.dataset.link))));
    $$('[data-excluir]').forEach((b) => (b.onclick = async () => {
      const c = porId(b.dataset.excluir);
      if (!(await confirmar('Excluir cliente', `Excluir <strong>${esc(c.nome)}</strong> apaga também ${c.projetos == 1 ? 'o projeto' : `os ${c.projetos} projetos`} e todos os arquivos dele. Não dá para desfazer.`, 'Excluir'))) return;
      try { await api('admin/cliente/excluir', { body: { id: c.id } }); toast('Cliente excluído.'); rota(); } catch (x) { toast(x.message, true); }
    }));
  }

  /* ---------- projetos ---------- */
  async function telaProjetos() {
    const { projetos } = await api('projetos');
    const { clientes } = await api('admin/clientes');
    const nomeCli = (id) => clientes.find((c) => c.id === id)?.nome || '';
    molde('projetos', cab('<b>Projetos</b>', 'Projetos e arquivos.', `<button type="button" class="btn btn-sm" data-novo>${ic('i-mais')} Novo projeto</button>`) +
      (projetos.length ? `<div class="pt-projetos">${projetos.map((p) => `
        <a class="pt-projeto" href="#/projeto/${p.id}"><div class="pt-projeto-foto">${p.capa ? `<img src="${esc(p.capa)}" alt="" loading="lazy">` : lm()}</div>
          <div class="stack" style="gap:8px"><h2>${esc(p.nome)}</h2><p>${esc(nomeCli(p.cliente_id))} · ${p.total_arquivos} arquivos</p>
          <div class="pt-etapas-mini" style="--n:${p.total_etapas}">${Array.from({ length: p.total_etapas }, (_, i) => `<i class="${i + 1 < p.etapa ? 'feita' : i + 1 === p.etapa ? 'atual' : ''}"></i>`).join('')}</div><p>Etapa ${p.etapa} · ${esc(p.etapa_nome)}</p></div></a>`).join('')}</div>`
      : `<div class="pt-vazio"><h3>Nenhum projeto ainda.</h3><p>Crie um projeto, escolha o cliente e envie plantas, renders e documentos.</p><button type="button" class="btn btn-sm" data-novo>Criar projeto</button></div>`));
    $$('[data-novo]').forEach((b) => (b.onclick = () => formProjeto()));
  }

  /* ---------- projeto (detalhe) ---------- */
  let proj = null;
  async function telaProjeto(id) {
    const [{ projeto: p }, { clientes }] = await Promise.all([api('projeto', { query: 'id=' + id }), api('admin/clientes')]);
    proj = p;
    const cli = clientes.find((c) => c.id === p.cliente_id) || {};
    const cats = S.categorias;
    molde('projetos', cab(`<a class="link-sub" href="#/projetos">Projetos</a>&nbsp;/&nbsp;<b>${esc(p.tipo)}</b>`, esc(p.nome),
      `<a class="btn btn-line btn-sm" href="${MA.site}cliente/#/projeto/${p.id}" target="_blank" rel="noopener">${ic('i-olho')} Ver como cliente</a><button type="button" class="btn btn-line btn-sm" data-editar>${ic('i-editar')} Editar</button><button type="button" class="btn-icon" data-excluir aria-label="Excluir projeto" title="Excluir projeto">${ic('i-lixo')}</button>`) + `
      <div class="pt-stats">
        <div class="pt-stat"><b style="font-size:24px;line-height:1.3">${esc(cli.nome || '—')}</b><span>${esc(cli.email || '')} ${cli.id ? `· <button type="button" class="pt-link" data-link>novo link de acesso</button>` : ''}</span></div>
        <div class="pt-stat"><label class="sr-only" for="pp-etapa">Etapa atual</label><select class="input" id="pp-etapa" style="font-family:var(--font-display);font-size:22px">${selectOpts(etapasObj(), p.etapa)}</select><span>etapa atual · o cliente vê na hora</span></div>
        <div class="pt-stat"><b>${p.arquivos.length}</b><span>arquivos</span></div>
        <div class="pt-stat"><b>${esc(relativo(p.atualizado_em))}</b><span>última atualização</span></div>
      </div>
      <div class="pt-grade" style="margin-top:0">
        <div class="stack" style="gap:48px">
          <section class="pt-bloco" aria-labelledby="up-t"><div class="pt-bloco-cab"><h2 id="up-t">Enviar arquivos</h2></div>
            <div class="pt-upload-cab"><div class="field"><label for="up-cat">Categoria</label><select class="input" id="up-cat">${selectOpts(cats, 'plantas')}</select></div>${campo('up-desc', 'Descrição (opcional)', 'placeholder="Ex.: revisão 02, aprovada"')}</div>
            <div class="pt-upload" data-drop>${ic('i-enviar')}<p><strong>Arraste os arquivos aqui</strong> ou clique para escolher</p><small>PDF, DWG, SKP, imagens, vídeos, planilhas e ZIP · envio em partes, sem limite prático de tamanho</small><input type="file" multiple data-input aria-label="Escolher arquivos"></div>
            <ul class="pt-fila" data-fila></ul>
          </section>
          <section class="pt-bloco" aria-labelledby="arq-t"><div class="pt-bloco-cab"><h2 id="arq-t">Arquivos do projeto</h2></div>
            <div class="pt-filtro-lista chips" data-filtros></div>
            <div data-arquivos></div></section>
        </div>
        <aside class="pt-lateral">
          <section class="pt-cartao"><h3>Publicar novidade</h3>
            <form class="stack" style="gap:14px" data-nova><div class="field-line"><textarea class="input" rows="3" placeholder="Ex.: As imagens do anteprojeto estão prontas." data-texto aria-label="Texto da novidade"></textarea></div><button class="btn btn-sm" type="submit">Publicar</button></form>
            ${p.atualizacoes.length ? `<ol class="pt-novidades" style="margin-top:12px">${p.atualizacoes.map((n) => `<li class="pt-novidade"><time>${esc(fmtData(n.criado_em))}</time><p>${esc(n.texto)}</p><button type="button" class="btn-icon" data-apagar-nov="${n.id}" aria-label="Apagar novidade">${ic('i-fechar', 'ic-sm')}</button></li>`).join('')}</ol>` : '<p class="t-small muted">O cliente vê as novidades ao lado dos arquivos. Mudanças de etapa entram aqui sozinhas.</p>'}
          </section>
          <section class="pt-cartao"><h3>Downloads do cliente</h3><div data-downloads><p class="t-small muted">Carregando…</p></div></section>
        </aside>
      </div>`);

    $('[data-editar]').onclick = () => formProjeto(p, () => rota());
    $('[data-link]')?.addEventListener('click', () => gerarConvite(cli));
    $('[data-excluir]').onclick = async () => {
      if (!(await confirmar('Excluir projeto', `Excluir <strong>${esc(p.nome)}</strong> apaga os ${p.arquivos.length} arquivos do servidor. Não dá para desfazer.`, 'Excluir projeto'))) return;
      try { await api('admin/projeto/excluir', { body: { id: p.id } }); toast('Projeto excluído.'); location.hash = '#/projetos'; } catch (x) { toast(x.message, true); }
    };
    $('#pp-etapa').onchange = async (e) => {
      try { await api('admin/projeto', { body: { ...p, etapa: +e.target.value } }); toast('Etapa atualizada. O cliente já vê a mudança.'); rota(); } catch (x) { toast(x.message, true); }
    };
    $('[data-nova]').onsubmit = async (e) => {
      e.preventDefault(); const t = $('[data-texto]').value.trim(); if (!t) return;
      try { await api('admin/atualizacao', { body: { projeto_id: p.id, texto: t } }); toast('Novidade publicada.'); rota(); } catch (x) { toast(x.message, true); }
    };
    $$('[data-apagar-nov]').forEach((b) => (b.onclick = async () => { try { await api('admin/atualizacao/excluir', { body: { id: +b.dataset.apagarNov } }); rota(); } catch (x) { toast(x.message, true); } }));
    api('admin/downloads', { query: 'projeto=' + p.id }).then(({ downloads }) => {
      $('[data-downloads]').innerHTML = downloads.length ? `<ul class="pt-lista-simples">${downloads.slice(0, 12).map((d) => `<li><span>${esc(d.descricao)}</span><time>${esc(relativo(d.em))}</time></li>`).join('')}</ul>` : '<p class="t-small muted">Nenhum download ainda.</p>';
    }).catch(() => {});
    montarUpload();
    filtrosArquivos('todos');
  }

  function filtrosArquivos(sel) {
    const cats = S.categorias, cont = {}; proj.arquivos.forEach((a) => (cont[a.categoria] = (cont[a.categoria] || 0) + 1));
    $('[data-filtros]').innerHTML = [['todos', `Todos · ${proj.arquivos.length}`], ...Object.entries(cats).filter(([k]) => cont[k]).map(([k, v]) => [k, `${v} · ${cont[k]}`])]
      .map(([k, v]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === sel}">${esc(v)}</button>`).join('');
    $$('[data-f]').forEach((b) => (b.onclick = () => filtrosArquivos(b.dataset.f)));
    listaAdmin(sel);
  }
  function listaAdmin(sel) {
    const box = $('[data-arquivos]');
    const arqs = proj.arquivos.filter((a) => sel === 'todos' || a.categoria === sel);
    if (!arqs.length) { box.innerHTML = `<div class="pt-vazio"><h3>Nenhum arquivo ainda.</h3><p>Escolha a categoria e arraste os arquivos na área acima.</p></div>`; return; }
    box.innerHTML = `<ul class="pt-arqs">${arqs.map((a) => `<li class="pt-arq pt-arq--admin" data-id="${a.id}">
      <button type="button" class="pt-arq-ic" data-abrir aria-label="Abrir ${esc(a.nome)}">${a.imagem ? `<img src="${esc(urlArquivo(a.id, true))}" alt="" loading="lazy">` : ic(icCat(a.categoria))}<span>${esc(a.ext)}</span></button>
      <div class="pt-arq-nome"><input class="pt-edit-nome" value="${esc(a.nome)}" aria-label="Nome do arquivo" data-nome><small><select class="pt-cat-sel" data-cat aria-label="Categoria">${selectOpts(S.categorias, a.categoria)}</select> · ${esc(a.tamanho_txt)} · ${esc(fmtData(a.enviado_em))}${proj.capa_id === a.id ? ' · <strong>capa</strong>' : ''}</small></div>
      <div class="pt-arq-info">${a.descricao ? esc(a.descricao) : ''}</div>
      <div class="pt-arq-acoes">${a.imagem && proj.capa_id !== a.id ? `<button type="button" class="btn-icon" data-capa title="Usar como capa" aria-label="Usar como capa">${ic('i-imagem')}</button>` : ''}<button type="button" class="btn-icon" data-baixar title="Baixar" aria-label="Baixar">${ic('i-baixar')}</button><button type="button" class="btn-icon" data-apagar title="Excluir" aria-label="Excluir ${esc(a.nome)}">${ic('i-lixo')}</button></div></li>`).join('')}</ul>`;
    $$('[data-id]', box).forEach((li) => {
      const a = proj.arquivos.find((x) => x.id === +li.dataset.id);
      const salvar = async (mud) => {
        try { const j = await api('admin/arquivo', { body: { id: a.id, nome: a.nome, categoria: a.categoria, descricao: a.descricao, ...mud } }); Object.assign(a, j.arquivo); toast('Arquivo atualizado.'); if (mud.categoria) filtrosArquivos(sel); }
        catch (x) { toast(x.message, true); }
      };
      const n = $('[data-nome]', li);
      n.addEventListener('keydown', (e) => { if (e.key === 'Enter') n.blur(); if (e.key === 'Escape') { n.value = a.nome; n.blur(); } });
      n.addEventListener('blur', () => { const v = n.value.trim(); if (v && v !== a.nome) salvar({ nome: v }); else n.value = a.nome; });
      $('[data-cat]', li).onchange = (e) => salvar({ categoria: e.target.value });
      $('[data-abrir]', li).onclick = () => abrirArquivo(a, arqs);
      $('[data-baixar]', li).onclick = () => baixar(urlArquivo(a.id), a.nome);
      $('[data-capa]', li)?.addEventListener('click', async () => { try { await api('admin/capa', { body: { projeto_id: proj.id, arquivo_id: a.id } }); proj.capa_id = a.id; toast('Capa do projeto atualizada.'); listaAdmin(sel); } catch (x) { toast(x.message, true); } });
      $('[data-apagar]', li).onclick = async () => {
        if (!(await confirmar('Excluir arquivo', `Excluir <strong>${esc(a.nome)}</strong>? O cliente deixa de ver este arquivo.`, 'Excluir'))) return;
        try { await api('admin/arquivo/excluir', { body: { id: a.id } }); proj.arquivos = proj.arquivos.filter((x) => x.id !== a.id); if (proj.capa_id === a.id) proj.capa_id = null; toast('Arquivo excluído.'); filtrosArquivos(sel); } catch (x) { toast(x.message, true); }
      };
    });
  }

  /* ---------- envio em partes ---------- */
  function montarUpload() {
    const drop = $('[data-drop]'), input = $('[data-input]');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('arrastando'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('arrastando'); }));
    drop.addEventListener('drop', (e) => enfileirar([...e.dataTransfer.files]));
    input.addEventListener('change', () => { enfileirar([...input.files]); input.value = ''; });
  }
  const fila = []; let enviando = false;
  function enfileirar(files) {
    const cat = $('#up-cat').value, desc = $('#up-desc').value.trim(), pid = proj.id;
    files.forEach((f) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${esc(f.name)}</span><small>aguardando</small><div class="pt-barra"><i></i></div>`;
      $('[data-fila]').append(li);
      fila.push({ f, cat, desc, pid, li });
    });
    processar();
  }
  const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
  function enviarParte(fd, aoProgresso) {
    if (window.MA_MOCK) return window.MA_MOCK('admin/upload', { body: fd, method: 'POST', progresso: aoProgresso });
    return new Promise((ok, erro) => {
      const x = new XMLHttpRequest();
      x.open('POST', `${MA.api}?r=admin/upload`); x.setRequestHeader('X-CSRF', S.csrf); x.setRequestHeader('Accept', 'application/json');
      x.upload.onprogress = (e) => e.lengthComputable && aoProgresso(e.loaded);
      x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch {} x.status >= 200 && x.status < 300 ? ok(j) : erro(new Error(j.erro || `Erro ${x.status} no envio.`)); };
      x.onerror = () => erro(new Error('A conexão caiu durante o envio.'));
      x.send(fd);
    });
  }
  async function processar() {
    if (enviando) return; enviando = true;
    while (fila.length) {
      const { f, cat, desc, pid, li } = fila.shift();
      const st = $('small', li), barra = $('i', li);
      const tam = Math.max(256 * 1024, S.parte_bytes || 1 << 20), partes = Math.max(1, Math.ceil(f.size / tam)), uid = hex(16);
      try {
        for (let k = 0; k < partes; k++) {
          const fd = new FormData();
          Object.entries({ upload_id: uid, parte: k, partes, nome: f.name, tamanho: f.size, projeto_id: pid, categoria: cat, descricao: desc }).forEach(([a, b]) => fd.append(a, b));
          fd.append('arquivo', f.slice(k * tam, (k + 1) * tam), 'parte');
          let tentativa = 0, j;
          for (;;) {
            try { j = await enviarParte(fd, (b) => { const p = Math.min(100, ((k * tam + b) / (f.size || 1)) * 100); barra.style.width = p + '%'; st.textContent = Math.round(p) + '%'; }); break; }
            catch (x) { if (++tentativa >= 3 || /formato|limite|inválido/i.test(x.message)) throw x; st.textContent = 'reconectando…'; await new Promise((r) => setTimeout(r, 1500 * tentativa)); }
          }
          if (j.arquivo && proj && proj.id === pid) { proj.arquivos.unshift(j.arquivo); if (!proj.capa_id && j.arquivo.imagem) proj.capa_id = j.arquivo.id; }
        }
        li.classList.add('ok'); barra.style.width = '100%'; st.textContent = 'enviado';
        if (proj && proj.id === pid && $('[data-arquivos]')) filtrosArquivos('todos');
      } catch (x) { li.classList.add('erro'); st.textContent = x.message; }
    }
    enviando = false;
    toast('Envio concluído.');
  }

  /* ---------- contatos ---------- */
  async function telaContatos() {
    const { contatos } = await api('admin/contatos');
    contatosNovos = contatos.filter((c) => !+c.lido).length;
    molde('contatos', cab('<b>Contatos</b>', 'Mensagens do site.') + (contatos.length ? `<ul class="pt-lista-simples">${contatos.map((c) => {
      const tel = String(c.telefone || '').replace(/\D/g, '');
      return `<li class="pt-lead ${+c.lido ? '' : 'nao-lido'}" data-id="${c.id}" style="grid-template-columns:minmax(0,1fr) auto;padding:24px 0">
        <div class="stack" style="gap:8px"><div><b style="font-weight:500">${esc(c.nome)}</b> <small>· ${esc(c.tipo || 'Projeto')}${c.cidade ? ' · ' + esc(c.cidade) : ''}</small></div>
          ${c.mensagem ? `<p class="pt-lead-msg">${esc(c.mensagem)}</p>` : ''}
          <div class="row" style="gap:10px">${c.email ? `<a class="btn btn-line btn-sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Seu projeto · Matheus Alonso')}">${ic('i-email')} ${esc(c.email)}</a>` : ''}${tel ? `<a class="btn btn-line btn-sm" href="https://wa.me/${tel.length <= 11 ? '55' + tel : tel}" target="_blank" rel="noopener">${ic('i-whatsapp')} ${esc(c.telefone)}</a>` : ''}</div></div>
        <div class="stack" style="gap:8px;justify-items:end"><time>${esc(fmtDataHora(c.criado_em))}</time><div class="row" style="gap:6px"><button type="button" class="btn-icon" data-lido title="${+c.lido ? 'Marcar como não lido' : 'Marcar como lido'}" aria-label="${+c.lido ? 'Marcar como não lido' : 'Marcar como lido'}">${ic('i-check')}</button><button type="button" class="btn-icon" data-apagar title="Excluir" aria-label="Excluir contato">${ic('i-lixo')}</button></div></div></li>`;
    }).join('')}</ul>` : `<div class="pt-vazio"><h3>Nenhuma mensagem ainda.</h3><p>Os contatos enviados pelo formulário do site aparecem aqui.</p></div>`));
    $$('[data-id]').forEach((li) => {
      const c = contatos.find((x) => x.id === +li.dataset.id);
      $('[data-lido]', li).onclick = async () => { try { await api('admin/contato/lido', { body: { id: c.id, lido: +c.lido ? 0 : 1 } }); rota(); } catch (x) { toast(x.message, true); } };
      $('[data-apagar]', li).onclick = async () => { if (!(await confirmar('Excluir contato', `Excluir a mensagem de <strong>${esc(c.nome)}</strong>?`, 'Excluir'))) return; try { await api('admin/contato/excluir', { body: { id: c.id } }); rota(); } catch (x) { toast(x.message, true); } };
    });
  }

  /* ---------- roteamento ---------- */
  async function rota() {
    if (!S.usuario) { telaLogin({ titulo: 'Painel do escritório', sub: 'Cadastre clientes, crie projetos e envie plantas, renders e documentos.', aoEntrar: rota }); return; }
    if (S.usuario.papel !== 'admin') { location.replace(MA.site + 'cliente/'); return; }
    const h = location.hash.replace(/^#/, '');
    try {
      let m;
      if ((m = h.match(/^\/projeto\/(\d+)/))) await telaProjeto(+m[1]);
      else if (h.startsWith('/projetos')) await telaProjetos();
      else if (h.startsWith('/clientes')) await telaClientes();
      else if (h.startsWith('/contatos')) await telaContatos();
      else await telaInicio();
    } catch (x) {
      if (x.status === 401) return;
      if (x.status === 404) { toast(x.message, true); location.hash = '#/'; return; }
      molde('', `<div class="pt-vazio"><h3>Não foi possível carregar.</h3><p>${esc(x.message)}</p><button class="btn btn-sm" type="button" onclick="location.reload()">Tentar de novo</button></div>`);
    }
  }
  addEventListener('hashchange', rota);
  addEventListener('ma:saiu', rota);
  addEventListener('beforeunload', (e) => { if (enviando) { e.preventDefault(); e.returnValue = ''; } });
  carregarSessao().then(async () => { if (S.usuario?.papel === 'admin') { try { contatosNovos = (await api('admin/resumo')).contatos_novos; } catch {} } rota(); })
    .catch((x) => { app.innerHTML = `<main class="wrap pt-corpo"><div class="pt-vazio"><h3>Painel indisponível.</h3><p>${esc(x.message)}</p></div></main>`; });
})();
