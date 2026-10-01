/* Prévia estática da área do cliente e do painel: substitui a API por dados em memória.
   Só é carregado quando o site é exportado com MA_PREVIA=1 (scripts/exportar-previa.sh). Nada é salvo. */
(() => {
  'use strict';
  window.MA_PREVIA = true;
  const MA = window.MA;
  const dia = 86400000;
  const quando = (d) => new Date(Date.now() - d * dia).toISOString().slice(0, 19).replace('T', ' ');
  const CATS = { plantas: 'Plantas e desenhos', renders: 'Imagens e renders', documentos: 'Documentos', materiais: 'Materiais e especificações', obra: 'Fotos da obra', outros: 'Outros' };
  const ETAPAS = [
    ['Briefing', 'Conversa, levantamento e investigação da rotina de quem vai viver o espaço.'], ['Estudo preliminar', 'Primeiras ideias de implantação, fluxos e volumes.'],
    ['Anteprojeto', 'Plantas, materiais e imagens para você enxergar o espaço antes da obra.'], ['Projeto executivo', 'Desenhos técnicos completos para orçar e construir.'],
    ['Detalhamento', 'Marcenaria, iluminação, acabamentos e compatibilização com os complementares.'], ['Acompanhamento de obra', 'Visitas, ajustes e decisões junto com a equipe da obra.'], ['Entregue', 'Espaço pronto para ser vivido.'],
  ].map(([nome, texto], i) => ({ n: i + 1, nome, texto }));
  let seq = 100;
  const imgs = {};
  const arq = (pid, categoria, nome, tam, dias, descricao = '', img = null) => {
    const id = ++seq, ext = nome.split('.').pop().toLowerCase();
    if (img) imgs[id] = img;
    return { id, projeto_id: pid, nome, categoria, descricao, tamanho: tam, tamanho_txt: tam > 1048576 ? (tam / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(tam / 1024) + ' KB', ext,
      mime: img ? 'image/webp' : ext === 'pdf' ? 'application/pdf' : 'application/octet-stream', enviado_em: quando(dias), imagem: !!img, visualizavel: !!img || ext === 'pdf', novo: dias < 3 };
  };
  const db = {
    usuarios: [
      { id: 1, nome: 'Matheus Alonso', email: 'matheus@matheusalonso.com.br', telefone: '', papel: 'admin' },
      { id: 2, nome: 'Cliente Exemplo', email: 'cliente@exemplo.com', telefone: '11999990000', papel: 'cliente', ativo: 1, ativado: 1, convite_pendente: 0, criado_em: quando(60), ultimo_acesso: quando(1) },
      { id: 3, nome: 'Ana Ribeiro', email: 'ana@exemplo.com', telefone: '11988887777', papel: 'cliente', ativo: 1, ativado: 0, convite_pendente: 1, criado_em: quando(2), ultimo_acesso: null },
    ],
    projetos: [
      { id: 1, cliente_id: 2, nome: 'Casa de Campo', tipo: 'Residencial', local: 'Interior de SP', descricao: 'Arquitetura e interiores de uma casa de campo pensada para receber a família sem pressa.', etapa: 4, capa_id: null, atualizado_em: quando(1) },
      { id: 2, cliente_id: 2, nome: 'Área gourmet', tipo: 'Interiores', local: 'Interior de SP', descricao: '', etapa: 2, capa_id: null, atualizado_em: quando(2) },
      { id: 3, cliente_id: 3, nome: 'Academia', tipo: 'Saúde', local: '', descricao: '', etapa: 1, capa_id: null, atualizado_em: quando(2) },
    ],
    arquivos: [], atualizacoes: [], downloads: [], contatos: [
      { id: 1, nome: 'Juliana M.', email: 'juliana@exemplo.com', telefone: '11977776666', tipo: 'Reforma', cidade: 'Campinas', mensagem: 'Quero integrar a cozinha com a sala. Moramos em quatro e recebemos a família aos domingos.', lido: 0, criado_em: quando(0.1) },
      { id: 2, nome: 'Rafael T.', email: 'rafael@exemplo.com', telefone: '', tipo: 'Comercial', cidade: 'São Paulo', mensagem: 'Projeto para um consultório de 80 m².', lido: 1, criado_em: quando(5) },
    ],
  };
  const I = (k) => `${MA.img}${k}.webp`;
  db.arquivos.push(
    arq(1, 'plantas', 'Planta baixa - térreo (rev. 02).pdf', 2.4e6, 1, 'Revisão 02'), arq(1, 'plantas', 'Cortes e fachadas.pdf', 3.1e6, 1),
    arq(1, 'plantas', 'Executivo - arquitetura.dwg', 18.6e6, 4, 'Para a obra'), arq(1, 'plantas', 'Planta de layout.pdf', 1.2e6, 12),
    arq(1, 'renders', 'Render - chegada.jpg', 4.8e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/chegada')), arq(1, 'renders', 'Render - varanda.jpg', 5.1e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/varanda')),
    arq(1, 'renders', 'Render - living e jantar.jpg', 5.3e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/living')), arq(1, 'renders', 'Render - cozinha.jpg', 4.4e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/cozinha')),
    arq(1, 'renders', 'Render - circulação.jpg', 4.2e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/circulacao')), arq(1, 'renders', 'Render - suíte.jpg', 4.9e6, 20, 'Anteprojeto aprovado', I('casa-de-campo/suite')),
    arq(1, 'documentos', 'Contrato de prestação de serviços.pdf', 0.4e6, 40, 'Assinado'), arq(1, 'documentos', 'Memorial descritivo.pdf', 0.9e6, 6), arq(1, 'documentos', 'RRT.pdf', 0.2e6, 38),
    arq(1, 'materiais', 'Caderno de acabamentos.pdf', 7.2e6, 6, 'Para orçamento'),
    arq(2, 'renders', 'Referência - espaço gourmet.jpg', 3.9e6, 2, 'Estudo preliminar', I('casa-varanda/gourmet')), arq(2, 'plantas', 'Estudo preliminar.pdf', 1.6e6, 2),
  );
  db.projetos[0].capa_id = db.arquivos.find((a) => a.nome === 'Render - chegada.jpg').id;
  db.projetos[1].capa_id = db.arquivos.find((a) => a.projeto_id === 2 && a.imagem).id;
  [[1, 40, 'Contrato assinado. Vamos começar pela conversa de briefing.'], [1, 20, 'As imagens do anteprojeto estão prontas na pasta Imagens e renders.'], [1, 6, 'O projeto avançou para a etapa Projeto executivo.'],
    [1, 1, 'Nova revisão da planta do térreo com o ajuste da despensa.'], [2, 2, 'Estudo preliminar disponível para você revisar.']]
    .forEach(([p, d, texto], i) => db.atualizacoes.push({ id: i + 1, projeto_id: p, texto, criado_em: quando(d) }));
  db.downloads.push({ descricao: 'Planta baixa - térreo (rev. 02).pdf', em: quando(0.6), cliente: 'Cliente Exemplo', projeto: 'Casa de Campo', projeto_id: 1 }, { descricao: 'ZIP Imagens e renders', em: quando(19), cliente: 'Cliente Exemplo', projeto: 'Casa de Campo', projeto_id: 1 });

  let usuario = null;
  const erro = (m, status = 400) => { const e = new Error(m); e.status = status; throw e; };
  const pj = (p, full) => {
    const as = db.arquivos.filter((a) => a.projeto_id === p.id);
    const r = { ...p, etapa_nome: ETAPAS[p.etapa - 1].nome, total_etapas: 7, capa: p.capa_id ? imgs[p.capa_id] : null, total_arquivos: as.length, novos: usuario?.papel === 'cliente' ? as.filter((a) => a.novo).length : 0 };
    if (full) { r.arquivos = as.slice().sort((a, b) => (a.enviado_em < b.enviado_em ? 1 : -1)); r.atualizacoes = db.atualizacoes.filter((n) => n.projeto_id === p.id).sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1)); r.etapas = ETAPAS; }
    return r;
  };
  const b = (body, k) => (body instanceof FormData ? body.get(k) : body?.[k]);
  const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms));

  window.MA_MOCK_URL = (id) => imgs[id] || '#';
  window.MA_MOCK = async (r, { body, query, progresso }) => {
    await espera(r === 'admin/upload' ? 0 : 220);
    const qs = new URLSearchParams(query || '');
    const proj = (id) => db.projetos.find((p) => p.id === +id && (usuario.papel === 'admin' || p.cliente_id === usuario.id)) || erro('Projeto não encontrado.', 404);
    if (!['sessao', 'entrar', 'convite', 'convite/senha', 'contato'].includes(r) && !usuario) erro('Faça login para continuar.', 401);
    switch (r) {
      case 'sessao': return { usuario, csrf: 'previa', parte_bytes: 1 << 20, categorias: CATS, etapas: ETAPAS, contato: {} };
      case 'entrar':
        if (!b(body, 'email') || !b(body, 'senha')) erro('Informe e-mail e senha.');
        usuario = MA.modo === 'painel' ? db.usuarios[0] : db.usuarios[1]; return { usuario, csrf: 'previa' };
      case 'sair': usuario = null; return { ok: true };
      case 'convite': return { nome: 'Ana Ribeiro', email: 'ana@exemplo.com' };
      case 'convite/senha': usuario = db.usuarios[2]; return { usuario, csrf: 'previa' };
      case 'senha': return { ok: true };
      case 'projetos': return { projetos: db.projetos.filter((p) => usuario.papel === 'admin' || p.cliente_id === usuario.id).sort((a, b2) => (a.atualizado_em < b2.atualizado_em ? 1 : -1)).map((p) => pj(p)) };
      case 'projeto': return { projeto: pj(proj(qs.get('id')), true) };
      case 'visto': db.arquivos.forEach((a) => { if (a.projeto_id === +b(body, 'id')) a.novo = false; }); return { ok: true };
      case 'admin/resumo': return { clientes: db.usuarios.filter((u) => u.papel === 'cliente').length, projetos: db.projetos.filter((p) => p.etapa < 7).length, arquivos: db.arquivos.length, espaco: (db.arquivos.reduce((s, a) => s + a.tamanho, 0) / 1048576).toFixed(1).replace('.', ',') + ' MB', contatos_novos: db.contatos.filter((c) => !c.lido).length, downloads: db.downloads };
      case 'admin/clientes': return { clientes: db.usuarios.filter((u) => u.papel === 'cliente').map((u) => ({ ...u, projetos: db.projetos.filter((p) => p.cliente_id === u.id).length })) };
      case 'admin/cliente': {
        const id = +b(body, 'id'), dados = { nome: b(body, 'nome'), email: b(body, 'email'), telefone: b(body, 'telefone') || '' };
        if (!dados.nome || !/\S+@\S+\.\S+/.test(dados.email)) erro('Informe nome e um e-mail válido.');
        if (id) { Object.assign(db.usuarios.find((u) => u.id === id), dados, { ativo: +b(body, 'ativo') }); return { id }; }
        const u = { id: ++seq, ...dados, papel: 'cliente', ativo: 1, ativado: 0, convite_pendente: 1, criado_em: quando(0), ultimo_acesso: null }; db.usuarios.push(u);
        return { id: u.id, convite: `${location.origin}${location.pathname.replace('painel', 'cliente')}#convite=previa${u.id}` };
      }
      case 'admin/cliente/convite': return { convite: `${location.origin}${location.pathname.replace('painel', 'cliente')}#convite=previa${b(body, 'id')}` };
      case 'admin/cliente/excluir': { const id = +b(body, 'id'); db.usuarios = db.usuarios.filter((u) => u.id !== id); db.projetos = db.projetos.filter((p) => p.cliente_id !== id); return { ok: true }; }
      case 'admin/projeto': {
        const id = +b(body, 'id'); if (!b(body, 'nome')) erro('Dê um nome ao projeto.');
        const dados = { nome: b(body, 'nome'), cliente_id: +b(body, 'cliente_id'), tipo: b(body, 'tipo'), local: b(body, 'local') || '', descricao: b(body, 'descricao') || '', etapa: +b(body, 'etapa') || 1, atualizado_em: quando(0) };
        let p = db.projetos.find((x) => x.id === id);
        if (p) { if (p.etapa !== dados.etapa) db.atualizacoes.push({ id: ++seq, projeto_id: p.id, texto: `O projeto avançou para a etapa ${ETAPAS[dados.etapa - 1].nome}.`, criado_em: quando(0) }); Object.assign(p, dados); }
        else { p = { id: ++seq, capa_id: null, ...dados }; db.projetos.push(p); }
        return { projeto: pj(p, true) };
      }
      case 'admin/projeto/excluir': db.projetos = db.projetos.filter((p) => p.id !== +b(body, 'id')); return { ok: true };
      case 'admin/capa': db.projetos.find((p) => p.id === +b(body, 'projeto_id')).capa_id = +b(body, 'arquivo_id'); return { ok: true };
      case 'admin/upload': {
        const f = body.get('arquivo'), total = f.size;
        for (let k = 1; k <= 10; k++) { await espera(60); progresso?.((total * k) / 10); }
        if (+body.get('parte') < +body.get('partes') - 1) return { ok: true };
        const nome = body.get('nome'), ehImg = /\.(jpe?g|png|webp)$/i.test(nome);
        const a = arq(+body.get('projeto_id'), body.get('categoria'), nome, +body.get('tamanho'), 0, body.get('descricao') || '', ehImg && +body.get('partes') === 1 ? URL.createObjectURL(f) : null);
        a.novo = false; db.arquivos.push(a); return { arquivo: a };
      }
      case 'admin/arquivo': { const a = db.arquivos.find((x) => x.id === +b(body, 'id')); Object.assign(a, { nome: b(body, 'nome'), categoria: b(body, 'categoria'), descricao: b(body, 'descricao') || '' }); return { arquivo: a }; }
      case 'admin/arquivo/excluir': db.arquivos = db.arquivos.filter((a) => a.id !== +b(body, 'id')); return { ok: true };
      case 'admin/atualizacao': db.atualizacoes.push({ id: ++seq, projeto_id: +b(body, 'projeto_id'), texto: b(body, 'texto'), criado_em: quando(0) }); return { ok: true };
      case 'admin/atualizacao/excluir': db.atualizacoes = db.atualizacoes.filter((n) => n.id !== +b(body, 'id')); return { ok: true };
      case 'admin/downloads': return { downloads: db.downloads.filter((d) => d.projeto_id === +qs.get('projeto')) };
      case 'admin/contatos': return { contatos: db.contatos };
      case 'admin/contato/lido': db.contatos.find((c) => c.id === +b(body, 'id')).lido = +b(body, 'lido'); return { ok: true };
      case 'admin/contato/excluir': db.contatos = db.contatos.filter((c) => c.id !== +b(body, 'id')); return { ok: true };
      default: erro('Rota não disponível na prévia.', 404);
    }
  };
  /* na prévia as páginas são arquivos .html: traduz os links montados pelo JavaScript */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href');
    const m = h.match(/^(?:\.\/)?(cliente|painel)\/(#.*)?$/) || (h === './' || h === '' ? ['', 'index'] : null) || h.match(/^\.\/(contato|projetos|sobre|processo)$/);
    if (!m) return;
    e.preventDefault();
    const destino = m[1] + '.html' + (m[2] || '');
    a.target === '_blank' ? window.open(destino, '_blank', 'noopener') : (location.href = destino);
  }, true);
  addEventListener('DOMContentLoaded', () => {
    const t = document.createElement('div'); t.className = 'pt-previa';
    t.textContent = MA.modo === 'painel' ? 'Prévia · entre com qualquer e-mail e senha · nada é salvo' : 'Prévia · entre com qualquer e-mail e senha';
    document.body.append(t);
  });
})();
