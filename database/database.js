import * as SQLite from './conexao';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MATERIAIS_INICIAIS } from '../data/mockData';

let banco;

export function numero(valor) {
  if (typeof valor === 'number') return valor;
  const texto = String(valor ?? '').replace(/R\$|\s/g, '');
  return Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto);
}

async function inserir(db, material) {
  return db.runAsync(
    `INSERT INTO materiais (id, nome, codigo, descricao, categoria, estoque,
      estoqueMinimo, unidade, localizacao, fornecedor, precoUnitario, status,
      tipoStatus, detalhes, tipoIcone, criadoEm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [String(material.id), material.nome, material.codigo || '', material.descricao || '',
      material.categoria || '', numero(material.estoque), numero(material.estoqueMinimo),
      material.unidade || 'un', material.localizacao || '', material.fornecedor || '',
      numero(material.precoUnitario), material.status, material.tipoStatus,
      material.detalhes || material.descricao || '', material.tipoIcone || 'cement',
      material.criadoEm || new Date().toISOString()]
  );
}

export async function inicializarBanco() {
  if (banco) return banco;
  const db = await SQLite.openDatabaseAsync('3gdstock.db');
  try {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS materiais (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL DEFAULT '',
      descricao TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL DEFAULT '',
      estoque REAL NOT NULL CHECK (estoque >= 0),
      estoqueMinimo REAL NOT NULL CHECK (estoqueMinimo >= 0),
      unidade TEXT NOT NULL,
      localizacao TEXT NOT NULL DEFAULT '',
      fornecedor TEXT NOT NULL DEFAULT '',
      precoUnitario REAL NOT NULL CHECK (precoUnitario >= 0),
      status TEXT NOT NULL,
      tipoStatus TEXT NOT NULL,
      detalhes TEXT NOT NULL DEFAULT '',
      tipoIcone TEXT NOT NULL DEFAULT 'cement',
      criadoEm TEXT NOT NULL
    );`);
    const versao = await db.getFirstAsync('PRAGMA user_version');
    if (versao.user_version === 0) {
      const salvos = await AsyncStorage.getItem('@materiais');
      const materiais = salvos === null ? MATERIAIS_INICIAIS : JSON.parse(salvos);
      if (!Array.isArray(materiais)) throw new Error('Dados antigos inválidos.');
      // A marcação e a importação são confirmadas juntas: não duplica ao reabrir.
      await db.withTransactionAsync(async () => {
        for (const material of materiais) await inserir(db, material);
        await db.execAsync('PRAGMA user_version = 1');
      });
    }
    banco = db;
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

export async function listarMateriais(busca = '', status = 'Todos', categoria = 'Todas') {
  const db = await inicializarBanco();
  const termo = `%${busca.trim().replace(/[\\%_]/g, '\\$&')}%`;
  return db.getAllAsync(
    `SELECT * FROM materiais
     WHERE (nome LIKE ? ESCAPE '\\' OR codigo LIKE ? ESCAPE '\\'
       OR descricao LIKE ? ESCAPE '\\' OR categoria LIKE ? ESCAPE '\\')
       AND (? = 'Todos' OR status = ?)
       AND (? = 'Todas' OR categoria = ?)
     ORDER BY criadoEm DESC, rowid DESC`,
    [termo, termo, termo, termo, status, status, categoria, categoria]
  );
}

export async function listarCategorias() {
  const db = await inicializarBanco();
  const linhas = await db.getAllAsync("SELECT DISTINCT categoria FROM materiais WHERE categoria <> '' ORDER BY categoria");
  return linhas.map((linha) => linha.categoria);
}

export async function buscarMaterial(id) {
  const db = await inicializarBanco();
  const material = await db.getFirstAsync('SELECT * FROM materiais WHERE id = ?', [String(id)]);
  if (!material) throw new Error('material-not-found');
  return material;
}

export async function criarMaterial(material) {
  const db = await inicializarBanco();
  await inserir(db, material);
}

export async function atualizarStatus(id, status, tipoStatus) {
  const db = await inicializarBanco();
  const resultado = await db.runAsync('UPDATE materiais SET status = ?, tipoStatus = ? WHERE id = ?', [status, tipoStatus, String(id)]);
  if (!resultado.changes) throw new Error('material-not-found');
}

export async function movimentarEstoque(id, quantidade) {
  const db = await inicializarBanco();
  const resultado = await db.runAsync('UPDATE materiais SET estoque = estoque + ? WHERE id = ? AND estoque + ? >= 0', [quantidade, String(id), quantidade]);
  if (!resultado.changes) throw new Error('Saldo insuficiente ou material não encontrado.');
  return buscarMaterial(id);
}

export async function excluirMaterial(id) {
  const db = await inicializarBanco();
  const resultado = await db.runAsync('DELETE FROM materiais WHERE id = ?', [String(id)]);
  if (!resultado.changes) throw new Error('material-not-found');
}
