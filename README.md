# 📦 3GDStock — Controle de Estoque para Materiais de Construção

<!-- PAM-CI-NOTA-INICIO -->
### Nota atual (automática) — 3GD (estoque de materiais de construção)

[![CI](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml/badge.svg)](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml) [![Nota](https://img.shields.io/badge/Nota%20PAM%20I-B-yellow)](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml)

**B** — Bom · **70%** (70/100 pontos) · atualizado em 2026-11-16 22:42

| Fase | Pontos |
|------|--------|
| Fase 1 — Estrutura | 9/10 |
| Fase 2 — AsyncStorage | 12/15 |
| Fase 3 — SQLite | 28/30 |
| Fase 4 — Versão Final (UX e Dispositivo) | 21/45 |

Checklist item a item em [NOTA.md](NOTA.md) · [ver a rodada mais recente no Actions](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml)
<!-- PAM-CI-NOTA-FIM -->

3GD — Projeto PAM I (Programação para Aplicativos Móveis I)

---

> [!IMPORTANT]
> **Entrega 1 Concluída!** Proposta do projeto + Aplicativo móvel com 2 telas funcionais desenvolvido em React Native + Expo.

## Entrega 3 — SQLite e CRUD

Os materiais são salvos no banco local `3gdstock.db`, inicializado ao abrir o app.
A tabela `materiais` contém os campos do estoque e a data de criação.

- Criar: use **Novo material**, preencha nome e estoque inicial e salve.
- Ler: a lista e o detalhe consultam o SQLite.
- Atualizar: no detalhe, escolha um status e toque em **Salvar status**.
  As entradas de 10 unidades e saídas de 5 unidades também são persistidas.
- Excluir: toque em **Excluir material** e confirme; cancelar mantém o registro.
- Filtrar: busca por nome, código, descrição ou categoria e filtros de status/categoria
  são combinados em consultas SQL com `WHERE` e parâmetros.

Na primeira abertura, os materiais de `@materiais` no AsyncStorage são importados
em uma transação. Sem dados anteriores, entram os três exemplos do projeto.
Uma lista antiga vazia permanece vazia. A migração é marcada no SQLite e não se
repete, inclusive depois de excluir todos os itens. Login e contas permanecem
no AsyncStorage.

### Conferência manual

1. Rode `npm install` e `npm start` (projeto com Expo SDK 52).
2. Entre/crie uma conta e cadastre um material.
3. Abra o detalhe, altere o status e registre entrada/saída.
4. Volte à lista e combine busca com filtros de status e categoria.
5. Feche e reabra o app para conferir a persistência.
6. Cancele uma exclusão e depois confirme; o item deve desaparecer.

**Plataformas:** Android/iOS usam `expo-sqlite`. No computador, rode `npm run web`
e abra o endereço indicado pelo Expo. O navegador usa SQLite via `sql.js`, com
o arquivo do banco persistido no IndexedDB. As consultas e as telas são as mesmas.
Os dados ficam separados por dispositivo e por endereço do navegador.

O comando `npm install` prepara automaticamente os arquivos do SQLite web em
`public/`. Se necessário, execute `npm run postinstall` para recriá-los.

## 👥 Integrantes do Grupo

- **Gabriel Lopes Gonçalves**
- **Guilherme Henrique dos Santos**
- **Giovanna Bertoldo de Souza**
- **Diego Alexandre Matos da Silva**

## 🏗 Tema do Projeto

Gerenciamento e controle de estoque para materiais de construção civil — auxiliando empresas, construtores e depósitos a organizar, consultar e gerenciar seus insumos em tempo real.

---

## 📱 Telas Implementadas (Entrega 1)

### 1. Tela de Lista de Materiais (`screens/ListaScreen.js`)
- Cabeçalho personalizado com logotipo exclusivo (**3GDStock**), menu lateral e atalhos de notificação.
- Título **Materiais** e botão **`+ NOVO MATERIAL`** em destaque laranja (com Alert "Em breve" da Fase 1).
- Barra de busca dinâmica em tempo real por nome, código, descrição ou categoria.
- Cards estilizados (`components/MaterialCard.js`) com ícones específicos para materiais de construção, código de referência, quantidade atual e selos coloridos de status (🟢 *Em estoque*, 🟡 *Estoque baixo*, 🔴 *Em falta*).
- Navegação fluida para a tela de detalhes ao tocar em qualquer item.
- Barra inferior decorativa com cantos arredondados conforme o protótipo.

### 2. Tela de Detalhes do Material (`screens/DetalheScreen.js`)
- Cabeçalho com botão **`← Voltar`** que retorna suavemente para a lista principal.
- Card principal com ícone ampliado, nome, subtítulo, selo de status e contador em destaque da quantidade em estoque.
- Quadro de movimentações rápidas com botões interativos para **Registrar Entrada (+)** e **Registrar Saída (-)**.
- Painel de especificações técnicas: Código/SKU, Categoria, Localização no Almoxarifado, Fornecedor Principal, Preço Unitário e Valor Total em Estoque.
- Descrição técnica detalhada com recomendações de uso do material na obra.
- Botão inferior **`Voltar para a Lista`**.

---

## 🗂 Estrutura do Projeto

```
3GDStock/
├── components/              # Componentes reutilizáveis
│   ├── Header.js            # Top bar corporativa com logo e ícones
│   ├── MaterialCard.js      # Card de material com badges de status
│   └── MaterialIcon.js      # Renderizador visual por tipo de insumo
├── data/
│   └── mockData.js          # Dados estáticos
├── screens/                 # Telas da aplicação
│   ├── ListaScreen.js       # Tela 1: Lista e busca de materiais
│   └── DetalheScreen.js     # Tela 2: Detalhes completos e movimentações
├── App.js                   # Configuração do NavigationContainer (Stack)
├── index.js                 # Entrypoint da aplicação
├── app.json                 # Configurações do Expo
├── package.json             # Dependências e scripts
└── PROPOSTA_PROJETO.md      # Documento oficial da Proposta (Entrega 1)
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado (versão 18 ou superior)
- Celular com o app **Expo Go** (Android / iOS) ou Navegador Web / Emulador

### Passos:
1. Abra o terminal na pasta do projeto:
   ```bash
   cd 3GDStock
   ```

2. Instale as dependências:
   ```bash
   corepack yarn
   # ou npm install / npx expo install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   corepack yarn expo start
   ```

4. Pressione:
   - `w` para abrir no navegador web
   - `a` para abrir no emulador Android
   - `i` para abrir no simulador iOS
   - Ou escaneie o QR Code no app **Expo Go** no smartphone

---

## 📅 Fichas de Entrega do Curso

| Fase | Descrição | Prazo | Link |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Proposta do projeto + app com duas telas | Aula 20 + início do Bimestre 3 | [fase1.md](https://github.com/Etec-Bento-Quirino/Programacao-Aplicativos-Moveis-I/blob/main/modulo-08-projeto-final/fase1.md) |
| **Fase 2** | Formulário + persistência com AsyncStorage | 14/09/2026 | [fase2.md](https://github.com/Etec-Bento-Quirino/Programacao-Aplicativos-Moveis-I/blob/main/modulo-08-projeto-final/fase2.md) |
| **Fase 3** | SQLite + CRUD completo | 19/10/2026 | [fase3.md](https://github.com/Etec-Bento-Quirino/Programacao-Aplicativos-Moveis-I/blob/main/modulo-08-projeto-final/fase3.md) |
| **Fase 4** | Versão final + apresentação | 16/11/2026 | [fase4.md](https://github.com/Etec-Bento-Quirino/Programacao-Aplicativos-Moveis-I/blob/main/modulo-08-projeto-final/fase4.md) |

---

## 🛠 Tecnologias Utilizadas

- **React Native** (0.76+)
- **Expo** (SDK 52+)
- **React Navigation Native & Native-Stack** (v7)
- **Expo Vector Icons** (Ionicons, Feather, MaterialCommunityIcons)
- **SQLite** (`expo-sqlite`, persistência local dos materiais na Fase 3)



---

## Colaboração por integrante

> *Excluídos: commits do professor Jackson Sá (wendelmax), `github-actions[bot]` e `dependabot[bot]`. Contagem com base em `git log --no-merges`.*

| # | Integrante | Commits | Participação |
|---|------------|---------|--------------|
| 1 | Gabriel Lopes Gonçalves | 3 | 42.9% ████████░░░░░░░░░░░░ |
| 2 | Giovanna Bertoldo | 2 | 28.6% █████░░░░░░░░░░░░░░░ |
| 3 | Diego Alexandre Matos da Silva | 2 | 28.6% █████░░░░░░░░░░░░░░░ |

**Total de commits considerados:** 7
