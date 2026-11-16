const { mkdirSync, copyFileSync } = require('node:fs');
const { resolve } = require('node:path');
const destino = resolve(__dirname, '../public');
mkdirSync(destino, { recursive: true });
for (const arquivo of ['sql-wasm.js', 'sql-wasm.wasm']) {
  copyFileSync(require.resolve(`sql.js/dist/${arquivo}`), resolve(destino, arquivo));
}
