# 🕊️ Sistema de Gestão Pastoral dos Vicentinos

> Plataforma web para gestão humanizada, segura e auditável da distribuição de cestas básicas, prontuários de famílias beneficiárias, visitas domiciliares e prestação de contas da **Sociedade de São Vicente de Paulo (SSVP)**.

---

## 📋 Visão Geral

O **Sistema de Gestão Pastoral dos Vicentinos** foi desenvolvido para apoiar conferências e pastorais paroquiais na organização dos plantões de atendimento e no acompanhamento social de famílias em situação de vulnerabilidade.

A aplicação substitui o controle manual em fichas de papel por uma base relacional integrada ao **Supabase**, garantindo unicidade de cadastro por CPF, controle mensal rigoroso de entregas, notificações reais do plantão e emissão oficial de relatórios e balancetes em PDF.

---

## ✨ Principais Funcionalidades

### 1. 📦 Entrega Rápida de Cestas Básicas
* **Busca Imediata:** Localização de famílias por **Nome**, **CPF** ou **NIS**, além de sugestões rápidas com indicador visual de aptidão.
* **Regra Estrita de Cota Mensal (1/Mês):** Impede automaticamente mais de **1 cesta básica no mesmo mês civil** para a mesma família, tanto na interface quanto na validação da API/banco.
* **Intervalo Paroquial Configurável:** Verifica o intervalo mínimo de dias configurado pela paróquia (ex.: 28 ou 30 dias), permitindo autorização excepcional justificada apenas quando dentro da cota mensal.
* **Bloqueio por Status Cadastral:** Famílias com status **Promovida** ou **Inativa** ficam bloqueadas para novas retiradas, preservando apenas o histórico estatístico.
* **Protocolo e Histórico:** Toda entrega gera número de protocolo único (ex.: `#ENT-202611-01`), registrando data, horário, voluntário responsável, observações e opção de solicitação de visita pastoral.

### 2. 👨‍👩‍👧‍👦 Famílias Beneficiárias (Prontuário Social)
* **Validação Rigorosa de Cadastro:**
  * Preenchimento obrigatório validado para todos os campos marcados com `*` antes de habilitar **Salvar Cadastro** ou **Salvar e Já Realizar 1ª Entrega**.
  * **CPF único e válido** (com dígito verificador e bloqueio contra duplicidade).
  * **Telefone celular** restrito a números e formatado no padrão brasileiro `(00) 00000-0000`.
  * **Busca automática de endereço por CEP** via integração com a API ViaCEP.
* **Composição Familiar e Renda:** Registro de dependentes (faixa etária, escola, primeira infância, idosos, observações) e cálculo automático de **renda per capita** (*Extrema Pobreza* / *Baixa Renda*).
* **Filtros Rápidos e Ordenação:** Pesquisa por Nome, CPF, NIS ou Bairro, filtros por status e vulnerabilidade, além de botão **Ordem Alfabética (A–Z)** nos Filtros Rápidos.
* **Exclusão Definitiva Segura:** Remoção em cascata dos registros vinculados (`delivery_records`, `periodic_visits`, `dependents` e `families`) com confirmação visual no banco de dados.

### 3. 🤝 Visitas Periódicas Domiciliares
* **Registro Completo:** Seleção da família beneficiária ordenada alfabeticamente, data, horário, equipe visitadora, tipo de visita, condições de moradia, demandas detectadas e recomendação de retorno.
* **Visualização em Modal (`Visualizar Ficha`):** Abertura instantânea da ficha completa da visita na tela, com opção de baixar a **Ficha Individual da Visita em PDF** e atalho direto para o **Prontuário Social**.

### 4. 📊 Relatórios e Prestação de Contas (Admin)
* **Indicadores Consolidados:** Cestas entregues no mês vigente, **Projeção Mensal de Cestas** (baseada nas famílias *Em acompanhamento*), total de famílias cadastradas, **crianças assistidas (até 12 anos)** e total de pessoas impactadas.
* **Balancete Oficial em PDF:** Geração direta de documento A4 via `jsPDF` e `jspdf-autotable` contendo cabeçalho institucional da paróquia, resumo executivo, relação nominal de entregas filtradas, espaços para assinatura da Coordenação Pastoral e Pároco/Conselho e numeração de páginas.
* **Exportação em CSV:** Download rápido da relação de entregas para planilhas e arquivo contábil.

### 5. 🔔 Busca Global e Notificações do Plantão
* **Pesquisa Global no Cabeçalho:** Menu suspenso ao vivo ao digitar Nome, CPF, NIS ou Bairro, com atalhos diretos para abrir o **Prontuário** ou iniciar **Entrega**.
* **Notificações Conectadas ao Banco:** Alertas dinâmicos gerados a partir dos dados reais do Supabase:
  * Solicitações de visita pastoral feitas durante entregas ainda pendentes de visita;
  * Famílias *Em acompanhamento* aptas aguardando cesta no mês vigente;
  * Resumo das entregas realizadas no plantão do dia;
  * Visitas periódicas registradas nos últimos 7 dias.

### 6. ⚙️ Configurações Paroquiais
* Definição do nome oficial da paróquia, intervalo mínimo entre entregas (dias), exigência de assinatura/termo e gestão de perfis (acesso exclusivo de Administrador).

---

## 🔐 Autenticação, Segurança e Perfis (RBAC)

O acesso ao sistema utiliza autenticação nativa via **Supabase Auth**, **sem credenciais fixas ou senhas armazenadas no código-fonte**.

