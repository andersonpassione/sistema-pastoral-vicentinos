# 🕊️ Sistema de Gestão Pastoral dos Vicentinos

> Plataforma web para gestão humanizada, segura e eficiente da distribuição de benefícios alimentares (cestas básicas), prontuários de famílias beneficiárias e visitas pastorais da **Sociedade de São Vicente de Paulo (SSVP)**.

---

## 📋 Visão Geral

O **Sistema de Gestão Pastoral dos Vicentinos** foi projetado para auxiliar conferências e pastorais paroquiais na organização do plantão de atendimento e na promoção social de famílias em situação de vulnerabilidade.

O sistema elimina o controle manual em fichas de papel, impede duplicidades de cadastros via validação estrita de CPF único, previne entregas excedentes no mesmo mês e mantém o registro histórico para auditoria e prestação de contas da paróquia.

---

## ✨ Principais Funcionalidades

### 1. 📦 Entrega Rápida de Cestas Básicas
* **Busca Inteligente:** Pesquisa em tempo real por **Nome** ou **CPF** (com formatação automática).
* **Controle Estrito de Limite Mensal:** Impede automaticamente a entrega de mais de **1 cesta básica no mesmo mês** para a mesma família.
* **Intervalo Paroquial Configurável:** Verificação automática do intervalo mínimo de retiradas (padrão de 28 a 30 dias).
* **Protocolo Auditável:** Toda entrega concluída gera um número de protocolo único (ex: `#ENT-202611-01`), registrando data, horário, voluntário responsável e tipo da cesta.
* **Painel do Plantão:** Acompanhamento ao vivo de todas as retiradas do dia com contador de cestas distribuídas.
* **Recibo e Termo de Entrega:** Visualização imediata do comprovante de entrega para conferência.

### 2. 👨‍👩‍👧‍👦 Famílias Beneficiárias (Prontuário Social)
* **Prevenção de Duplicidade:** Cadastro obrigatório com **CPF Único**, impedindo que a mesma pessoa receba por mais de uma conferência.
* **Ficha Cadastral Completa:** Registro de NIS/PIS, RG, data de nascimento, telefone, endereço, tipo de moradia (própria, alugada, cedida), valor do aluguel e ponto de referência.
* **Composição Familiar e Dependentes:** Cadastro detalhado de filhos, idosos e dependentes com idade, faixa etária (primeira infância, escolar) e demandas de saúde/educação.
* **Classificação de Vulnerabilidade:** Categorização socioeconômica (*Extrema Pobreza* e *Baixa Renda*) com cálculo de renda per capita.
* **Ciclo de Vida do Cadastro:**
  * 🟢 **Em Acompanhamento:** Família ativa no programa e apta a receber cestas conforme o intervalo paroquial.
  * 🟡 **Promovida:** Família que alcançou autonomia alimentar/financeira. Mantida no sistema exclusivamente para histórico estatístico (entregas bloqueadas).
  * ⚪ **Inativa:** Cadastros arquivados por mudança de município ou falecimento (entregas bloqueadas).

### 3. 🤝 Visitas Periódicas Domiciliares
* Agendamento e registro de visitas pastorais realizadas pelos vicentinos no domicílio das famílias.
* Relatório qualitativo de necessidades (apoio médico, remédios, material escolar, fraldas, suporte espiritual).
* Níveis de prioridade de acolhimento: *Urgente*, *Alta*, *Média* e *Baixa*.
* Alertas para famílias com alta vulnerabilidade que estão sem visita pastoral há mais de 60 dias.

### 4. 📊 Relatórios e Prestação de Contas
* Estatísticas da paróquia: total de cestas entregues no mês, famílias ativas assistidas, número de dependentes impactados e taxa de cobertura da cota mensal.
* Tabela de auditoria completa com filtros por data, voluntário e família.
* Visualização limpa para prestação de contas com o conselho paroquial e pároco.

### 5. ⚙️ Parâmetros Paroquiais e Configurações
* Ajuste flexível dos parâmetros operacionais:
  * Nome oficial da Paróquia e Conferência Vicentina.
  * Padre responsável.
  * Intervalo mínimo entre retiradas (dias).
  * Cota mensal planejada de cestas básicas.
  * Exigência de termo assinado e visita domiciliar obrigatória para famílias críticas.

---

## 🔐 Controle de Acesso e Perfis (RBAC)

O sistema possui controle de privilégios com base no perfil de acesso autenticado pelo **Supabase Auth**:

| Perfil | Usuário Padrão | Permissões |
| :--- | :--- | :--- |
| **Administrador** | `anderson` | Acesso total: relatórios gerenciais, prestação de contas, parâmetros da paróquia, gestão de voluntários, alteração de senhas e exclusões. |
| **Voluntário** | `claudilene` | Acesso operacional: consulta de famílias beneficiárias, conferência de aptidão e registro de entregas de cestas. |

