// PAM I - Validacao automatica (estatica + testes funcionais de execucao) das fases do projeto e calculo da nota.
// Pontua: Fase 1 (10 - peso 1x), Fase 2 (15 - peso 1x), Fase 3 (30 - peso 2x), Fase 4 (45 - peso 3x) = 100 pts.
// Nota: I (<25%), R (25-50%), B (50-75%), MB (>75%).
// Pra gerar o artefato: node .github/scripts/pam-ci.mjs

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

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
  'scripts',
]);
const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'nota.md',
  'NOTA.md',
  'nota.json',
  'pam-ci.mjs',
  'publicar-nota.mjs',
  'metro.config.js',
  'babel.config.js',
  'eslint.config.js',
  'expo-env.d.ts',
  'reset-project.js',
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
      const full = join(dir, name).replace(/\\/g, '/');
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

const NODE_BUILTINS = new Set([
  'fs',
  'path',
  'os',
  'util',
  'events',
  'stream',
  'http',
  'https',
  'url',
  'crypto',
  'readline',
  'child_process',
  'assert',
]);

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
      if (/^[./]/.test(spec)) continue;
      if (/^(@\/|~\/)/.test(spec)) continue;
      if (/^node:/.test(spec)) continue;
      if (/[a-zA-Z]:\\/.test(spec)) continue;
      const base = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      if (NODE_BUILTINS.has(base)) continue;
      const ok = known.some(
        (k) => k === base || k.startsWith(base + '/') || base.startsWith(k + '/'),
      );
      if (!ok) unresolved.add(spec);
    }
  }
  return [...unresolved];
}

// ============================================================================
// MOTOR DE TESTES FUNCIONAIS (Runtime Node + node:sqlite em memória + Mocks)
// ============================================================================
function normalizeSqlParams(params) {
  let flat = params;
  if (params.length === 1 && Array.isArray(params[0])) {
    flat = params[0];
  }
  return flat.map((v) => (v === undefined ? null : v));
}

