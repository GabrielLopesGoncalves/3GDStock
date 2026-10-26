> Este arquivo e **gerado automaticamente** pelo CI a cada push na branch `main`.
> Nao edite a mao: o proximo commit do CI sobrescreve. Para ver a rodada no Actions:
> https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml

## Nota PAM I — 3GD (estoque de materiais de construção)

![](https://img.shields.io/static/v1?label=Nota%20PAM%20I&message=R&color=orange)

**Nota atual: R** · 40% (22/55 pontos) · rodada de 2026-10-05 23:24:01 · commit `local`

Legenda: I = Insuficiente (0–25%) · R = Regular (25–50%) · B = Bom (50–75%) · MB = Muito bom (75–100%)

| Fase | Pontos | Situação |
|---|---|---|
| Fase 1 — Estrutura | 8/10 | em desenvolvimento |
| Fase 2 — AsyncStorage | 10/15 | em desenvolvimento |
| Fase 3 — SQLite | 4/30 | iniciando |

## Checklist validado

### Fase 1 — Estrutura do projeto (8/10 pts)

- [x] **(+1 pts)** README.md existe e fala do projeto/grupo — `README.md`
- [x] **(+1 pts)** Arquivo principal do app existe (App.js) — `App.js`
- [x] **(+1 pts)** package.json existe com a dependência "expo" — `expo ~52.0.37`
- [x] **(+1 pts)** Existe tela de LISTAGEM — `screens/ListaScreen.js`
- [x] **(+1 pts)** Existem dados iniciais (seed) em arquivo de dados — `data/mockData.js`
- [ ] **(+1 pts)** Existe tela de FORMULÁRIO — `—`
- [x] **(+1 pts)** Existe tela de DETALHE — `screens/DetalheScreen.js`
- [ ] **(+1 pts)** Dependências importadas existem no package.json (app não quebra ao abrir) — `@react-native-async-storage/async-storage`
- [x] **(+1 pts)** app.json identifica o app (name/slug preenchidos) — `app.json`
- [x] **(+1 pts)** Projeto tem pelo menos 2 arquivos de tela/código — `2 arquivos de tela`

### Fase 2 — Persistência com AsyncStorage (10/15 pts)

- [ ] **(+1 pts)** Dependência async-storage está no package.json — `FALTA instalar: npx expo install @react-native-async-storage/async-storage`
- [x] **(+1 pts)** Existe import do AsyncStorage no código — `screens/DetalheScreen.js`
- [x] **(+1 pts)** Storage faz leitura com AsyncStorage.getItem — `screens/DetalheScreen.js`
- [x] **(+1 pts)** Storage grava com AsyncStorage.setItem — `screens/DetalheScreen.js`
- [x] **(+1 pts)** Existe função de CARREGAR a lista (carregar/load) — `index.js`
- [x] **(+1 pts)** Existe função de ADICIONAR/CADASTRAR — `screens/ListaScreen.js`
- [x] **(+1 pts)** Existe busca por id (buscar/find/getItem) — `screens/DetalheScreen.js`
- [x] **(+1 pts)** Existe função de EXCLUIR/remover — `screens/ListaScreen.js`
- [ ] **(+1 pts)** Formulário lê entradas com TextInput — `—`
- [ ] **(+1 pts)** Formulário salva chamando adicionar/salvar — `—`
- [x] **(+1 pts)** Lista é alimentada a partir do storage — `screens/ListaScreen.js`
- [x] **(+1 pts)** Tela de detalhe usa busca/dados do storage — `screens/DetalheScreen.js`
- [ ] **(+1 pts)** Exclusão usa confirmação (Alert.alert) — `—`
- [x] **(+1 pts)** Dados iniciais/seed são gravados na 1ª execução — `screens/DetalheScreen.js`
- [ ] **(+1 pts)** Formulário valida campos (trim/length/vazio) — `—`

### Fase 3 — Banco de dados SQLite (4/30 pts)

- [ ] **(+2x2 pts)** Dependência expo-sqlite está no package.json — `FALTA instalar: npx expo install expo-sqlite`
- [ ] **(+2x2 pts)** Existe import do expo-sqlite — `—`
- [ ] **(+2x2 pts)** Existe arquivo de banco de dados — `—`
- [ ] **(+2x2 pts)** Cria a tabela com CREATE TABLE IF NOT EXISTS — `—`
- [ ] **(+2x2 pts)** Insere dados com INSERT INTO — `—`
- [ ] **(+2x2 pts)** Consulta com SELECT — `—`
- [ ] **(+2x2 pts)** Atualiza com UPDATE — `—`
- [ ] **(+2x2 pts)** Exclui com DELETE FROM — `—`
- [ ] **(+2x2 pts)** Usa filtros com WHERE — `—`
- [ ] **(+2x2 pts)** Banco aberto com openDatabaseAsync/openDatabase — `—`
- [x] **(+2x2 pts)** Tela de lista carrega dados do banco — `screens/ListaScreen.js`
- [ ] **(+2x2 pts)** Formulário salva no banco (INSERT/runAsync) — `—`
- [ ] **(+2x2 pts)** Detalhe busca no banco com WHERE/SELECT — `screens/DetalheScreen.js`
- [x] **(+2x2 pts)** Usa async/await corretamente (mais de 2 await) — `screens/DetalheScreen.js`
- [ ] **(+2x2 pts)** Banco possui dados iniciais (seed inserido em SQL) — `—`

## Para evoluir a nota

Os itens **desmarcados** acima são exatamente o que falta no projeto. Cada rodada deste CI (a cada push) recalcula e atualiza a nota — o artefato `nota-pam` sempre mostra o valor mais recente.