> 🛡️ **Segurança:** O sistema bloqueia a troca de perfil na interface sem autenticação prévia. Para acessar como Administrador, é obrigatório realizar o login fornecendo a respectiva senha.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions e API Routes)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Biblioteca UI:** [React 19](https://react.dev/)
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Animações:** [Motion (Framer Motion)](https://motion.dev/)
* **Banco de Dados & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL relacional com *Row Level Security* e *Supabase Auth*)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/) / Postgres Driver

---

## 📁 Estrutura do Projeto

```text
├── app/
│   ├── api/                     # Rotas de API (Next.js API Routes)
│   │   ├── deliveries/          # Endpoints de entregas de cestas
│   │   ├── families/            # CRUD e validações de famílias beneficiárias
│   │   ├── settings/            # Parâmetros operacionais da paróquia
│   │   ├── supabase/            # Status de integridade e conexão com o Supabase
│   │   ├── users/               # Gerenciamento de operadores e senhas
│   │   └── visits/              # Registro de visitas periódicas
│   ├── globals.css              # Estilos globais e Tailwind v4
│   ├── layout.tsx               # Root Layout com metadados e viewport
│   └── page.tsx                 # Página principal / montador de componentes
├── components/
│   ├── CadastrarFamiliaModal.tsx   # Modal/Gaveta para novo cadastro e edição
│   ├── ConfiguracoesView.tsx       # Gestão de parâmetros e usuários (Admin)
│   ├── ConsultarHistoricoModal.tsx # Consulta detalhada de entregas anteriores
│   ├── EntregaRapidaView.tsx       # Módulo principal de atendimento do plantão
│   ├── FamiliasBeneficiariasView.tsx # Listagem, busca e prontuários
│   ├── Header.tsx                  # Cabeçalho com busca global e menu de usuário
│   ├── LoginView.tsx               # Tela de autenticação nativa Supabase Auth
│   ├── ProntuarioModal.tsx         # Ficha social completa da família
│   ├── RegistrarVisitaModal.tsx    # Formulário de visitas domiciliares
│   ├── RelatoriosView.tsx          # Prestação de contas e gráficos (Admin)
│   └── Sidebar.tsx                 # Navegação lateral expansível/responsiva
├── lib/
│   ├── cpf.ts                   # Utilitários de validação e máscara de CPF
│   ├── data.ts                  # Tipagens TypeScript e regras de limites mensais
│   ├── supabase.ts              # Inicialização do cliente Supabase e Auth
│   └── utils.ts                 # Utilitários de estilização (clsx, tailwind-merge)
├── src/
│   └── db/
│       ├── schema.ts            # Definição do schema relacional (Drizzle ORM)
│       └── queries.ts           # Consultas e operações no banco de dados
├── supabase/
│   └── migrations/              # Scripts SQL de criação de tabelas e RLS
│       ├── 20261031000000_create_pastoral_schema.sql
│       └── 20261031000001_integrate_supabase_auth.sql
├── .env.example                 # Modelo de variáveis de ambiente
├── package.json                 # Dependências e scripts
└── tsconfig.json                # Configuração do TypeScript
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** versão 20 ou superior
* Gerenciador de pacotes **npm** ou **yarn**
* Conta e projeto criado no [Supabase](https://supabase.com/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/andersonpassione/sistema-pastoral-vicentinos.git
cd sistema-pastoral-vicentinos
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto copiando o exemplo:
```bash
cp .env.example .env.local
```

Preencha com as credenciais do seu projeto Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SECRET_KEY=sua-chave-service-role-privada
```

> ⚠️ **Importante:** A chave `SUPABASE_SECRET_KEY` (*service_role*) nunca deve ser commitada no Git. Mantenha-a exclusivamente no arquivo `.env.local` que está incluído no `.gitignore`.

### 4. Executar as Migrações no Banco de Dados
Acesse o **SQL Editor** no painel do Supabase e execute os scripts localizados em:
1. `supabase/migrations/20261031000000_create_pastoral_schema.sql` (Criação de tabelas, índices e políticas de RLS).
2. `supabase/migrations/20261031000001_integrate_supabase_auth.sql` (Gatilho automático de novos usuários com Supabase Auth).

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponíveis

* `npm run dev`: Inicia o servidor local de desenvolvimento na porta 3000.
* `npm run build`: Compila a aplicação otimizada para produção.
* `npm run start`: Inicia o servidor Next.js em modo de produção.
* `npm run lint`: Executa a verificação estática do código com ESLint.

---

## 🤝 Contribuição e Propósito

Este projeto foi desenvolvido com foco no trabalho voluntário e solidário realizado pelas Conferências Vicentinas e pastorais paroquiais católicas. 

Sugestões de melhorias e novas funcionalidades voltadas à assistência social são sempre bem-vindas!

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais informações.