| Perfil | Permissões |
| :--- | :--- |
| **Administrador** | Acesso completo: entrega rápida, cadastro/edição/exclusão de famílias, visitas periódicas, relatórios, balancete em PDF e configurações paroquiais. |
| **Voluntário** | Acesso operacional: pesquisa e visualização de prontuários de famílias e registro de entregas rápidas de cestas. |

### Como Cadastrar Novos Usuários
1. Acesse o painel do seu projeto no **Supabase** em **Authentication > Users > Add user**.
2. Informe o e-mail e a senha do novo membro (marque **Auto Confirm User** para liberar o acesso imediato).
3. Caso o perfil deva ter acesso administrativo, defina `role` como `administrador` na tabela `public.users` (ou nos metadados do usuário).

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router e API Routes)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Interface:** [React 19](https://react.dev/) e [Tailwind CSS v4](https://tailwindcss.com/)
* **Ícones e Animações:** [Lucide React](https://lucide.dev/) e [Motion](https://motion.dev/)
* **Geração de PDF:** [jsPDF](https://github.com/parallax/jsPDF) e [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
* **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security e Supabase Auth)
* **ORM / Driver:** [Drizzle ORM](https://orm.drizzle.team/) e `pg`
* **Consulta Postal:** [ViaCEP](https://viacep.com.br/)

---

## 📁 Estrutura do Projeto

```text
├── app/
│   ├── api/                        # API Routes (Next.js)
│   │   ├── deliveries/             # Registro e consulta de entregas com trava mensal
│   │   ├── families/               # CRUD de famílias beneficiárias e exclusão em cascata
│   │   ├── settings/               # Parâmetros operacionais da paróquia
│   │   ├── supabase/               # Verificação de conexão com o Supabase
│   │   ├── users/                  # Listagem e gestão de perfis
│   │   └── visits/                 # Registro e consulta de visitas periódicas
│   ├── globals.css                 # Configuração global do Tailwind CSS v4
│   ├── layout.tsx                  # Layout raiz e metadados
│   └── page.tsx                    # Orquestração principal da aplicação
├── components/
│   ├── CadastrarFamiliaModal.tsx   # Cadastro/edição com validação de obrigatórios (*) e máscaras
│   ├── ConfiguracoesView.tsx       # Parâmetros paroquiais e controle de perfis
│   ├── ConsultarHistoricoModal.tsx # Consulta de histórico de entregas
│   ├── EntregaRapidaView.tsx       # Atendimento do plantão e entrega de cestas
│   ├── FamiliasBeneficiariasView.tsx # Listagem, filtros rápidos (A–Z) e ações
│   ├── Header.tsx                  # Busca global ao vivo, notificações reais e menu do usuário
│   ├── LoginView.tsx               # Autenticação via Supabase Auth
│   ├── ProntuarioModal.tsx         # Prontuário social completo da família
│   ├── RegistrarVisitaModal.tsx    # Registro de visita com seleção em ordem alfabética
│   ├── RelatoriosView.tsx          # Indicadores, projeção mensal, CSV e Balancete Oficial (PDF)
│   ├── Sidebar.tsx                 # Navegação lateral responsiva e recolhível
│   └── VisitasPeriodicasView.tsx   # Listagem de visitas e modal de visualização/PDF da ficha
├── lib/
│   ├── cpf.ts                      # Validação e máscaras de CPF e CEP
│   ├── data.ts                     # Tipagens, datas flexíveis e regras de cota mensal
│   ├── supabase.ts                 # Clientes Supabase (navegador e servidor)
│   └── utils.ts                    # Helpers de classes CSS
├── src/
│   └── db/
│       ├── index.ts                # Conexão Drizzle ORM
│       ├── schema.ts               # Schema relacional PostgreSQL
│       └── queries.ts              # Operações no Supabase e Drizzle
├── supabase/
│   └── migrations/                 # Scripts SQL de schema, gatilhos e RLS
│       ├── 20261031000000_create_pastoral_schema.sql
│       └── 20261031000001_integrate_supabase_auth.sql
├── .env.example                    # Modelo das variáveis de ambiente
├── package.json                    # Dependências e scripts
└── tsconfig.json                   # Configuração TypeScript
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* **Node.js** versão 20 ou superior
* **npm** (ou gerenciador equivalente)
* Projeto criado no [Supabase](https://supabase.com/)

### 1. Clonar o Repositório
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <NOME_DA_PASTA>
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo e preencha com as chaves do seu projeto Supabase:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-publica-anon"
SUPABASE_SECRET_KEY="sua-chave-secreta-service-role"
```

> ⚠️ **Segurança:** Nunca envie arquivos `.env*` ou a chave `SUPABASE_SECRET_KEY` para o GitHub.

### 4. Executar as Migrações no Supabase
No **SQL Editor** do painel do Supabase, execute em ordem os arquivos da pasta `supabase/migrations/`:
1. `20261031000000_create_pastoral_schema.sql`
2. `20261031000001_integrate_supabase_auth.sql`

### 5. Iniciar a Aplicação
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponíveis

* `npm run dev`: Inicia o servidor de desenvolvimento na porta `3000`.
* `npm run build`: Gera o build de produção com Next.js.
* `npm run start`: Inicia a aplicação compilada em modo de produção.
* `npm run lint`: Executa a validação estática de código com ESLint.

---

## 🤝 Propósito e Licença

Projeto voltado ao apoio do trabalho voluntário das Conferências Vicentinas e pastorais sociais paroquiais. Distribuído sob a licença **MIT**.