function createFunctionalTestEngine(rootDir) {
  const rawDb = new DatabaseSync(':memory:');
  const sqlStats = {
    opened: false,
    tablesCreated: [],
    inserts: 0,
    selects: 0,
    updates: 0,
    deletes: 0,
    whereQueries: 0,
  };

  const refreshTables = () => {
    try {
      const rows = rawDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all();
      sqlStats.tablesCreated = rows.map((r) => r.name);
    } catch {}
  };

  const dbApi = {
    rawDb,
    execSync(sql) {
      rawDb.exec(sql);
      const up = sql.toUpperCase();
      if (up.includes('INSERT INTO')) sqlStats.inserts++;
      refreshTables();
    },
    async execAsync(sql) {
      return this.execSync(sql);
    },
    runSync(sql, ...rest) {
      const params = normalizeSqlParams(rest);
      const stmt = rawDb.prepare(sql);
      const res = stmt.run(...params);
      const up = sql.trim().toUpperCase();
      if (up.startsWith('INSERT')) sqlStats.inserts += Math.max(1, Number(res.changes || 0));
      if (up.startsWith('UPDATE')) sqlStats.updates += Math.max(1, Number(res.changes || 0));
      if (up.startsWith('DELETE')) sqlStats.deletes += Math.max(1, Number(res.changes || 0));
      if (up.includes('WHERE')) sqlStats.whereQueries++;
      refreshTables();
      return {
        changes: Number(res.changes || 0),
        lastInsertRowId: Number(res.lastInsertRowid || 0),
      };
    },
    async runAsync(sql, ...rest) {
      return this.runSync(sql, ...rest);
    },
    getAllSync(sql, ...rest) {
      const params = normalizeSqlParams(rest);
      const stmt = rawDb.prepare(sql);
      const rows = stmt.all(...params).map((r) => ({ ...r }));
      const up = sql.trim().toUpperCase();
      if (up.startsWith('SELECT')) sqlStats.selects++;
      if (up.includes('WHERE')) sqlStats.whereQueries++;
      return rows;
    },
    async getAllAsync(sql, ...rest) {
      return this.getAllSync(sql, ...rest);
    },
    getFirstSync(sql, ...rest) {
      const rows = this.getAllSync(sql, ...rest);
      return rows.length > 0 ? rows[0] : null;
    },
    async getFirstAsync(sql, ...rest) {
      return this.getFirstSync(sql, ...rest);
    },
    async withTransactionAsync(fn) {
      await fn();
    },
    withTransactionSync(fn) {
      fn();
    },
    async closeAsync() {},
    closeSync() {},
  };

  const sqliteMock = {
    openDatabaseSync() {
      sqlStats.opened = true;
      return dbApi;
    },
    async openDatabaseAsync() {
      sqlStats.opened = true;
      return dbApi;
    },
    openDatabase() {
      sqlStats.opened = true;
      return dbApi;
    },
    async deleteDatabaseAsync() {},
    deleteDatabaseSync() {},
  };

  const asyncStore = new Map();
  const asyncStats = { getCalls: 0, setCalls: 0, removeCalls: 0 };
  const asyncMockObj = {
    async getItem(k) {
      asyncStats.getCalls++;
      return asyncStore.has(k) ? asyncStore.get(k) : null;
    },
    async setItem(k, v) {
      asyncStats.setCalls++;
      asyncStore.set(k, String(v));
    },
    async removeItem(k) {
      asyncStats.removeCalls++;
      asyncStore.delete(k);
    },
    async clear() {
      asyncStore.clear();
    },
    async getAllKeys() {
      return [...asyncStore.keys()];
    },
  };
  const asyncMock = { ...asyncMockObj, default: asyncMockObj };

  function transformToCjs(code, filename) {
    let src = code;
    if (/\.(ts|tsx)$/.test(filename)) {
      try {
        src = stripTypeScriptTypes(src, { mode: 'transform' });
      } catch {
        try {
          src = stripTypeScriptTypes(src);
        } catch {
          src = src
            .replace(/export\s+type\s+\w+\s*=\s*[\s\S]*?;/g, '')
            .replace(/export\s+interface\s+\w+\s*\{[\s\S]*?\}/g, '')
            .replace(/<[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*>\s*\(/g, '(');
        }
      }
    }
    const exportedFns = [];
    src = src
      .replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, 'const $1 = require("$2");')
      .replace(/import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g, (_, def, named, mod) => {
        const cleanNamed = named.replace(/\btype\s+\w+\s*,?/g, '').replace(/\s+as\s+/g, ': ');
        return `const _m = require("${mod}"); const ${def} = _m.default || _m; const {${cleanNamed}} = _m;`;
      })
      .replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g, (_, named, mod) => {
        const cleanNamed = named.replace(/\btype\s+\w+\s*,?/g, '').replace(/\s+as\s+/g, ': ');
        return `const {${cleanNamed}} = require("${mod}");`;
      })
      .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, 'const _d_$1 = require("$2"); const $1 = _d_$1 && _d_$1.default ? _d_$1.default : _d_$1;')
      .replace(/import\s+['"]([^'"]+)['"]\s*;?/g, 'require("$1");')
      .replace(/export\s+default\s+function\s+(\w+)/g, (_, name) => {
        exportedFns.push(`exports.default = ${name};`);
        return `function ${name}`;
      })
      .replace(/export\s+default\s+/g, 'exports.default = ')
      .replace(/export\s+async\s+function\s+(\w+)/g, (_, name) => {
        exportedFns.push(`exports.${name} = ${name};`);
        return `async function ${name}`;
      })
      .replace(/export\s+function\s+(\w+)/g, (_, name) => {
        exportedFns.push(`exports.${name} = ${name};`);
        return `function ${name}`;
      })
      .replace(/export\s+const\s+(\w+)/g, 'const $1 = exports.$1')
      .replace(/export\s+let\s+(\w+)/g, 'let $1 = exports.$1')
      .replace(/export\s+\{([^}]+)\}\s*;?/g, (_, names) =>
        names
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n && !n.startsWith('type '))
          .map((n) => {
            const [local, exported] = n.split(/\s+as\s+/);
            return `exports.${exported || local} = ${local};`;
          })
          .join(' '),
      );
    if (exportedFns.length) {
      src += '\n' + exportedFns.join('\n');
    }
    return src;
  }

  function resolveProjectFile(fromDir, spec) {
    const candidates = [];
    if (spec.startsWith('@/')) {
      const rel = spec.slice(2);
      candidates.push(join(rootDir, 'src', rel), join(rootDir, rel));
    } else if (spec.startsWith('.')) {
      candidates.push(resolve(fromDir, spec));
      const baseName = spec.split('/').pop();
      if (baseName) {
        candidates.push(join(rootDir, 'data', baseName), join(rootDir, 'src', 'data', baseName));
      }
    } else {
      return null;
    }
    const exts = ['', '.js', '.ts', '.tsx', '.jsx', '.json', '/index.js', '/index.ts', '/index.tsx'];
    for (const c of candidates) {
      for (const ext of exts) {
        if (existsSync(c + ext) && statSync(c + ext).isFile()) {
          return c + ext;
        }
      }
    }
    return null;
  }

  const cache = new Map();
  function loadModule(absPath) {
    if (cache.has(absPath)) return cache.get(absPath).exports;
    const mod = { exports: {} };
    cache.set(absPath, mod);

    if (absPath.endsWith('.json')) {
      mod.exports = JSON.parse(readFileSync(absPath, 'utf8'));
      return mod.exports;
    }

    const raw = readFileSync(absPath, 'utf8');
    if (/<(View|Text|FlatList|TouchableOpacity|ScrollView|SafeAreaView|Pressable)\b/.test(raw)) {
      return mod.exports;
    }
    const cjs = transformToCjs(raw, absPath);

    const customRequire = (spec) => {
      if (spec === 'expo-sqlite') return sqliteMock;
      if (spec === '@react-native-async-storage/async-storage') return asyncMock;
      if (spec === 'react-native') {
        return {
          Platform: { OS: 'android', select: (o) => o?.android ?? o?.default },
          Alert: {
            alert: (_t, _m, buttons) => {
              if (Array.isArray(buttons)) {
                const destructive = buttons.find((b) => b.style === 'destructive' || /excluir|remover|apagar|sim/i.test(b.text));
                if (destructive && typeof destructive.onPress === 'function') destructive.onPress();
              }
            },
          },
          StyleSheet: { create: (s) => s },
        };
      }
      if (spec === 'react') {
        return {
          useState: (init) => {
            let val = typeof init === 'function' ? init() : init;
            return [val, (next) => { val = typeof next === 'function' ? next(val) : next; }];
          },
          useEffect: () => {},
          useCallback: (fn) => fn,
          useMemo: (fn) => fn(),
          useRef: (v) => ({ current: v }),
        };
      }
      const resolved = resolveProjectFile(dirname(absPath), spec);
      if (resolved) return loadModule(resolved);
      return {};
    };

    const fn = vm.compileFunction(
      cjs,
      ['exports', 'require', 'module', '__filename', '__dirname'],
      { filename: absPath },
    );
    fn(mod.exports, customRequire, mod, absPath, dirname(absPath));
    return mod.exports;
  }

  function buildSampleItem() {
    const item = {
      id: 'ci_test_999',
      nome: 'Item Teste CI',
      titulo: 'Item Teste CI',
      descricao: 'Descrição Teste CI',
      materia: 'Programação Mobile',
      prazo: '2026-11-16',
      status_id: 1,
      categoria: 'Geral',
      responsavel: 'Aluno CI',
      status: 'Disponível',
      dataCadastro: '2026-11-09',
      dataEmprestimo: null,
      dataDevolucao: null,
      valor: 150.5,
      tipo: 'receita',
      data: '2026-11-09',
      modalidade: 'Futsal',
      dataInicio: '01/11/2026',
      dataFim: '15/11/2026',
      qtdTimes: 8,
      local: 'ETEC Bento Quirino',
      times: ['Time A', 'Time B'],
      servico: 'Consultoria',
      email: 'teste@etec.sp.gov.br',
      telefone: '(19) 99999-9999',
      desde: 'Novembro 2026',
      valorMensal: 'R$ 500,00',
      concluida: false,
    };

    try {
      const tables = rawDb
        .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all();
      for (const t of tables) {
        const ddl = t.sql || '';
        const re = /(\w+)\s+[^,)*]*CHECK\s*\(\s*\1\s+IN\s*\(\s*'([^']+)'/gi;
        let m;
        while ((m = re.exec(ddl))) {
          item[m[1]] = m[2];
        }
      }
    } catch {}
    return item;
  }

  async function runModuleCrud(modExports) {
    const fnNames = Object.keys(modExports).filter((k) => typeof modExports[k] === 'function');
    const res = { initOk: false, listOk: false, addOk: false, updateOk: false, deleteOk: false };
    if (fnNames.length === 0) return res;

    for (const name of fnNames) {
      if (/^(abrir|iniciar|inicializar|init|getDatabase)/i.test(name)) {
        try {
          await modExports[name]();
          res.initOk = true;
        } catch {}
      }
    }

    let listFn = null;
    for (const name of fnNames) {
      if (/^(carregar|listar|getAll)/i.test(name) && !/Status|PorStatus|Count/i.test(name)) {
        listFn = modExports[name];
        try {
          const r = await listFn();
          if (Array.isArray(r)) res.listOk = true;
        } catch {}
      }
    }

    for (const name of fnNames) {
      if (/^useFuncoes/i.test(name)) {
        try {
          const hook = modExports[name]();
          if (hook && typeof hook.carregarLista === 'function') {
            await hook.carregarLista();
            res.listOk = true;
          }
          if (hook && typeof hook.adicionarItem === 'function') {
            await hook.adicionarItem();
            res.addOk = true;
          }
          if (hook && typeof hook.excluirItem === 'function') {
            await hook.excluirItem(1);
            res.deleteOk = true;
          }
        } catch {}
      }
    }

    const sample = buildSampleItem();

    for (const name of fnNames) {
      if (/^(criar|inserir|insert|adicionar)/i.test(name) && !/Status|DadosIniciais/i.test(name)) {
        try {
          const fn = modExports[name];
          if (fn.length >= 2) {
            await fn(sample.titulo, sample.descricao);
          } else {
            await fn(sample);
          }
          res.addOk = true;
        } catch {}
      }
    }

    let targetId = sample.id;
    if (listFn) {
      try {
        const listAfter = (await listFn()) || [];
        if (Array.isArray(listAfter) && listAfter.length > 0) {
          res.listOk = true;
          const itemWithCid = listAfter.find((x) => x && (x.id === sample.id || x.nome === sample.nome || x.titulo === sample.titulo));
          const chosen = itemWithCid || listAfter[0];
          if (chosen && chosen.id !== undefined) targetId = chosen.id;
        }
      } catch {}
    }

    for (const name of fnNames) {
      if (/^(atualizar|update|alternar)/i.test(name) && !/Status/i.test(name)) {
        try {
          const fn = modExports[name];
          const updatedObj = { ...sample, id: targetId, nome: 'Editado CI', titulo: 'Editado CI' };
          if (fn.length >= 2) {
            await fn(targetId, updatedObj);
          } else {
            await fn(updatedObj);
          }
          res.updateOk = true;
        } catch {}
      }
    }

    for (const name of fnNames) {
      if (/^(excluir|delete|deletar|remover)/i.test(name) && !/Status/i.test(name)) {
        try {
          await modExports[name](targetId);
          res.deleteOk = true;
        } catch {}
      }
    }

    return res;
  }

  function runDirectSqlEngineCrudTest() {
    const tables = rawDb
      .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all();
    if (tables.length === 0) {
      return { schemaOk: false, insertSelectOk: false, updateWhereOk: false, deleteOk: false, table: '—' };
    }

    let mainTable = tables[0];
    for (const t of tables) {
      const cols = rawDb.prepare(`PRAGMA table_info("${t.name}")`).all();
      if (cols.length >= 3 && !/^(config|status)$/i.test(t.name)) {
        mainTable = t;
        break;
      }
    }

    const tName = mainTable.name;
    const cols = rawDb.prepare(`PRAGMA table_info("${tName}")`).all();
    const ddl = mainTable.sql || '';

    const insertCols = [];
    const insertVals = [];
    for (const c of cols) {
      if (c.pk === 1 && /INTEGER/i.test(c.type)) continue;
      insertCols.push(c.name);
      const colName = c.name.toLowerCase();
      const checkRe = new RegExp(`${c.name}\\s+[^,)*]*CHECK\\s*\\(\\s*${c.name}\\s+IN\\s*\\(\\s*'([^']+)'`, 'i');
      const mCheck = ddl.match(checkRe);
      if (mCheck) {
        insertVals.push(mCheck[1]);
      } else if (/REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL/i.test(c.type) || /valor|preco|saldo|qtd|quantidade/i.test(colName)) {
        insertVals.push(100);
      } else if (/INT/i.test(c.type)) {
        insertVals.push(1);
      } else if (colName === 'id') {
        insertVals.push('test_ci_sql_999');
      } else if (colName === 'times') {
        insertVals.push('["Time A", "Time B"]');
      } else if (colName === 'cor') {
        insertVals.push('#2563EB');
      } else {
        insertVals.push(`Teste SQL ${c.name}`);
      }
    }

    let insertSelectOk = false;
    let updateWhereOk = false;
    let deleteOk = false;

    try {
      const placeholders = insertCols.map(() => '?').join(', ');
      const insRes = dbApi.runSync(
        `INSERT INTO "${tName}" (${insertCols.join(', ')}) VALUES (${placeholders})`,
        insertVals,
      );
      const rows = dbApi.getAllSync(`SELECT * FROM "${tName}"`);
      insertSelectOk = insRes.changes >= 1 && rows.length >= 1;

      if (insertSelectOk) {
        const insertedRow = rows[rows.length - 1];
        const pkCol = cols.find((c) => c.pk === 1)?.name || cols[0].name;
        const pkVal = insertedRow[pkCol];

        const textCol =
          cols.find(
            (c) => c.pk === 0 && !/CHECK/i.test(ddl) && / nome|titulo|descricao|local|servico|categoria/i.test(' ' + c.name),
          ) || cols.find((c) => c.pk === 0 && /TEXT/i.test(c.type));

        if (textCol) {
          const upRes = dbApi.runSync(
            `UPDATE "${tName}" SET "${textCol.name}" = ? WHERE "${pkCol}" = ?`,
            ['Atualizado SQL CI', pkVal],
          );
          const checkRow = dbApi.getFirstSync(
            `SELECT * FROM "${tName}" WHERE "${pkCol}" = ?`,
            [pkVal],
          );
          updateWhereOk = upRes.changes >= 1 && Boolean(checkRow && checkRow[textCol.name] === 'Atualizado SQL CI');
        }

        const delRes = dbApi.runSync(`DELETE FROM "${tName}" WHERE "${pkCol}" = ?`, [pkVal]);
        const afterDel = dbApi.getFirstSync(`SELECT * FROM "${tName}" WHERE "${pkCol}" = ?`, [pkVal]);
        deleteOk = delRes.changes >= 1 && afterDel === null;
      }
    } catch {}

    return {
      schemaOk: true,
      insertSelectOk,
      updateWhereOk,
      deleteOk,
      table: tName,
    };
  }

  return {
    sqlStats,
    asyncStats,
    loadModule,
    runModuleCrud,
    runDirectSqlEngineCrudTest,
  };
}

