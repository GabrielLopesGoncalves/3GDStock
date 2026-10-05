// PAM I - Validacao automatica das fases do projeto e calculo da nota.
// Pontua: Fase 1 (10), Fase 2 (15), Fase 3 (30) = 55 pts.
// Nota: I (<25%), R (25-50%), B (50-75%), MB (>75%).
// Pra gerar o artefato: node .github/scripts/pam-ci.mjs

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';

const CONFIG = JSON.parse(readFileSync('.github/pam-ci.config.json', 'utf8'));
const ROOT = CONFIG.raiz === undefined ? '.' : CONFIG.raiz;
const GIT_SHA = process.env.GITHUB_SHA || 'local';
const RUN_ID =
  process.env.GITHUB_RUN_ID || String(Math.floor(Date.now() / 1000));
const DATE = new Date().toISOString().slice(0, 19).replace('T', ' ');

const PKG = readJson('package.json');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  '.github',
  'dist',
  'build',
  'coverage',
  'android',
  'ios',
  'web',
]);
const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'nota.md',
  'NOTA.md',
  'nota.json',
]);
const TEXT_EXT = /\.(m?jsx?|tsx?|json|md|mjs|cts|mts)$/;
const CODE_EXT = /\.(m?jsx?|tsx?|mjs|cts|mts)$/;

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  } catch {
    return {};
  }
}

function read(rel) {
  if (typeof rel !== 'string' || rel === '') return '';
  try {
    return readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

function fileExists(rel) {
  return typeof rel === 'string' && rel !== '' && existsSync(join(ROOT, rel));
}

function allFiles() {
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!IGNORED_DIRS.has(name)) walk(full);
      } else if (!IGNORED_FILES.has(name) && TEXT_EXT.test(name)) {
        out.push(full);
      }
    }
  };
  walk(ROOT);
  return out;
}

const codeFiles = allFiles().filter((f) => CODE_EXT.test(f));

function grepFiles(re) {
  const hits = [];
  for (const f of codeFiles) {
    if (re.test(read(f))) hits.push(f);
  }
  return hits;
}

function grepIn(rel, re) {
  return fileExists(rel) && re.test(read(rel));
}


