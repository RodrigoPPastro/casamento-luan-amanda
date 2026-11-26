/**
 * Backend do site Luan & Amanda — Google Apps Script + Planilha Google
 * Guarda: convidados e confirmações (RSVP), recados do mural, fotos dos convidados
 * e presentes informados via Pix. Tudo fica numa planilha que só vocês acessam.
 *
 * COMO INSTALAR (passo a passo completo no arquivo COMO-PUBLICAR.md):
 * 1. Crie uma Planilha Google nova  →  Extensões  →  Apps Script
 * 2. Apague o que estiver lá, cole este arquivo inteiro e salve
 * 3. Troque a SENHA_ADMIN abaixo
 * 4. (Opcional) Rode a função "configurar" para já criar as abas — elas também são criadas sozinhas no primeiro uso
 * 5. Implantar → Nova implantação → Tipo: App da Web
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 * 6. Copie a URL gerada e cole em API_URL no index.html do site
 */

const SENHA_ADMIN = 'troque-esta-senha';            // senha do Painel do Casal
const EMAILS_AVISO = 'email-da-noiva@gmail.com,email-do-noivo@gmail.com'; // avisos de nova confirmação
const PRAZO_RSVP = new Date('2026-12-20T23:59:59-03:00');

// Opcional: para guardar tudo no Drive de outra pessoa (que compartilhou a pasta e a planilha como Editor).
// Cole o ID que aparece no link: docs.google.com/spreadsheets/d/<ID>/edit  e  drive.google.com/drive/folders/<ID>
// Deixe vazio ('') para usar a própria planilha onde este script foi criado.
const PLANILHA_ID = '';
const PASTA_ID = '';

const ABAS = {
  Convidados: ['Codigo', 'Nome', 'Tipo', 'Responsavel', 'Telefone', 'Status', 'RespondidoEm', 'Observacao'],
  Mensagens:  ['ID', 'Data', 'Codigo', 'Nome', 'Texto', 'Aprovado'],
  Fotos:      ['ID', 'Data', 'Codigo', 'Nome', 'ArquivoID', 'Legenda', 'Aprovado'],
  Presentes:  ['ID', 'Data', 'Codigo', 'Nome', 'Presente', 'Valor', 'Mensagem'],
};

/* ---------- instalação ---------- */
function configurar() {
  const ss = planilha();
  Object.keys(ABAS).forEach(nome => {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    if (sh.getLastRow() === 0) {
      sh.appendRow(ABAS[nome]);
      sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight('bold').setBackground('#dbe5f4');
      sh.setFrozenRows(1);
    }
  });
  pastaFotos();
  const padrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  return 'Pronto! Agora faça Implantar → Nova implantação → App da Web.';
}

/* ---------- entrada ---------- */
function doGet() { return saida({ ok: true, api: 'Luan & Amanda' }); }

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const fn = ACOES[req.action];
    if (!fn) throw new Error('Ação inválida');
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { return saida({ ok: true, data: fn(req) }); }
    finally { lock.releaseLock(); }
  } catch (err) {
    return saida({ ok: false, error: String(err && err.message || err) });
  }
}

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- utilidades da planilha ---------- */
function planilha() {
  return PLANILHA_ID ? SpreadsheetApp.openById(PLANILHA_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function aba(nome) {
  const ss = planilha();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(ABAS[nome]);
    sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight('bold').setBackground('#dbe5f4');
    sh.setFrozenRows(1);
  }
  return sh;
}

function pastaFotos() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PASTA_FOTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const nome = 'Fotos dos convidados — Luan & Amanda';
  const pasta = PASTA_ID ? DriveApp.getFolderById(PASTA_ID).createFolder(nome) : DriveApp.createFolder(nome);
  props.setProperty('PASTA_FOTOS', pasta.getId());
  return pasta;
}

function linhas(nome) {
  const sh = aba(nome);
  const v = sh.getDataRange().getValues();
  const cab = v.shift() || ABAS[nome];
  return v.map((r, i) => {
    const o = { _linha: i + 2 };
    cab.forEach((c, j) => o[c] = r[j] instanceof Date ? r[j].toISOString() : r[j]);
    return o;
  }).filter(o => String(o[cab[0]]).trim() !== '');
}

function setCampo(nome, linha, campo, valor) {
  const col = ABAS[nome].indexOf(campo) + 1;
  aba(nome).getRange(linha, col).setValue(valor);
}

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function novoId() { return Utilities.getUuid().slice(0, 8); }

