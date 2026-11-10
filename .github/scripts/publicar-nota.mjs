// PAM I - Publica a nota atual dentro do repositorio, de forma visivel.
// Gera o bloco "Nota atual" no README.md (entre marcadores) e o arquivo NOTA.md
// com o checklist completo. Roda depois que pam-ci.mjs gerou nota.md e nota.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY || 'ORG/REPO';
const INICIO = '<!-- PAM-CI-NOTA-INICIO -->';
const FIM = '<!-- PAM-CI-NOTA-FIM -->';

const CFG = JSON.parse(readFileSync('.github/pam-ci.config.json', 'utf8'));
const NOTA = JSON.parse(readFileSync('nota.json', 'utf8'));

const CORES = { I: 'red', R: 'orange', B: 'yellow', MB: 'green' };
const ROTULOS = {
  I: 'Insuficiente',
  R: 'Regular',
  B: 'Bom',
  MB: 'Muito bom',
};
const cor = CORES[NOTA.nota] || 'lightgrey';
const pct = NOTA.percentual;
const data = NOTA.data.slice(0, 16);

const bloco = [
  INICIO,
  `### Nota atual (automática) — ${CFG.grupo}`,
  '',
  `[![CI](https://github.com/${REPO}/actions/workflows/pam-ci.yml/badge.svg)](https://github.com/${REPO}/actions/workflows/pam-ci.yml) [![Nota](https://img.shields.io/badge/Nota%20PAM%20I-${NOTA.nota}-${cor})](https://github.com/${REPO}/actions/workflows/pam-ci.yml)`,
  '',
  `**${NOTA.nota}** — ${ROTULOS[NOTA.nota]} · **${pct}%** (${NOTA.pontos}/${NOTA.total} pontos) · atualizado em ${data}`,
  '',
  '| Fase | Pontos |',
  '|------|--------|',
  `| Fase 1 — Estrutura | ${NOTA.porFase.fase1.pontos}/${NOTA.porFase.fase1.total} |`,
  `| Fase 2 — AsyncStorage | ${NOTA.porFase.fase2.pontos}/${NOTA.porFase.fase2.total} |`,
  `| Fase 3 — SQLite | ${NOTA.porFase.fase3.pontos}/${NOTA.porFase.fase3.total} |`,
  '',
  `Checklist item a item em [NOTA.md](NOTA.md) · [ver a rodada mais recente no Actions](https://github.com/${REPO}/actions/workflows/pam-ci.yml)`,
  FIM,
].join('\n');

// --- README: substitui o bloco entre marcadores ou insere apos o titulo ---
const README = 'README.md';
if (existsSync(README)) {
  let atual = readFileSync(README, 'utf8');
  const re = new RegExp(
    `${INICIO.replace(/[-[\]{}()*+?.,\\^$|]/g, '\\$&')}[\\s\\S]*?${FIM.replace(/[-[\]{}()*+?.,\\^$|]/g, '\\$&')}`,
  );
  if (re.test(atual)) {
    atual = atual.replace(re, bloco);
  } else {
    const linhas = atual.split('\n');
    let i = linhas.findIndex((l) => /^#\s/.test(l));
    if (i === -1) i = -1;
    linhas.splice(i + 1, 0, '', bloco);
    atual = linhas.join('\n');
  }
  writeFileSync(README, atual);
  console.log('README.md atualizado com o bloco da nota.');
} else {
  console.log('README.md nao encontrado — nada a atualizar.');
}

// --- NOTA.md: checklist completo, sempre acessivel no repo ---
const relatorio = readFileSync('nota.md', 'utf8');
writeFileSync(
  'NOTA.md',
  `> Este arquivo e **gerado automaticamente** pelo CI a cada push na branch \`main\`.\n` +
    `> Nao edite a mao: o proximo commit do CI sobrescreve. Para ver a rodada no Actions:\n` +
    `> https://github.com/${REPO}/actions/workflows/pam-ci.yml\n\n` +
    relatorio.replace(/^#\s/, '## '),
);
console.log('NOTA.md gerado com o checklist completo.');