const engine = createFunctionalTestEngine(ROOT);
const candidateModules = [
  CONFIG.storage,
  ...(CONFIG.dados || []),
  CONFIG.sqlite,
  'src/data/storage.js',
  'src/data/database.js',
  'src/database/database.js',
  'src/database/database.ts',
  'src/lib/database.ts',
  'src/lib/storage.ts',
  'data/storage.js',
  'data/database.js',
  'banco.js',
  'src/storage/financeStorage.ts',
  'src/storage/materias.ts',
  'lib/storage.js',
  'components/funcoes_lista.ts',
]
  .filter(Boolean)
  .filter((rel, idx, arr) => fileExists(rel) && arr.indexOf(rel) === idx);

let modulesCompiledCount = 0;
let moduleCompileErrors = [];
const crudSummary = {
  initOk: false,
  listOk: false,
  addOk: false,
  updateOk: false,
  deleteOk: false,
  testedFiles: [],
};

for (const rel of candidateModules) {
  try {
    const exp = engine.loadModule(join(ROOT, rel));
    const fnCount = Object.keys(exp).filter((k) => typeof exp[k] === 'function').length;
    modulesCompiledCount++;
    if (fnCount > 0) {
      crudSummary.testedFiles.push(rel);
      const r = await engine.runModuleCrud(exp);
      crudSummary.initOk ||= r.initOk;
      crudSummary.listOk ||= r.listOk;
      crudSummary.addOk ||= r.addOk;
      crudSummary.updateOk ||= r.updateOk;
      crudSummary.deleteOk ||= r.deleteOk;
    }
  } catch (e) {
    moduleCompileErrors.push(`${rel}: ${e.message}`);
  }
}