function unresolvedImports() {
  const deps = { ...(PKG.dependencies || {}), ...(PKG.devDependencies || {}) };
  const known = Object.keys(deps);
  const unresolved = new Set();
  const re =
    /(?:(?:import|export)\s+(?:[^'"]*\s+from\s+)?|require\()\s*['"]([^'"]+)['"]/g;
  for (const f of codeFiles) {
    const text = read(f);
    let m;
    while ((m = re.exec(text))) {
      const spec = m[1];
      if (/^[./]/.test(spec)) continue; // import relativo
      if (/^node:/.test(spec)) continue; // módulo nativo do Node
      if (/[a-zA-Z]:\\/.test(spec)) continue; // caminho windows
      const base = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      const ok = known.some(
        (k) => k === base || k.startsWith(base + '/') || base.startsWith(k + '/'),
      );
      if (!ok) unresolved.add(spec);
    }
  }
  return [...unresolved];
}

const PKG_EXPONAME_DEV = (() => {
  try {
    const app = JSON.parse(read('app.json'));
    const n = app.expo && app.expo.name;
    return typeof n === 'string' && n.length > 0 && !/^app(\s|-)?base$/i.test(n);
  } catch {
    return false;
  }
})();

const screenFiles = (() => {
  const cand = [];
  for (const f of codeFiles) {
    if (/(screen|tela|lista|detalhe|adicionar|cadastro)/i.test(f)) cand.push(f);
  }
  return cand;
})();

// ---------- Checklist (Fase 1) ----------
const UNRESOLVED = unresolvedImports();
const F1 = [
  {
    pts: 1,
    nome: 'README.md existe e fala do projeto/grupo',
    ok: existsSync(join(ROOT, 'README.md')) && /(^|\n)#[^\n]*[\wÀ-ú]/m.test(read('README.md')),
    prova: fileExists('README.md') ? 'README.md' : '—',
  },
  {
    pts: 1,
    nome: `Arquivo principal do app existe (${CONFIG.principal || 'App.js/app'})`,
    ok: fileExists(CONFIG.principal),
    prova: CONFIG.principal || '—',
  },
  {
    pts: 1,
    nome: 'package.json existe com a dependência "expo"',
    ok: PKG.dependencies && 'expo' in PKG.dependencies,
    prova: PKG.dependencies && PKG.dependencies.expo ? `expo ${PKG.dependencies.expo}` : '—',
  },
  {
    pts: 1,
    nome: 'Existe tela de LISTAGEM',
    ok: fileExists(CONFIG.lista),
    prova: CONFIG.lista || screenFiles.join(', ') || '—',
  },
  {
    pts: 1,
    nome: 'Existem dados iniciais (seed) em arquivo de dados',
    ok: (CONFIG.dados || []).some(fileExists) || grepFiles(/[(=]\s*\[/).length > 0,
    prova: (CONFIG.dados || []).find(fileExists) || grepFiles(/[(=]\s*\[/)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe tela de FORMULÁRIO',
    ok: fileExists(CONFIG.form),
    prova: CONFIG.form || screenFiles.filter((f) => /adicionar|cadastro|form/i.test(f))[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe tela de DETALHE',
    ok: fileExists(CONFIG.detalhe),
    prova: CONFIG.detalhe || screenFiles.filter((f) => /detalhe|detail/i.test(f))[0] || '—',
  },
  {
    pts: 1,
    nome: 'Dependências importadas existem no package.json (app não quebra ao abrir)',
    ok: UNRESOLVED.length === 0,
    prova: UNRESOLVED.length ? UNRESOLVED.slice(0, 5).join(', ') : 'todos os imports resolvem',
  },
  {
    pts: 1,
    nome: 'app.json identifica o app (name/slug preenchidos)',
    ok: PKG_EXPONAME_DEV,
    prova: 'app.json',
  },
  {
    pts: 1,
    nome: 'Projeto tem pelo menos 2 arquivos de tela/código',
    ok: screenFiles.length >= 2,
    prova: `${screenFiles.length} arquivos de tela`,
  },
];

// ---------- Checklist (Fase 2) ----------
const LISTA = read(CONFIG.lista);
const FORM = read(CONFIG.form);
const DETALHE = read(CONFIG.detalhe);
const STORAGE = read(CONFIG.storage);

const getItemFiles = grepFiles(/AsyncStorage\.getItem/);
const setItemFiles = grepFiles(/AsyncStorage\.setItem/);

const F2 = [
  {
    pts: 1,
    nome: 'Dependência async-storage está no package.json',
    ok: PKG.dependencies && '@react-native-async-storage/async-storage' in PKG.dependencies,
    prova:
      PKG.dependencies && PKG.dependencies['@react-native-async-storage/async-storage']
        ? 'no package.json'
        : 'FALTA instalar: npx expo install @react-native-async-storage/async-storage',
  },
  {
    pts: 1,
    nome: 'Existe import do AsyncStorage no código',
    ok: grepFiles(/@react-native-async-storage\/async-storage/).length > 0,
    prova: grepFiles(/@react-native-async-storage\/async-storage/)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Storage faz leitura com AsyncStorage.getItem',
    ok: getItemFiles.length > 0,
    prova: getItemFiles[0] || '—',
  },
  {
    pts: 1,
    nome: 'Storage grava com AsyncStorage.setItem',
    ok: setItemFiles.length > 0,
    prova: setItemFiles[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de CARREGAR a lista (carregar/load)',
    ok: grepFiles(/\b(function\s+)?carregar\w*|load\w*/i).length > 0,
    prova: grepFiles(/\b(function\s+)?carregar\w*|load\w*/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de ADICIONAR/CADASTRAR',
    ok: grepFiles(/\b(adicionar\w*|salvar\w*|cadastrar\w*|add\w*)\s*[=:(]/i).length > 0,
    prova: grepFiles(/\b(adicionar\w*|salvar\w*|cadastrar\w*|add\w*)\s*[=:(]/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe busca por id (buscar/find/getItem)',
    ok: grepFiles(/\b(buscar\w*|find\s*\(|getItem\()/i).length > 0,
    prova: grepFiles(/\b(buscar\w*|find\s*\(|getItem\()/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de EXCLUIR/remover',
    ok: grepFiles(/\b(excluir|removeItem|filter\s*\()/i).length > 0,
    prova: grepFiles(/\b(excluir|removeItem|filter\s*\()/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Formulário lê entradas com TextInput',
    ok: fileExists(CONFIG.form) && /<TextInput/.test(FORM),
    prova: CONFIG.form || '—',
  },
  {
    pts: 1,
    nome: 'Formulário salva chamando adicionar/salvar',
    ok: fileExists(CONFIG.form) && /\b(adicionar\w*|salvar\w*|cadastrar\w*)\s*\(|onPress/.test(FORM),
    prova: CONFIG.form || '—',
  },
  {
    pts: 1,
    nome: 'Lista é alimentada a partir do storage',
    ok: /carregar\w*|getItem|AsyncStorage|load\w*/i.test(LISTA),
    prova: CONFIG.lista || '—',
  },
  {
    pts: 1,
    nome: 'Tela de detalhe usa busca/dados do storage',
    ok: /buscar\w*|find\s*\(|getItem|params|route/i.test(DETALHE),
    prova: CONFIG.detalhe || '—',
  },
  {
    pts: 1,
    nome: 'Exclusão usa confirmação (Alert.alert)',
    ok: grepFiles(/Alert\.alert/).some((f) => /excluir|removeItem|delete|remover/i.test(read(f))),
    prova: grepFiles(/Alert\.alert/).find((f) => /excluir|removeItem|delete|remover/i.test(read(f))) || '—',
  },
  {
    pts: 1,
    nome: 'Dados iniciais/seed são gravados na 1ª execução',
    ok: setItemFiles.length > 0 && grepFiles(/INICIAIS|INICIAL|seed|mock|DEFAULT/i).length > 0,
    prova: setItemFiles[0] || '—',
  },
  {
    pts: 1,
    nome: 'Formulário valida campos (trim/length/vazio)',
    ok: /\.trim\(\)|\.length|===['"]/i.test(FORM),
    prova: CONFIG.form || '—',
  },
];

// ---------- Checklist (Fase 3) ----------
const sqliteImport = grepFiles(/expo-sqlite/);
const dbFileCands = codeFiles.filter((f) => /database|banco|\.db\.|db\.(js|ts)/i.test(f));

const F3 = [
  {
    pts: 2,
    nome: 'Dependência expo-sqlite está no package.json',
    ok: PKG.dependencies && 'expo-sqlite' in PKG.dependencies,
    prova:
      PKG.dependencies && PKG.dependencies['expo-sqlite']
        ? 'no package.json'
        : 'FALTA instalar: npx expo install expo-sqlite',
  },
  {
    pts: 2,
    nome: 'Existe import do expo-sqlite',
    ok: sqliteImport.length > 0,
    prova: sqliteImport[0] || '—',
  },
  {
    pts: 2,
    nome: 'Existe arquivo de banco de dados',
    ok: dbFileCands.length > 0 || fileExists(CONFIG.sqlite),
    prova: CONFIG.sqlite || dbFileCands[0] || '—',
  },
  {
    pts: 2,
    nome: 'Cria a tabela com CREATE TABLE IF NOT EXISTS',
    ok: grepFiles(/CREATE TABLE\s+IF NOT EXISTS/i).length > 0,
    prova: grepFiles(/CREATE TABLE\s+IF NOT EXISTS/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Insere dados com INSERT INTO',
    ok: grepFiles(/INSERT INTO/i).length > 0,
    prova: grepFiles(/INSERT INTO/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Consulta com SELECT',
    ok: grepFiles(/\bSELECT\b/i).length > 0,
    prova: grepFiles(/\bSELECT\b/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Atualiza com UPDATE',
    ok: grepFiles(/\bUPDATE\s+\w+/i).length > 0,
    prova: grepFiles(/\bUPDATE\s+\w+/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Exclui com DELETE FROM',
    ok: grepFiles(/DELETE FROM/i).length > 0,
    prova: grepFiles(/DELETE FROM/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Usa filtros com WHERE',
    ok: grepFiles(/\bWHERE\b/i).length > 0,
    prova: grepFiles(/\bWHERE\b/i)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Banco aberto com openDatabaseAsync/openDatabase',
    ok: grepFiles(/openDatabase(Async)?\s*\(/).length > 0,
    prova: grepFiles(/openDatabase(Async)?\s*\(/)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Tela de lista carrega dados do banco',
    ok: /expo-sqlite|SELECT|database|banco/i.test(LISTA),
    prova: CONFIG.lista || '—',
  },
  {
    pts: 2,
    nome: 'Formulário salva no banco (INSERT/runAsync)',
    ok: /expo-sqlite|INSERT|runAsync/i.test(FORM),
    prova: CONFIG.form || '—',
  },
  {
    pts: 2,
    nome: 'Detalhe busca no banco com WHERE/SELECT',
    ok: /WHERE|SELECT|expo-sqlite|sql/i.test(DETALHE),
    prova: CONFIG.detalhe || '—',
  },
  {
    pts: 2,
    nome: 'Usa async/await corretamente (mais de 2 await)',
    ok: codeFiles.filter((f) => (read(f).match(/\bawait\b/g) || []).length >= 2).length > 0,
    prova: codeFiles.find((f) => (read(f).match(/\bawait\b/g) || []).length >= 2) || '—',
  },
  {
    pts: 2,
    nome: 'Banco possui dados iniciais (seed inserido em SQL)',
    ok: grepFiles(/INSERT INTO\s+\w+\s*\(/i).length > 0,
    prova: grepFiles(/INSERT INTO\s+\w+\s*\(/i)[0] || '—',
  },
];

// ---------- Cálculo da nota ----------
const FASE1_TOTAL = F1.reduce((s, i) => s + i.pts, 0);
const FASE2_TOTAL = F2.reduce((s, i) => s + i.pts, 0);
const FASE3_TOTAL = F3.reduce((s, i) => s + i.pts, 0);
const TOTAL = FASE1_TOTAL + FASE2_TOTAL + FASE3_TOTAL;

const F1_G = F1.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const F2_G = F2.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const F3_G = F3.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const GANHO = F1_G + F2_G + F3_G;
const PECENT = Math.round((GANHO / TOTAL) * 100);

let nota = 'I';
let cor = 'red';
if (PECENT >= 75) { nota = 'MB'; cor = 'green'; }
else if (PECENT >= 50) { nota = 'B'; cor = 'yellow'; }
else if (PECENT >= 25) { nota = 'R'; cor = 'orange'; }

function linhaCirterio(c, fase) {
  const mark = c.ok ? '[x]' : '[ ]';
  return `${mark} **(+${c.pts}${fase === 'F3' ? 'x2' : ''} pts)** ${c.nome} — \`${c.prova}\``;
}

const md = `# Nota PAM I — ${CONFIG.grupo}

![](https://img.shields.io/static/v1?label=Nota%20PAM%20I&message=${nota}&color=${cor})

**Nota atual: ${nota}** · ${PECENT}% (${GANHO}/${TOTAL} pontos) · rodada de ${DATE} · commit \`${GIT_SHA.slice(0, 7)}\`

Legenda: I = Insuficiente (0–25%) · R = Regular (25–50%) · B = Bom (50–75%) · MB = Muito bom (75–100%)

| Fase | Pontos | Situação |
|---|---|---|
| Fase 1 — Estrutura | ${F1_G}/${FASE1_TOTAL} | ${F1_G === FASE1_TOTAL ? 'completa' : F1_G >= Math.ceil(FASE1_TOTAL / 2) ? 'em desenvolvimento' : 'iniciando'} |
| Fase 2 — AsyncStorage | ${F2_G}/${FASE2_TOTAL} | ${F2_G === FASE2_TOTAL ? 'completa' : F2_G >= Math.ceil(FASE2_TOTAL / 2) ? 'em desenvolvimento' : 'iniciando'} |
| Fase 3 — SQLite | ${F3_G}/${FASE3_TOTAL} | ${F3_G === FASE3_TOTAL ? 'completa' : F3_G >= Math.ceil(FASE3_TOTAL / 2) ? 'em desenvolvimento' : 'iniciando'} |

## Checklist validado

### Fase 1 — Estrutura do projeto (${F1_G}/${FASE1_TOTAL} pts)

${F1.map((i) => '- ' + linhaCirterio(i, 'F1')).join('\n')}

### Fase 2 — Persistência com AsyncStorage (${F2_G}/${FASE2_TOTAL} pts)

${F2.map((i) => '- ' + linhaCirterio(i, 'F2')).join('\n')}

### Fase 3 — Banco de dados SQLite (${F3_G}/${FASE3_TOTAL} pts)

${F3.map((i) => '- ' + linhaCirterio(i, 'F3')).join('\n')}

## Para evoluir a nota

Os itens **desmarcados** acima são exatamente o que falta no projeto. Cada rodada deste CI (a cada push) recalcula e atualiza a nota — o artefato \`nota-pam\` sempre mostra o valor mais recente.
`;

writeFileSync('nota.md', md);

writeFileSync(
  'nota.json',
  JSON.stringify(
    {
      grupo: CONFIG.grupo,
      commit: GIT_SHA,
      data: DATE,
      run: RUN_ID,
      pontos: GANHO,
      total: TOTAL,
      percentual: PECENT,
      nota,
      porFase: {
        fase1: { pontos: F1_G, total: FASE1_TOTAL },
        fase2: { pontos: F2_G, total: FASE2_TOTAL },
        fase3: { pontos: F3_G, total: FASE3_TOTAL },
      },
      itens: [...F1, ...F2, ...F3].map((i) => ({ nome: i.nome, ok: i.ok })),
    },
    null,
    2,
  ),
);

console.log(md);
console.log(`NOTA=${nota} PECENT=${PECENT} PONTOS=${GANHO}/${TOTAL}`);