> Este arquivo e **gerado automaticamente** pelo CI a cada push na branch `main`.
> Nao edite a mao: o proximo commit do CI sobrescreve. Para ver a rodada no Actions:
> https://github.com/ORG/REPO/actions/workflows/pam-ci.yml

## Nota PAM I — 3GD (estoque de materiais de construção)

![](https://img.shields.io/static/v1?label=Nota%20PAM%20I&message=R&color=orange)

**Nota atual: R** · 40% (40/100 pontos) · rodada de 2026-11-10 01:28:18 · commit `local`

Legenda: I = Insuficiente (0–25%) · R = Regular (25–50%) · B = Bom (50–75%) · MB = Muito bom (75–100%)

| Fase | Peso | Pontos | Situação |
|---|---|---|---|
| Fase 1 — Estrutura | 1x (10 pts) | 9/10 | em desenvolvimento |
| Fase 2 — AsyncStorage | 1x (15 pts) | 11/15 | em desenvolvimento |
| Fase 3 — SQLite | 2x (30 pts) | 2/30 | iniciando |
| Fase 4 — Versão Final (SQLite + UX + Dispositivo) | 3x (45 pts) | 18/45 | iniciando |

## Resumo dos Testes Funcionais (Execução Real em Runtime Node + SQLite)

| Teste Funcional SQLite (Fase 4) | Resultado | Detalhes da Execução |
|---|---|---|
| Schema / Inicialização (`CREATE TABLE`) | PENDENTE | Nenhuma tabela SQLite criada em runtime |
| Adicionar (`INSERT INTO`) | PENDENTE | Não confirmou inserção no SQLite em runtime |
| Listar + Filtrar (`SELECT` + `WHERE`) | PENDENTE | Não confirmou leitura/filtro no SQLite em runtime |
| Editar (`UPDATE`) | PENDENTE | Não confirmou atualização no SQLite em runtime |
| Excluir (`DELETE FROM`) | PENDENTE | Não confirmou exclusão no SQLite em runtime |

## Checklist validado

### Fase 1 — Estrutura do projeto (9/10 pts · peso 1x)

- [x] **(+1 pts)** README.md existe e fala do projeto/grupo — `README.md`
- [x] **(+1 pts)** Arquivo principal do app existe (App.js) — `App.js`
- [x] **(+1 pts)** package.json existe com a dependência "expo" — `expo ~52.0.37`
- [x] **(+1 pts)** Existe tela de LISTAGEM — `screens/ListaScreen.js`
- [x] **(+1 pts)** Existem dados iniciais (seed) em arquivo de dados — `data/mockData.js`
- [ ] **(+1 pts)** Existe tela de FORMULÁRIO — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Existe tela de DETALHE — `screens/DetalheScreen.js`
- [x] **(+1 pts)** Dependências importadas existem no package.json (app não quebra ao abrir) — `todos os imports resolvem`
- [x] **(+1 pts)** app.json identifica o app (name/slug preenchidos) — `app.json`
- [x] **(+1 pts)** Projeto tem pelo menos 2 arquivos de tela/código — `4 arquivos de tela`

### Fase 2 — Persistência com AsyncStorage (11/15 pts · peso 1x)

- [x] **(+1 pts)** Dependência async-storage está no package.json (ou migrado p/ expo-sqlite) — `no package.json`
- [x] **(+1 pts)** Existe import do AsyncStorage (ou SQLite) no código — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Storage faz leitura (AsyncStorage.getItem ou SELECT) — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Storage grava dados (AsyncStorage.setItem ou INSERT) — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Existe função de CARREGAR a lista (carregar/load/listar/get) — `index.js`
- [x] **(+1 pts)** Existe função de ADICIONAR/CADASTRAR (adicionar/salvar/inserir/create) — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Existe busca por id (buscar/find/getItem/getFirst) — `screens/CadastroScreen.js`
- [x] **(+1 pts)** Existe função de EXCLUIR/remover — `screens/ListaScreen.js`
- [ ] **(+1 pts)** Formulário lê entradas com TextInput — `—`
- [ ] **(+1 pts)** Formulário salva chamando adicionar/salvar — `—`
- [x] **(+1 pts)** Lista é alimentada a partir do storage/banco — `screens/ListaScreen.js`
- [x] **(+1 pts)** Tela de detalhe usa busca/dados do storage/banco — `screens/DetalheScreen.js`
- [ ] **(+1 pts)** Exclusão usa confirmação (Alert.alert) — `—`
- [x] **(+1 pts)** Dados iniciais/seed são gravados na 1ª execução — `screens/CadastroScreen.js`
- [ ] **(+1 pts)** Formulário valida campos (trim/length/vazio) — `—`

### Fase 3 — Banco de dados SQLite (2/30 pts · peso 2x)

- [ ] **(+2 pts)** Dependência expo-sqlite está no package.json — `FALTA instalar: npx expo install expo-sqlite`
- [ ] **(+2 pts)** Existe import do expo-sqlite — `—`
- [ ] **(+2 pts)** Existe arquivo de banco de dados — `—`
- [ ] **(+2 pts)** Cria a tabela com CREATE TABLE IF NOT EXISTS — `—`
- [ ] **(+2 pts)** Insere dados com INSERT INTO — `—`
- [ ] **(+2 pts)** Consulta com SELECT — `—`
- [ ] **(+2 pts)** Atualiza com UPDATE — `—`
- [ ] **(+2 pts)** Exclui com DELETE FROM — `—`
- [ ] **(+2 pts)** Usa filtros com WHERE — `—`
- [ ] **(+2 pts)** Banco aberto com openDatabaseAsync/openDatabaseSync/openDatabase — `—`
- [ ] **(+2 pts)** Tela de lista carrega dados do banco — `screens/ListaScreen.js`
- [ ] **(+2 pts)** Formulário salva no banco (INSERT/runAsync/runSync) — `—`
- [ ] **(+2 pts)** Detalhe busca no banco com WHERE/SELECT — `screens/DetalheScreen.js`
- [x] **(+2 pts)** Usa async/await corretamente (mais de 2 await) — `screens/CadastroScreen.js`
- [ ] **(+2 pts)** Banco possui dados iniciais (seed inserido em SQL) — `—`

### Fase 4 — Versão Final: SQLite Exclusivo, UX, Dispositivo e Entrega (18/45 pts · peso 3x)

- [ ] **(+3 pts)** SQLite exclusivo: fluxo das telas usa SQLite sem depender de AsyncStorage p/ dados críticos — `FALTA migrar telas 100% para SQLite (remover AsyncStorage do CRUD principal)`
- [ ] **(+3 pts)** [Teste Funcional SQLite] Banco abre e cria a(s) tabela(s) em memória (CREATE TABLE) — `FALTA criar tabela real no SQLite em execução`
- [ ] **(+3 pts)** [Teste Funcional SQLite] Fluxo de ADICIONAR insere registro real no banco (INSERT INTO) — `FALTA função de adicionar gravando registro real no SQLite`
- [ ] **(+3 pts)** [Teste Funcional SQLite] Fluxo de LISTAR e FILTRAR retorna dados reais (SELECT + WHERE) — `FALTA consulta SELECT/WHERE funcional no SQLite`
- [ ] **(+3 pts)** [Teste Funcional SQLite] Fluxo de EDITAR atualiza registro existente no banco (UPDATE) — `FALTA função de editar (UPDATE) alterando registro real no SQLite`
- [ ] **(+3 pts)** [Teste Funcional SQLite] Fluxo de EXCLUIR remove registro do banco (DELETE FROM) — `FALTA função de excluir (DELETE FROM) removendo registro real no SQLite`
- [ ] **(+3 pts)** Recurso do dispositivo: pacote nativo no package.json (notifications, image-picker, location) ou justificativa — `FALTA instalar expo-notifications / expo-image-picker / expo-location (ou justificar no README)`
- [ ] **(+3 pts)** Recurso do dispositivo: uso da API nativa no código (notificação, foto ou GPS) ou justificativa — `FALTA integrar recurso do aparelho no código (Aulas 08, 09 ou 10)`
- [ ] **(+3 pts)** UX: Loading ao carregar a lista do SQLite (ActivityIndicator + estado loading/carregando) — `FALTA ActivityIndicator controlado por useState enquanto lê do SQLite`
- [x] **(+3 pts)** UX: Empty State quando não houver registros (mensagem amigável + ícone/emoji/ilustração) — `screens/ListaScreen.js`
- [x] **(+3 pts)** UX: Mensagem de erro amigável se falhar ao CARREGAR dados (try/catch com feedback) — `screens/DetalheScreen.js`
- [x] **(+3 pts)** UX: Mensagem de erro amigável e validação se falhar ao SALVAR/EXCLUIR (try/catch + Alert/.trim) — `screens/CadastroScreen.js + validação .trim()`
- [x] **(+3 pts)** Organização do código: separação em pastas por responsabilidade (screens/app, database/data, components) — `pastas: components, data, screens, utils`
- [x] **(+3 pts)** Interface consistente: FlatList (keyExtractor + renderItem) e estilização StyleSheet.create — `screens/ListaScreen.js (8 arquivos com StyleSheet)`
- [x] **(+3 pts)** Entrega: repositório limpo (.gitignore sem node_modules) e README com instruções/Expo Go/APK — `README.md (106 linhas) + .gitignore`

## Para evoluir a nota

Os itens **desmarcados** acima são exatamente o que falta no projeto. Cada rodada deste CI (a cada push) executa os testes estáticos e funcionais, recalcula e atualiza a nota — o artefato `nota-pam` sempre mostra o valor mais recente.
