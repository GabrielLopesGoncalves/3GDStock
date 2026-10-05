# 📦 3GDStock — Controle de Estoque para Materiais de Construção

<!-- PAM-CI-NOTA-INICIO -->
### Nota atual (automática) — 3GD (estoque de materiais de construção)

[![CI](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml/badge.svg)](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml) [![Nota](https://img.shields.io/badge/Nota%20PAM%20I-R-orange)](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml)

**R** — Regular · **40%** (22/55 pontos) · atualizado em 2026-10-05 23:24

| Fase | Pontos |
|------|--------|
| Fase 1 — Estrutura | 8/10 |
| Fase 2 — AsyncStorage | 10/15 |
| Fase 3 — SQLite | 4/30 |

Checklist item a item em [NOTA.md](NOTA.md) · [ver a rodada mais recente no Actions](https://github.com/GabrielLopesGoncalves/3GDStock/actions/workflows/pam-ci.yml)
<!-- PAM-CI-NOTA-FIM -->

3GD — Projeto PAM I (Programação para Aplicativos Móveis I)

---

> [!IMPORTANT]
> **Entrega 1 Concluída!** Proposta do projeto + Aplicativo móvel com 2 telas funcionais desenvolvido em React Native + Expo.

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
- **SQLite** (Planejado para persistência local nas Fases 2/3)
