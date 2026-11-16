// SQLite real no navegador. O arquivo do banco é persistido no IndexedDB.
async function carregarSQLite() {
  if (window.initSqlJs) return window.initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/sql-wasm.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Não foi possível carregar o SQLite.'));
    document.head.appendChild(script);
  });
  return window.initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
}

export async function openDatabaseAsync(nome) {
  const SQL = await carregarSQLite();
  const armazenamento = await new Promise((resolve, reject) => {
    const pedido = indexedDB.open('3gdstock-sqlite', 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore('bancos');
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
  const salvo = await new Promise((resolve, reject) => {
    const pedido = armazenamento.transaction('bancos').objectStore('bancos').get(nome);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
  let db = new SQL.Database(salvo);
  let emTransacao = false;
  const persistir = () => new Promise((resolve, reject) => {
    const transacao = armazenamento.transaction('bancos', 'readwrite');
    transacao.objectStore('bancos').put(db.export(), nome);
    transacao.oncomplete = resolve;
    transacao.onabort = () => reject(transacao.error);
    transacao.onerror = () => reject(transacao.error);
  });
  const consultar = (sql, parametros = []) => {
    const comando = db.prepare(sql);
    try {
      comando.bind(parametros);
      const linhas = [];
      while (comando.step()) linhas.push(comando.getAsObject());
      return linhas;
    } finally {
      comando.free();
    }
  };
  // Em caso de falha ao salvar, restaura também a cópia em memória.
  const gravar = async (operacao) => {
    if (emTransacao) return operacao();
    const anterior = db.export();
    try {
      const resultado = operacao();
      await persistir();
      return resultado;
    } catch (error) {
      db.close();
      db = new SQL.Database(anterior);
      throw error;
    }
  };
  return {
    getAllAsync: async (sql, parametros) => consultar(sql, parametros),
    getFirstAsync: async (sql, parametros) => consultar(sql, parametros)[0] || null,
    execAsync: async (sql) => gravar(() => db.run(sql)),
    runAsync: async (sql, parametros) => gravar(() => {
      db.run(sql, parametros);
      return { changes: db.getRowsModified() };
    }),
    withTransactionAsync: async (tarefa) => {
      const anterior = db.export();
      emTransacao = true;
      db.run('BEGIN');
      try {
        await tarefa();
        db.run('COMMIT');
        await persistir();
      } catch (error) {
        db.close();
        db = new SQL.Database(anterior);
        throw error;
      } finally {
        emTransacao = false;
      }
    },
    closeAsync: async () => { db.close(); armazenamento.close(); },
  };
}