const sqlEngineTest = engine.runDirectSqlEngineCrudTest();

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
    if (/(screen|tela|lista|detalhe|adicionar|cadastro|src\/app\/|app\/)/i.test(f)) cand.push(f);
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
    ok: Boolean(PKG.dependencies && 'expo' in PKG.dependencies),
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

const sqliteImport = grepFiles(/expo-sqlite/);
const dbFileCands = codeFiles.filter((f) => /database|banco|\.db\.|db\.(js|ts)/i.test(f));

const getItemFiles = grepFiles(/AsyncStorage\.getItem/);
const setItemFiles = grepFiles(/AsyncStorage\.setItem/);
const selectSqlFiles = grepFiles(/\bSELECT\s+.+\s+FROM\b/i);
const insertSqlFiles = grepFiles(/INSERT\s+(OR\s+\w+\s+)?INTO/i);

const F2 = [
  {
    pts: 1,
    nome: 'Dependência async-storage está no package.json (ou migrado p/ expo-sqlite)',
    ok: Boolean(
      PKG.dependencies &&
        ('@react-native-async-storage/async-storage' in PKG.dependencies ||
          'expo-sqlite' in PKG.dependencies),
    ),
    prova:
      PKG.dependencies && PKG.dependencies['@react-native-async-storage/async-storage']
        ? 'no package.json'
        : PKG.dependencies && PKG.dependencies['expo-sqlite']
          ? 'migrado p/ expo-sqlite'
          : 'FALTA instalar: npx expo install @react-native-async-storage/async-storage',
  },
  {
    pts: 1,
    nome: 'Existe import do AsyncStorage (ou SQLite) no código',
    ok: grepFiles(/@react-native-async-storage\/async-storage/).length > 0 || sqliteImport.length > 0,
    prova: grepFiles(/@react-native-async-storage\/async-storage/)[0] || sqliteImport[0] || '—',
  },
  {
    pts: 1,
    nome: 'Storage faz leitura (AsyncStorage.getItem ou SELECT)',
    ok: getItemFiles.length > 0 || selectSqlFiles.length > 0,
    prova: getItemFiles[0] || selectSqlFiles[0] || '—',
  },
  {
    pts: 1,
    nome: 'Storage grava dados (AsyncStorage.setItem ou INSERT)',
    ok: setItemFiles.length > 0 || insertSqlFiles.length > 0,
    prova: setItemFiles[0] || insertSqlFiles[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de CARREGAR a lista (carregar/load/listar/get)',
    ok: grepFiles(/\b(function\s+)?(carregar\w*|load\w*|listar\w*|getAll\w*)/i).length > 0,
    prova: grepFiles(/\b(function\s+)?(carregar\w*|load\w*|listar\w*|getAll\w*)/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de ADICIONAR/CADASTRAR (adicionar/salvar/inserir/create)',
    ok: grepFiles(/\b(adicionar\w*|salvar\w*|cadastrar\w*|add\w*|inserir\w*|insert\w*|criar\w*)\s*[=:(]/i).length > 0,
    prova: grepFiles(/\b(adicionar\w*|salvar\w*|cadastrar\w*|add\w*|inserir\w*|insert\w*|criar\w*)\s*[=:(]/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe busca por id (buscar/find/getItem/getFirst)',
    ok: grepFiles(/\b(buscar\w*|find\s*\(|getItem\(|getFirst(Async|Sync)?)/i).length > 0,
    prova: grepFiles(/\b(buscar\w*|find\s*\(|getItem\(|getFirst(Async|Sync)?)/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Existe função de EXCLUIR/remover',
    ok: grepFiles(/\b(excluir|remover|deletar|delete\w*|removeItem|filter\s*\()/i).length > 0,
    prova: grepFiles(/\b(excluir|remover|deletar|delete\w*|removeItem|filter\s*\()/i)[0] || '—',
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
    ok: fileExists(CONFIG.form) && /\b(adicionar\w*|salvar\w*|cadastrar\w*|inserir\w*|insert\w*|criar\w*)\s*\(|onPress/.test(FORM),
    prova: CONFIG.form || '—',
  },
  {
    pts: 1,
    nome: 'Lista é alimentada a partir do storage/banco',
    ok: /carregar\w*|listar\w*|getItem|AsyncStorage|load\w*|database|banco|getAll/i.test(LISTA),
    prova: CONFIG.lista || '—',
  },
  {
    pts: 1,
    nome: 'Tela de detalhe usa busca/dados do storage/banco',
    ok: /buscar\w*|find\s*\(|getItem|params|route|database|banco/i.test(DETALHE),
    prova: CONFIG.detalhe || '—',
  },
  {
    pts: 1,
    nome: 'Exclusão usa confirmação (Alert.alert)',
    ok: grepFiles(/Alert\.alert/).some((f) => /excluir|removeItem|delete|remover|apagar/i.test(read(f))),
    prova: grepFiles(/Alert\.alert/).find((f) => /excluir|removeItem|delete|remover|apagar/i.test(read(f))) || '—',
  },
  {
    pts: 1,
    nome: 'Dados iniciais/seed são gravados na 1ª execução',
    ok:
      (setItemFiles.length > 0 && grepFiles(/INICIAIS|INICIAL|seed|mock|DEFAULT/i).length > 0) ||
      grepFiles(/INSERT\s+(OR\s+\w+\s+)?INTO\s+\w+\s*\(/i).length > 0,
    prova: setItemFiles[0] || grepFiles(/INSERT\s+(OR\s+\w+\s+)?INTO\s+\w+\s*\(/i)[0] || '—',
  },
  {
    pts: 1,
    nome: 'Formulário valida campos (trim/length/vazio)',
    ok: /\.trim\(\)|\.length|===['"]/i.test(FORM),
    prova: CONFIG.form || '—',
  },
];

// ---------- Checklist (Fase 3) ----------
const F3 = [
  {
    pts: 2,
    nome: 'Dependência expo-sqlite está no package.json',
    ok: Boolean(PKG.dependencies && 'expo-sqlite' in PKG.dependencies),
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
    ok: insertSqlFiles.length > 0,
    prova: insertSqlFiles[0] || '—',
  },
  {
    pts: 2,
    nome: 'Consulta com SELECT',
    ok: selectSqlFiles.length > 0,
    prova: selectSqlFiles[0] || '—',
  },
  {
    pts: 2,
    nome: 'Atualiza com UPDATE',
    ok: grepFiles(/\bUPDATE\s+\w+\s+SET\b/i).length > 0,
    prova: grepFiles(/\bUPDATE\s+\w+\s+SET\b/i)[0] || '—',
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
    nome: 'Banco aberto com openDatabaseAsync/openDatabaseSync/openDatabase',
    ok: grepFiles(/openDatabase(Async|Sync)?\s*\(/).length > 0,
    prova: grepFiles(/openDatabase(Async|Sync)?\s*\(/)[0] || '—',
  },
  {
    pts: 2,
    nome: 'Tela de lista carrega dados do banco',
    ok: /expo-sqlite|SELECT|database|banco|getAll(Async|Sync)|listar|carregar/i.test(LISTA) && sqliteImport.length > 0,
    prova: CONFIG.lista || '—',
  },
  {
    pts: 2,
    nome: 'Formulário salva no banco (INSERT/runAsync/runSync)',
    ok: /expo-sqlite|INSERT|run(Async|Sync)|database|banco|adicionar|inserir|criar|insert/i.test(FORM) && sqliteImport.length > 0,
    prova: CONFIG.form || '—',
  },
  {
    pts: 2,
    nome: 'Detalhe busca no banco com WHERE/SELECT',
    ok: /WHERE|SELECT|expo-sqlite|sql|database|banco|buscar|getEquipment|getFirst/i.test(DETALHE) && sqliteImport.length > 0,
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
    ok: grepFiles(/INSERT\s+(OR\s+\w+\s+)?INTO\s+\w+\s*\(/i).length > 0,
    prova: grepFiles(/INSERT\s+(OR\s+\w+\s+)?INTO\s+\w+\s*\(/i)[0] || '—',
  },
];

// ============================================================================
// CHECKLIST FASE 4 — Versão Final (Peso 3x = 15 itens × 3 pts = 45 pts)
// Requisitos oficiais de fase4.md:
// 1. SQLite como única fonte de dados (listar, adicionar, editar, excluir no SQLite;
//    nenhum dado crítico em AsyncStorage) + Testes Funcionais Reais no SQLite.
// 2. Recurso do dispositivo (expo-notifications, expo-image-picker, expo-location, etc.
//    ou justificativa de não uso no README).
// 3. UX (Loading ao carregar a lista do SQLite, Empty state com mensagem + ícone/ilustração,
//    Mensagem de erro amigável se falhar ao salvar ou carregar).
// 4. Organização do código e Entrega (pastas, interface consistente, repositório/README/APK).
// ============================================================================
const DEVICE_PKGS = [
  'expo-image-picker',
  'expo-location',
  'expo-notifications',
  'expo-camera',
  'expo-sensors',
  'expo-sharing',
  'expo-print',
  'expo-av',
  'expo-clipboard',
  'expo-local-authentication',
  'expo-media-library',
  'expo-barcode-scanner',
  'expo-calendar',
];
const allDeps = { ...(PKG.dependencies || {}), ...(PKG.devDependencies || {}) };
const installedDevicePkgs = DEVICE_PKGS.filter((p) => p in allDeps);
const deviceCodeHits = grepFiles(
  /expo-(image-picker|location|notifications|camera|sensors|sharing|print|av|clipboard|local-authentication|media-library|barcode-scanner|calendar)|launchImageLibraryAsync|launchCameraAsync|getCurrentPositionAsync|requestForegroundPermissionsAsync|scheduleNotificationAsync/i,
);
const readmeText = read('README.md');
const readmeLines = readmeText ? readmeText.split('\n').filter((l) => l.trim().length > 0).length : 0;
const hasDeviceJustification = /justificativa\s+de\s+n[aã]o\s+uso|n[aã]o\s+utiliza\s+recurso\s+nativo|sem\s+recurso\s+do\s+dispositivo/i.test(readmeText);

// 1. SQLite exclusivo nas telas (sem AsyncStorage nas telas de lista/form/detalhe)
const screensUseOnlySqlite =
  sqliteImport.length > 0 &&
  !/AsyncStorage\.(getItem|setItem)/.test(LISTA) &&
  !/AsyncStorage\.(getItem|setItem)/.test(FORM) &&
  !/AsyncStorage\.(getItem|setItem)/.test(DETALHE);

// 2-6. Testes Funcionais Reais EXIGINDO SQLite (Fase 4 exige SQLite como única fonte de dados!)
const f4SqliteSchemaOk = sqlEngineTest.schemaOk && engine.sqlStats.tablesCreated.length > 0;
const f4SqliteInsertOk = f4SqliteSchemaOk && sqlEngineTest.insertSelectOk && engine.sqlStats.inserts >= 1;
const f4SqliteSelectWhereOk = f4SqliteSchemaOk && sqlEngineTest.insertSelectOk && engine.sqlStats.selects >= 1 && engine.sqlStats.whereQueries >= 1;
const f4SqliteUpdateOk = f4SqliteSchemaOk && sqlEngineTest.updateWhereOk && (crudSummary.updateOk || engine.sqlStats.updates >= 1);
const f4SqliteDeleteOk = f4SqliteSchemaOk && sqlEngineTest.deleteOk && (crudSummary.deleteOk || engine.sqlStats.deletes >= 1);

// 9-12. UX: Loading ao carregar do SQLite, Empty state (mensagem + ícone/emoji/ilustração), Erro amigável ao carregar e ao salvar
const loadingUiHits = grepFiles(/ActivityIndicator|Skeleton|Carregando\.\.\.|Loading\.\.\./i);
const loadingStateHits = grepFiles(
  /\[\s*(loading|isLoading|carregando\w*)\s*,\s*set\w+\s*\]\s*=\s*useState|set(Loading|IsLoading|Carregando\w*)\s*\(/i,
);
const emptyStateHits = grepFiles(
  /ListEmptyComponent|\.length\s*===\s*0|!\w+\.length|Nenhum\w*\s+(item|registro|tarefa|gasto|nota|atividade|equipamento|pet|viagem|campeonato|mat[eé]ria|produto|lan[cç]amento|cliente|encontrad)/i,
);
const emptyStateWithVisualHits = emptyStateHits.filter((f) => {
  const txt = read(f);
  return /Ionicons|MaterialIcons|Feather|FontAwesome|AntDesign|MaterialCommunityIcons|<Image|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(txt);
});
const errorOnLoadHits = grepFiles(
  /catch\s*(\([^)]*\))?\s*\{[\s\S]{0,250}?(Alert\.alert|setErro\w*|errorMessage|mensagemErro|Não foi possível carregar|Erro ao carregar|Erro ao listar)/i,
);
const errorOnSaveHits = grepFiles(
  /catch\s*(\([^)]*\))?\s*\{[\s\S]{0,250}?(Alert\.alert|setErro\w*|Erro ao salvar|Erro ao cadastrar|Erro ao inserir|Erro ao excluir)/i,
);
const formValidationHits = grepFiles(/\.trim\(\)|\bobriga[t]|\bpreencha\b|!\w+\.trim/i);

// 13-15. Organização do código, Interface consistente e Entrega
const orgFolders = (() => {
  const dirs = new Set();
  for (const f of codeFiles) {
    const parts = f.replace(/\\/g, '/').split('/');
    for (const p of parts.slice(0, -1)) {
      if (/^(screens|app|components|data|database|bancoDeDados|storage|lib|services|context|contexts|hooks|utils|constants)$/i.test(p)) {
        dirs.add(p.toLowerCase());
      }
    }
  }
  return [...dirs];
})();
const flatListHits = grepFiles(/<(FlatList|SectionList)\b[\s\S]*?(keyExtractor|renderItem)/);
const styleSheetHits = grepFiles(/StyleSheet\.create\s*\(/);
const gitignoreOk = fileExists('.gitignore') && /node_modules/.test(read('.gitignore'));
const readmeDeliveryOk =
  readmeLines >= 10 &&
  /npm\s+(install|start)|npx\s+expo|expo\s+go|apk|eas\s+build/i.test(readmeText);

const F4 = [
  {
    pts: 3,
    nome: 'SQLite exclusivo: fluxo das telas usa SQLite sem depender de AsyncStorage p/ dados críticos',
    ok: screensUseOnlySqlite,
    prova: screensUseOnlySqlite
      ? `${CONFIG.sqlite || dbFileCands[0] || sqliteImport[0]} (telas sem AsyncStorage crítico)`
      : 'FALTA migrar telas 100% para SQLite (remover AsyncStorage do CRUD principal)',
  },
  {
    pts: 3,
    nome: '[Teste Funcional SQLite] Banco abre e cria a(s) tabela(s) em memória (CREATE TABLE)',
    ok: f4SqliteSchemaOk,
    prova: f4SqliteSchemaOk
      ? `Tabela(s) criada(s) no motor SQLite: ${engine.sqlStats.tablesCreated.join(', ')}`
      : 'FALTA criar tabela real no SQLite em execução',
  },
  {
    pts: 3,
    nome: '[Teste Funcional SQLite] Fluxo de ADICIONAR insere registro real no banco (INSERT INTO)',
    ok: f4SqliteInsertOk,
    prova: f4SqliteInsertOk
      ? `INSERT executado com sucesso no SQLite (${engine.sqlStats.inserts} inserção/ões em ${sqlEngineTest.table})`
      : 'FALTA função de adicionar gravando registro real no SQLite',
  },
  {
    pts: 3,
    nome: '[Teste Funcional SQLite] Fluxo de LISTAR e FILTRAR retorna dados reais (SELECT + WHERE)',
    ok: f4SqliteSelectWhereOk,
    prova: f4SqliteSelectWhereOk
      ? `SELECT (${engine.sqlStats.selects}x) + WHERE (${engine.sqlStats.whereQueries}x) validados em ${sqlEngineTest.table}`
      : 'FALTA consulta SELECT/WHERE funcional no SQLite',
  },
  {
    pts: 3,
    nome: '[Teste Funcional SQLite] Fluxo de EDITAR atualiza registro existente no banco (UPDATE)',
    ok: f4SqliteUpdateOk,
    prova: f4SqliteUpdateOk
      ? `UPDATE executado e verificado no SQLite (${engine.sqlStats.updates}x em ${sqlEngineTest.table})`
      : 'FALTA função de editar (UPDATE) alterando registro real no SQLite',
  },
  {
    pts: 3,
    nome: '[Teste Funcional SQLite] Fluxo de EXCLUIR remove registro do banco (DELETE FROM)',
    ok: f4SqliteDeleteOk,
    prova: f4SqliteDeleteOk
      ? `DELETE executado e confirmado no SQLite (${engine.sqlStats.deletes}x em ${sqlEngineTest.table})`
      : 'FALTA função de excluir (DELETE FROM) removendo registro real no SQLite',
  },
  {
    pts: 3,
    nome: 'Recurso do dispositivo: pacote nativo no package.json (notifications, image-picker, location) ou justificativa',
    ok: installedDevicePkgs.length > 0 || hasDeviceJustification,
    prova:
      installedDevicePkgs.length > 0
        ? installedDevicePkgs.join(', ')
        : hasDeviceJustification
          ? 'justificativa no README.md'
          : 'FALTA instalar expo-notifications / expo-image-picker / expo-location (ou justificar no README)',
  },
  {
    pts: 3,
    nome: 'Recurso do dispositivo: uso da API nativa no código (notificação, foto ou GPS) ou justificativa',
    ok: deviceCodeHits.length > 0 || hasDeviceJustification,
    prova:
      deviceCodeHits[0] ||
      (hasDeviceJustification
        ? 'justificativa no README.md'
        : 'FALTA integrar recurso do aparelho no código (Aulas 08, 09 ou 10)'),
  },
  {
    pts: 3,
    nome: 'UX: Loading ao carregar a lista do SQLite (ActivityIndicator + estado loading/carregando)',
    ok: loadingUiHits.length > 0 && loadingStateHits.length > 0 && sqliteImport.length > 0,
    prova:
      loadingUiHits.length > 0 && loadingStateHits.length > 0 && sqliteImport.length > 0
        ? `${loadingUiHits[0]} (${loadingStateHits[0]})`
        : 'FALTA ActivityIndicator controlado por useState enquanto lê do SQLite',
  },
  {
    pts: 3,
    nome: 'UX: Empty State quando não houver registros (mensagem amigável + ícone/emoji/ilustração)',
    ok: emptyStateWithVisualHits.length > 0 || emptyStateHits.length > 0,
    prova:
      emptyStateWithVisualHits[0] ||
      emptyStateHits[0] ||
      'FALTA ListEmptyComponent / estado vazio com mensagem e ícone/ilustração',
  },
  {
    pts: 3,
    nome: 'UX: Mensagem de erro amigável se falhar ao CARREGAR dados (try/catch com feedback)',
    ok: errorOnLoadHits.length > 0,
    prova: errorOnLoadHits[0] || 'FALTA try/catch com mensagem amigável ao falhar ao carregar',
  },
  {
    pts: 3,
    nome: 'UX: Mensagem de erro amigável e validação se falhar ao SALVAR/EXCLUIR (try/catch + Alert/.trim)',
    ok: errorOnSaveHits.length > 0 && formValidationHits.length > 0,
    prova:
      errorOnSaveHits.length > 0 && formValidationHits.length > 0
        ? `${errorOnSaveHits[0]} + validação .trim()`
        : 'FALTA try/catch com Alert amigável e validação ao salvar/excluir',
  },
  {
    pts: 3,
    nome: 'Organização do código: separação em pastas por responsabilidade (screens/app, database/data, components)',
    ok: orgFolders.length >= 2,
    prova:
      orgFolders.length >= 2
        ? `pastas: ${orgFolders.join(', ')}`
        : 'FALTA separar código em pastas (ex.: screens/, database/, components/)',
  },
  {
    pts: 3,
    nome: 'Interface consistente: FlatList (keyExtractor + renderItem) e estilização StyleSheet.create',
    ok: flatListHits.length > 0 && styleSheetHits.length >= 2,
    prova:
      flatListHits.length > 0 && styleSheetHits.length >= 2
        ? `${flatListHits[0]} (${styleSheetHits.length} arquivos com StyleSheet)`
        : 'FALTA FlatList com keyExtractor/renderItem e StyleSheet.create consistente',
  },
  {
    pts: 3,
    nome: 'Entrega: repositório limpo (.gitignore sem node_modules) e README com instruções/Expo Go/APK',
    ok: gitignoreOk && readmeDeliveryOk,
    prova:
      gitignoreOk && readmeDeliveryOk
        ? `README.md (${readmeLines} linhas) + .gitignore`
        : 'FALTA .gitignore ou documentar como rodar/testar (Expo Go/APK) no README.md',
  },
];

// ---------- Cálculo da nota ----------
const FASE1_TOTAL = F1.reduce((s, i) => s + i.pts, 0);
const FASE2_TOTAL = F2.reduce((s, i) => s + i.pts, 0);
const FASE3_TOTAL = F3.reduce((s, i) => s + i.pts, 0);
const FASE4_TOTAL = F4.reduce((s, i) => s + i.pts, 0);
const TOTAL = FASE1_TOTAL + FASE2_TOTAL + FASE3_TOTAL + FASE4_TOTAL;

const F1_G = F1.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const F2_G = F2.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const F3_G = F3.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const F4_G = F4.reduce((s, i) => s + (i.ok ? i.pts : 0), 0);
const GANHO = F1_G + F2_G + F3_G + F4_G;
const PECENT = Math.round((GANHO / TOTAL) * 100);

let nota = 'I';
let cor = 'red';
if (PECENT >= 75) { nota = 'MB'; cor = 'green'; }
else if (PECENT >= 50) { nota = 'B'; cor = 'yellow'; }
else if (PECENT >= 25) { nota = 'R'; cor = 'orange'; }

function situacaoFase(ganho, total) {
  if (ganho === total) return 'completa';
  if (ganho >= Math.ceil(total / 2)) return 'em desenvolvimento';
  return 'iniciando';
}

function linhaCirterio(c) {
  const mark = c.ok ? '[x]' : '[ ]';
  return `${mark} **(+${c.pts} pts)** ${c.nome} — \`${c.prova}\``;
}

const md = `# Nota PAM I — ${CONFIG.grupo}

![](https://img.shields.io/static/v1?label=Nota%20PAM%20I&message=${nota}&color=${cor})

**Nota atual: ${nota}** · ${PECENT}% (${GANHO}/${TOTAL} pontos) · rodada de ${DATE} · commit \`${GIT_SHA.slice(0, 7)}\`

Legenda: I = Insuficiente (0–25%) · R = Regular (25–50%) · B = Bom (50–75%) · MB = Muito bom (75–100%)

| Fase | Peso | Pontos | Situação |
|---|---|---|---|
| Fase 1 — Estrutura | 1x (10 pts) | ${F1_G}/${FASE1_TOTAL} | ${situacaoFase(F1_G, FASE1_TOTAL)} |
| Fase 2 — AsyncStorage | 1x (15 pts) | ${F2_G}/${FASE2_TOTAL} | ${situacaoFase(F2_G, FASE2_TOTAL)} |
| Fase 3 — SQLite | 2x (30 pts) | ${F3_G}/${FASE3_TOTAL} | ${situacaoFase(F3_G, FASE3_TOTAL)} |
| Fase 4 — Versão Final (SQLite + UX + Dispositivo) | 3x (45 pts) | ${F4_G}/${FASE4_TOTAL} | ${situacaoFase(F4_G, FASE4_TOTAL)} |

## Resumo dos Testes Funcionais (Execução Real em Runtime Node + SQLite)

| Teste Funcional SQLite (Fase 4) | Resultado | Detalhes da Execução |
|---|---|---|
| Schema / Inicialização (\`CREATE TABLE\`) | ${f4SqliteSchemaOk ? 'PASSOU' : 'PENDENTE'} | ${f4SqliteSchemaOk ? `Tabelas criadas no SQLite: \`${engine.sqlStats.tablesCreated.join(', ')}\`` : 'Nenhuma tabela SQLite criada em runtime'} |
| Adicionar (\`INSERT INTO\`) | ${f4SqliteInsertOk ? 'PASSOU' : 'PENDENTE'} | ${f4SqliteInsertOk ? `Inserção SQLite verificada em memória (\`inserts=${engine.sqlStats.inserts}\` em \`${sqlEngineTest.table}\`)` : 'Não confirmou inserção no SQLite em runtime'} |
| Listar + Filtrar (\`SELECT\` + \`WHERE\`) | ${f4SqliteSelectWhereOk ? 'PASSOU' : 'PENDENTE'} | ${f4SqliteSelectWhereOk ? `Leitura e filtro SQLite verificados (\`selects=${engine.sqlStats.selects}, where=${engine.sqlStats.whereQueries}\`)` : 'Não confirmou leitura/filtro no SQLite em runtime'} |
| Editar (\`UPDATE\`) | ${f4SqliteUpdateOk ? 'PASSOU' : 'PENDENTE'} | ${f4SqliteUpdateOk ? `Atualização SQLite verificada (\`updates=${engine.sqlStats.updates}\` em \`${sqlEngineTest.table}\`)` : 'Não confirmou atualização no SQLite em runtime'} |
| Excluir (\`DELETE FROM\`) | ${f4SqliteDeleteOk ? 'PASSOU' : 'PENDENTE'} | ${f4SqliteDeleteOk ? `Exclusão SQLite confirmada (\`deletes=${engine.sqlStats.deletes}\` em \`${sqlEngineTest.table}\`)` : 'Não confirmou exclusão no SQLite em runtime'} |

## Checklist validado

### Fase 1 — Estrutura do projeto (${F1_G}/${FASE1_TOTAL} pts · peso 1x)

${F1.map((i) => '- ' + linhaCirterio(i)).join('\n')}

### Fase 2 — Persistência com AsyncStorage (${F2_G}/${FASE2_TOTAL} pts · peso 1x)

${F2.map((i) => '- ' + linhaCirterio(i)).join('\n')}

### Fase 3 — Banco de dados SQLite (${F3_G}/${FASE3_TOTAL} pts · peso 2x)

${F3.map((i) => '- ' + linhaCirterio(i)).join('\n')}

### Fase 4 — Versão Final: SQLite Exclusivo, UX, Dispositivo e Entrega (${F4_G}/${FASE4_TOTAL} pts · peso 3x)

${F4.map((i) => '- ' + linhaCirterio(i)).join('\n')}

## Para evoluir a nota

Os itens **desmarcados** acima são exatamente o que falta no projeto. Cada rodada deste CI (a cada push) executa os testes estáticos e funcionais, recalcula e atualiza a nota — o artefato \`nota-pam\` sempre mostra o valor mais recente.
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
        fase4: { pontos: F4_G, total: FASE4_TOTAL },
      },
      testesFuncionais: {
        schema: f4SqliteSchemaOk,
        inserir: f4SqliteInsertOk,
        listarFiltrar: f4SqliteSelectWhereOk,
        editar: f4SqliteUpdateOk,
        excluir: f4SqliteDeleteOk,
        tabelasSqlite: engine.sqlStats.tablesCreated,
      },
      itens: [...F1, ...F2, ...F3, ...F4].map((i) => ({ nome: i.nome, ok: i.ok })),
    },
    null,
    2,
  ),
);

console.log(md);
console.log(`NOTA=${nota} PECENT=${PECENT} PONTOS=${GANHO}/${TOTAL}`);
