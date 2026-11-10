# Proposta de Projeto - Entrega 1
## 3GDStock — Sistema de Gestão de Estoque para Materiais de Construção

---

### 1. Identificação do Projeto e Equipe

- **Nome do Aplicativo:** 3GDStock
- **Tema do Projeto:** Gestão e Controle de Estoque de Materiais para Construção Civil
- **Nome do Grupo:** Grupo 3GD
- **Integrantes da Equipe:**
  1. Gabriel Lopes Gonçalves
  2. Guilherme Henrique dos Santos
  3. Giovanna Bertoldo de Souza
  4. Diego Alexandre Matos da Silva

---

### 2. Problema que o Aplicativo Resolve

No setor da construção civil e em depósitos de materiais, a gestão de estoque frequentemente enfrenta desafios críticos:
1. **Falta de visibilidade em tempo real:** Atrasos em obras causados por desabastecimento de itens essenciais (cimento, aço, argamassa, tubulações) não identificados com antecedência.
2. **Compras emergenciais e custos elevados:** Aquisições de última hora por falta de alertas de "Estoque Baixo" ou "Em Falta", gerando custos extras de frete e preços desfavoráveis.
3. **Controles manuais e propensos a erros:** Uso frequente de cadernos ou planilhas estáticas de difícil consulta no canteiro de obras.
4. **Instabilidade de conectividade:** Canteiros de obras e galpões frequentemente possuem sinal de internet precário, inviabilizando sistemas exclusivamente em nuvem sem suporte local.

O **3GDStock** resolve esses problemas ao disponibilizar uma interface ágil, visual e intuitiva no smartphone do usuário, com identificação imediata dos níveis de estoque por cores de alerta e funcionamento garantido mesmo sem internet.

---

### 3. Público-Alvo

- **Mestres de Obra e Encarregados de Canteiro:** Precisam checar rapidamente a disponibilidade de insumos para os próximos dias de trabalho.
- **Almoxarifes e Gerentes de Depósito:** Responsáveis pelo recebimento, organização física e contagem de itens.
- **Pequenos e Médios Empreiteiros / Construtores:** Profissionais que gerenciam múltiplas pequenas obras e necessitam de controle centralizado de seus insumos.
- **Lojas de Materiais de Construção:** Lojas de bairro que buscam um controle de estoque digital simplificado e sem complexidade de grandes ERPs.

---

### 4. Objetivo Geral

Desenvolver um aplicativo móvel multiplataforma focado na gestão rápida, clara e eficiente de materiais de construção civil, permitindo aos usuários consultar inventários, monitorar status críticos de suprimento, visualizar especificações técnicas de cada item e realizar novos cadastros e movimentações com persistência local.

---

### 5. Principais Funcionalidades

1. **Listagem Visual com Badges de Status:**
   - Visualização organizada em cards dos materiais cadastrados com código, quantidade em estoque e selos coloridos de status:
     - 🟢 **Em estoque:** Quantidade segura e suficiente para o fluxo de trabalho.
     - 🟡 **Estoque baixo:** Quantidade atingiu o ponto de atenção/reposição.
     - 🔴 **Em falta:** Item esgotado ou abaixo do estoque mínimo de segurança.
2. **Busca Rápida e Filtros Dinâmicos:**
   - Campo de pesquisa em tempo real por nome do material ou código de referência.
   - Filtros por categoria e status de disponibilidade.
3. **Tela de Detalhamento Completo:**
   - Exibição de dados aprofundados ao selecionar um item: descrição completa, categoria, unidade de medida, localização no almoxarifado/prateleira, estoque mínimo, fornecedor principal e valor unitário.
4. **Cadastro de Novos Materiais:**
   - Botão em destaque `+ NOVO MATERIAL` na tela inicial para inserção de novos registros com validação de dados.
5. **Navegação Fluida (Stack Navigation):**
   - Transição nativa entre a tela de listagem e a tela de detalhe com botão de retorno intuitivo.
6. **Persistência de Dados Offline (Fase 2 / SQLite):**
   - Estrutura pronta para armazenamento local com SQLite, permitindo operações completas mesmo sem conexão com a internet.

---

### 6. Justificativa da Escolha do Tema e Tecnologias

#### 6.1. Justificativa do Tema
O segmento de construção civil movimenta altos volumes físicos e financeiros. A falta de um único material pode paralisar equipes inteiras, gerando multas por atraso e prejuízos contratuais. Um aplicativo móvel específico para materiais de construção, com linguagem visual adaptada à rotina de obras, tem grande aplicabilidade prática e impacto direto na produtividade do setor.

#### 6.2. Justificativa das Tecnologias

| Tecnologia | Função no Projeto | Justificativa Técnica |
| :--- | :--- | :--- |
| **React Native** | Framework Mobile | Permite criar código único em JavaScript/TypeScript com renderização 100% nativa para Android e iOS, garantindo alto desempenho, fluidez visual e menor custo de manutenção. |
| **Expo** | Plataforma e SDK | Acelera o ciclo de desenvolvimento através de ferramentas modernas de build, recarregamento a quente (Fast Refresh), integração nativa com componentes de sistema e pacote completo de ícones (`@expo/vector-icons`). |
| **React Navigation** | Gerenciamento de Rotas | Padrão da indústria para navegação em React Native, oferecendo transições de tela nativas e tipadas (Stack Navigator) com cabeçalhos customizáveis e botão de voltar integrado. |
| **SQLite (Expo SQLite)** | Banco de Dados Local | Banco relacional embutido (zero-configuration e ACID). Essencial para a arquitetura *Offline-First* exigida em canteiros de obra, garantindo velocidade instantânea de leitura/escrita e integridade referencial sem dependência contínua de servidores externos. |

---

### 7. Estrutura das Telas na Entrega 1

- **Tela 1 — Lista de Materiais (`screens/ListaScreen.js`):**
  - Cabeçalho corporativo com logotipo, ícones de navegação e atalhos.
  - Título e subtítulo da seção.
  - Botão de ação principal `+ NOVO MATERIAL`.
  - Campo de busca e filtro interativo.
  - Cards customizados (`components/MaterialCard.js`) contendo ícones ilustrativos, código, quantidade atual e badges de status.
  - Toque no card navega diretamente para a tela de detalhe.
- **Tela 2 — Detalhes do Material (`screens/DetalheScreen.js`):**
  - Cabeçalho com botão "← Voltar".
  - Card central com nome, código, badge de status e nível de estoque.
  - Grid de informações técnicas (Descrição, Categoria, Localização no depósito, Estoque Mínimo, Fornecedor, Preço Unitário).
  - Ações operacionais simuladas (Registrar Entrada / Registrar Saída).