function novoCodigo(existentes) {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c;
  do { c = ''; for (let i = 0; i < 6; i++) c += L[Math.floor(Math.random() * L.length)]; }
  while (existentes.has(c));
  return c;
}

function filhoDe(x, g) {
  const r = String(x.Responsavel || '').trim();
  return !!r && (r.toUpperCase() === String(g.Codigo).toUpperCase() || norm(r) === norm(g.Nome));
}

function exigeAdmin(req) {
  if (String(req.senha || '') !== SENHA_ADMIN) throw new Error('Senha incorreta');
}

function publico(g) {
  return { codigo: g.Codigo, nome: g.Nome, tipo: g.Tipo, status: g.Status || 'Pendente' };
}

function achaConvidado(req) {
  const todos = linhas('Convidados');
  let g = null;
  if (req.codigo) g = todos.find(x => String(x.Codigo).toUpperCase() === String(req.codigo).toUpperCase().trim());
  if (!g && req.nome) {
    const n = norm(req.nome);
    const achados = todos.filter(x => norm(x.Nome) === n);
    if (achados.length === 1) g = achados[0];
  }
  return { g, todos };
}

/* ---------- ações públicas ---------- */
const ACOES = {
  buscarConvidado(req) {
    const { g, todos } = achaConvidado(req);
    if (!g) throw new Error('Não encontramos esse nome na lista. Digite o nome completo como está no convite, ou use o link que você recebeu.');
    if (String(g.Tipo).toLowerCase().startsWith('cri')) {
      const resp = todos.find(x => filhoDe(g, x));
      throw new Error('A presença de ' + g.Nome + ' é confirmada pelo responsável' + (resp ? ' (' + resp.Nome + ')' : '') + '.');
    }
    const criancas = todos.filter(x => filhoDe(x, g)).map(publico);
    return { convidado: publico(g), criancas, obs: g.Observacao || '', prazo: PRAZO_RSVP.toISOString() };
  },

  confirmar(req) {
    if (new Date() > PRAZO_RSVP) throw new Error('O prazo para confirmar terminou. Fale com os noivos pelo WhatsApp.');
    const { g, todos } = achaConvidado({ codigo: req.codigo });
    if (!g) throw new Error('Convite não encontrado.');
    const permitidos = new Set([g.Codigo].concat(todos.filter(x => filhoDe(x, g)).map(x => x.Codigo)));
    const agora = new Date();
    const resumo = [];
    (req.respostas || []).forEach(r => {
      if (!permitidos.has(r.codigo)) return;
      const st = r.status === 'Confirmado' ? 'Confirmado' : 'Não vai';
      const p = todos.find(x => x.Codigo === r.codigo);
      setCampo('Convidados', p._linha, 'Status', st);
      setCampo('Convidados', p._linha, 'RespondidoEm', agora);
      resumo.push(p.Nome + ': ' + st);
    });
    if (req.obs !== undefined) setCampo('Convidados', g._linha, 'Observacao', String(req.obs).slice(0, 500));
    try {
      if (EMAILS_AVISO) MailApp.sendEmail(EMAILS_AVISO, 'Nova resposta de presença — ' + g.Nome,
        resumo.join('\n') + (req.obs ? '\n\nRecado: ' + req.obs : ''));
    } catch (e) { /* sem cota de e-mail: segue sem avisar */ }
    return { ok: true };
  },

  listarMensagens() {
    return linhas('Mensagens').filter(m => m.Aprovado === true || m.Aprovado === 'SIM')
      .map(m => ({ nome: m.Nome, texto: m.Texto, data: m.Data })).reverse();
  },

  enviarMensagem(req) {
    const { g } = achaConvidado({ codigo: req.codigo });
    if (!g) throw new Error('Só convidados podem deixar recados. Use o link do seu convite.');
    const texto = String(req.texto || '').trim().slice(0, 600);
    if (texto.length < 2) throw new Error('Escreva seu recado.');
    aba('Mensagens').appendRow([novoId(), new Date(), g.Codigo, g.Nome, texto, '']);
    return { ok: true };
  },

  listarFotos() {
    return linhas('Fotos').filter(f => f.Aprovado === true || f.Aprovado === 'SIM')
      .map(f => ({ id: f.ArquivoID, nome: f.Nome, legenda: f.Legenda })).reverse();
  },

  enviarFoto(req) {
    const { g } = achaConvidado({ codigo: req.codigo });
    if (!g) throw new Error('Só convidados podem enviar fotos. Use o link do seu convite.');
    const m = String(req.imagem || '').match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!m) throw new Error('Arquivo de imagem inválido.');
    const bytes = Utilities.base64Decode(m[3]);
    if (bytes.length > 8 * 1024 * 1024) throw new Error('Foto muito grande.');
    const pasta = pastaFotos();
    const arq = pasta.createFile(Utilities.newBlob(bytes, m[1], g.Nome + ' ' + Date.now() + '.' + m[2]));
    arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    aba('Fotos').appendRow([novoId(), new Date(), g.Codigo, g.Nome, arq.getId(), String(req.legenda || '').slice(0, 140), '']);
    return { ok: true };
  },

  registrarPresente(req) {
    const valor = Number(req.valor) || 0;
    aba('Presentes').appendRow([novoId(), new Date(), String(req.codigo || ''), String(req.nome || '').slice(0, 120),
      String(req.presente || '').slice(0, 120), valor, String(req.mensagem || '').slice(0, 600)]);
    return { ok: true };
  },

  /* ---------- painel do casal ---------- */
  painel(req) {
    exigeAdmin(req);
    return {
      convidados: linhas('Convidados').map(g => ({
        codigo: g.Codigo, nome: g.Nome, tipo: g.Tipo, responsavel: g.Responsavel, telefone: g.Telefone,
        status: g.Status || 'Pendente', respondidoEm: g.RespondidoEm, obs: g.Observacao })),
      mensagens: linhas('Mensagens').map(m => ({ id: m.ID, data: m.Data, nome: m.Nome, texto: m.Texto, aprovado: m.Aprovado === true || m.Aprovado === 'SIM' })),
      fotos: linhas('Fotos').map(f => ({ id: f.ID, arquivo: f.ArquivoID, data: f.Data, nome: f.Nome, legenda: f.Legenda, aprovado: f.Aprovado === true || f.Aprovado === 'SIM' })),
      presentes: linhas('Presentes').map(p => ({ id: p.ID, data: p.Data, nome: p.Nome, presente: p.Presente, valor: p.Valor, mensagem: p.Mensagem })),
    };
  },

  moderar(req) {
    exigeAdmin(req);
    const nome = req.tipo === 'foto' ? 'Fotos' : 'Mensagens';
    const item = linhas(nome).find(x => x.ID === req.id);
    if (!item) throw new Error('Item não encontrado.');
    if (req.acao === 'aprovar') setCampo(nome, item._linha, 'Aprovado', 'SIM');
    else if (req.acao === 'excluir') {
      if (nome === 'Fotos') { try { DriveApp.getFileById(item.ArquivoID).setTrashed(true); } catch (e) {} }
      aba(nome).deleteRow(item._linha);
    }
    return { ok: true };
  },

  adicionarConvidado(req) {
    exigeAdmin(req);
    const nome = String(req.nome || '').trim();
    if (!nome) throw new Error('Informe o nome.');
    const todos = linhas('Convidados');
    const codigo = novoCodigo(new Set(todos.map(x => x.Codigo)));
    aba('Convidados').appendRow([codigo, nome, req.tipo === 'Criança' ? 'Criança' : 'Adulto',
      String(req.responsavel || ''), String(req.telefone || ''), 'Pendente', '', '']);
    return { codigo };
  },

  excluirConvidado(req) {
    exigeAdmin(req);
    const g = linhas('Convidados').find(x => x.Codigo === req.codigo);
    if (g) aba('Convidados').deleteRow(g._linha);
    return { ok: true };
  },
};

/** Gera códigos para convidados colados direto na planilha sem código. Rode quando importar a lista. */
function gerarCodigosFaltantes() {
  const sh = aba('Convidados');
  const todos = linhas('Convidados');
  const v = sh.getDataRange().getValues();
  const usados = new Set(v.slice(1).map(r => r[0]).filter(Boolean));
  for (let i = 1; i < v.length; i++) {
    if (!v[i][0] && v[i][1]) {
      const c = novoCodigo(usados); usados.add(c);
      sh.getRange(i + 1, 1).setValue(c);
      if (!v[i][2]) sh.getRange(i + 1, 3).setValue('Adulto');
      if (!v[i][5]) sh.getRange(i + 1, 6).setValue('Pendente');
    }
  }
}
