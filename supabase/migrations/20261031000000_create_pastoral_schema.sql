-- ==============================================================================
-- Migração Supabase / PostgreSQL: Sistema Pastoral dos Vicentinos
-- Região recomendada: sa-east-1 (América do Sul / São Paulo)
-- ==============================================================================

-- 1. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'voluntario' CHECK (role IN ('administrador', 'voluntario')),
    password TEXT NOT NULL DEFAULT '123',
    shift TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Famílias Beneficiárias
-- Regra 1: Não permitir cadastro duplicado (CPF Único obrigatório)
-- Regra 2: Status 'em_acompanhamento', 'promovida' ou 'inativa'
CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    nis VARCHAR(20),
    rg VARCHAR(20),
    birth_date VARCHAR(10),
    phone VARCHAR(20),
    gender_identity VARCHAR(50),
    address TEXT,
    bairro VARCHAR(100),
    housing_type VARCHAR(50),
    rent_value VARCHAR(20),
    reference_point TEXT,
    vulnerability_level VARCHAR(20) DEFAULT 'moderada' CHECK (vulnerability_level IN ('critica', 'alta', 'moderada', 'estavel')),
    monthly_income VARCHAR(20),
    per_capita_income VARCHAR(20),
    benefit_type VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'em_acompanhamento' CHECK (status IN ('em_acompanhamento', 'promovida', 'inativa')),
    last_delivery_date VARCHAR(20),
    last_delivery_days_ago INTEGER,
    pastoral_notes TEXT,
    dependents_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Dependentes
CREATE TABLE IF NOT EXISTS dependents (
    id SERIAL PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    tag VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Registros de Entrega de Cesta Básica
CREATE TABLE IF NOT EXISTS delivery_records (
    id SERIAL PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
    family_name TEXT NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    basket_type VARCHAR(50) NOT NULL DEFAULT 'Padrão 22kg',
    volunteer_name VARCHAR(100) NOT NULL,
    parish_unit VARCHAR(100) NOT NULL DEFAULT 'Matriz Santíssimo Redentor',
    status VARCHAR(30) NOT NULL DEFAULT 'concluida',
    pastoral_visit_requested BOOLEAN NOT NULL DEFAULT FALSE,
    observation TEXT,
    protocol_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Visitas Periódicas Realizadas
CREATE TABLE IF NOT EXISTS periodic_visits (
    id SERIAL PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE RESTRICT,
    family_name TEXT NOT NULL,
    date VARCHAR(20) NOT NULL,
    volunteer_name VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    demand_type VARCHAR(100),
    priority_level VARCHAR(20) DEFAULT 'media' CHECK (priority_level IN ('baixa', 'media', 'alta', 'urgente')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Configurações Pastorais
CREATE TABLE IF NOT EXISTS pastoral_settings (
    id SERIAL PRIMARY KEY,
    parish_name TEXT NOT NULL DEFAULT 'Paróquia Santíssimo Redentor',
    parish_conference TEXT NOT NULL DEFAULT 'Conferência São Vicente de Paulo',
    responsible_priest TEXT DEFAULT 'Padre João Carlos',
    min_interval_days INTEGER DEFAULT 28,
    monthly_basket_quota INTEGER DEFAULT 150,
    require_signature BOOLEAN NOT NULL DEFAULT TRUE,
    require_visit_for_critical BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- Gatilho de Regra de Negócio:
-- Famílias com status 'promovida' ou 'inativa' NÃO podem receber cestas básicas
-- ==============================================================================
CREATE OR REPLACE FUNCTION validate_family_status_before_delivery()
RETURNS TRIGGER AS $$
DECLARE
    f_status VARCHAR(30);
    f_name TEXT;
BEGIN
    SELECT status, name INTO f_status, f_name FROM families WHERE id = NEW.family_id;
    
    IF f_status = 'promovida' THEN
        RAISE EXCEPTION 'Regra de Negócio: Família "%" possui status "Promovida" e não pode receber cestas básicas.', f_name;
    END IF;
    
    IF f_status = 'inativa' THEN
        RAISE EXCEPTION 'Regra de Negócio: Família "%" possui status "Inativa" e não pode receber cestas básicas.', f_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_delivery_family_status ON delivery_records;
CREATE TRIGGER trg_validate_delivery_family_status
    BEFORE INSERT ON delivery_records
    FOR EACH ROW
    EXECUTE FUNCTION validate_family_status_before_delivery();

-- ==============================================================================
-- Índices para Performance e Unicidade
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_families_cpf ON families (cpf);
CREATE INDEX IF NOT EXISTS idx_families_status ON families (status);
CREATE INDEX IF NOT EXISTS idx_families_name ON families (name);
CREATE INDEX IF NOT EXISTS idx_delivery_family_id ON delivery_records (family_id);
CREATE INDEX IF NOT EXISTS idx_visits_family_id ON periodic_visits (family_id);

-- ==============================================================================
-- Carga Inicial (Seeds): Usuários, Parâmetros e Famílias Iniciais
-- ==============================================================================

-- Inserir Anderson (Administrador) e Claudilene (Voluntário)
INSERT INTO users (username, name, role, password, shift, active)
VALUES 
    ('anderson', 'Anderson', 'administrador', '123', 'Coordenação Geral', TRUE),
    ('claudilene', 'Claudilene', 'voluntario', '123', 'Plantão Sábado Manhã', TRUE)
ON CONFLICT (username) DO UPDATE 
SET name = EXCLUDED.name, role = EXCLUDED.role, password = EXCLUDED.password;

-- Inserir Configurações Pastorais Iniciais
INSERT INTO pastoral_settings (id, parish_name, parish_conference, responsible_priest, min_interval_days, monthly_basket_quota, require_signature, require_visit_for_critical)
VALUES (1, 'Paróquia Santíssimo Redentor', 'Conferência São Vicente de Paulo', 'Padre João Carlos', 28, 150, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Inserir Famílias Iniciais com CPFs únicos e status configurados
INSERT INTO families (
    id, name, cpf, nis, rg, birth_date, phone, gender_identity, address, bairro, 
    housing_type, rent_value, reference_point, vulnerability_level, monthly_income, 
    per_capita_income, benefit_type, status, last_delivery_date, last_delivery_days_ago, 
    pastoral_notes, dependents_notes
) VALUES 
(
    'FAM-001', 'Maria das Graças Silva', '123.456.789-00', '160.29384.11-2', '24.891.023-4', 
    '1982-04-15', '(11) 98765-4321', 'Mulher Cis', 'Rua das Flores, 142 - Fundos', 'Jardim Esperança', 
    'Cedida / Aluguel Social', 'R$ 450,00', 'Próximo à padaria do Seu Manoel', 'critica', 'R$ 600,00', 
    'R$ 150,00', 'Bolsa Família', 'em_acompanhamento', '02/10/2026', 29, 
    'Mãe solo, necessita de apoio urgente com itens de higiene e leite.', '3 filhos em idade escolar.'
),
(
    'FAM-002', 'José Antônio Pereira', '234.567.890-11', '161.44291.55-9', '19.442.810-9', 
    '1975-09-22', '(11) 97123-8899', 'Homem Cis', 'Av. Central, 850', 'Vila Nova', 
    'Própria (inacabada)', 'R$ 0,00', 'Ao lado da igreja evangélica', 'alta', 'R$ 850,00', 
    'R$ 283,00', 'BPC / LOAS', 'em_acompanhamento', '15/10/2026', 16, 
    'Trabalhador autônomo em recuperação de acidente.', 'Esposa e 1 filho pequeno.'
),
(
    'FAM-003', 'Francisca de Oliveira Santos', '345.678.901-22', '162.77190.22-3', '31.209.551-2', 
    '1960-12-05', '(11) 99812-3456', 'Mulher Cis', 'Travessa dos Pinheiros, 12', 'Morro do Céu', 
    'Cedida', 'R$ 0,00', 'Subida da caixa d''água', 'critica', 'R$ 400,00', 
    'R$ 200,00', 'Sem benefício', 'em_acompanhamento', '28/08/2026', 64, 
    'Idosa cuidando de neto órfão. Necessita de visita pastoral periódica para suporte espiritual e médico.', 'Neto de 11 anos estuda na rede pública.'
),
(
    'FAM-004', 'Regina Célia Duarte', '456.789.012-33', '163.88291.44-0', '28.112.903-8', 
    '1988-06-18', '(11) 96543-2109', 'Mulher Cis', 'Rua São Paulo, 304', 'Vila Industrial', 
    'Alugada', 'R$ 800,00', 'Em frente à praça da biblioteca', 'estavel', 'R$ 2.400,00', 
    'R$ 800,00', 'Emprego formal', 'promovida', '10/05/2026', 174, 
    'Conseguiu colocação profissional após capacitação na pastoral e alcançou autonomia alimentar. Mantida para histórico estatístico.', 'Família de 3 membros.'
),
(
    'FAM-005', 'Carlos Eduardo Mendes', '567.890.123-44', '164.99120.77-1', '33.401.882-6', 
    '1991-02-14', '(11) 95432-1098', 'Homem Cis', 'Alameda das Acácias, 77', 'Parque das Palmeiras', 
    'Desconhecida', 'R$ 0,00', 'Antigo ponto final do ônibus', 'estavel', 'R$ 0,00', 
    'R$ 0,00', 'Nenhum', 'inativa', '14/03/2026', 231, 
    'Mudou-se de município no início do ano. Cadastro inativado permanecendo apenas para arquivo de prestação de contas.', 'Sem contato atual.'
)
ON CONFLICT (id) DO NOTHING;

-- Dependentes iniciais
INSERT INTO dependents (family_id, name, relationship, age, tag, notes) VALUES
    ('FAM-001', 'Lucas da Silva (10 anos)', 'Filho', 10, 'Escolar', 'Necessita de material didático'),
    ('FAM-001', 'Kauã da Silva (7 anos)', 'Filho', 7, 'Escolar', 'Acompanhamento nutricional infantil'),
    ('FAM-001', 'Sophia da Silva (3 anos)', 'Filha', 3, 'Primeira Infância', 'Leite em pó e fraldas'),
    ('FAM-002', 'Marcos Pereira (5 anos)', 'Filho', 5, 'Primeira Infância', 'Fraldas e apoio escolar'),
    ('FAM-003', 'Gabriel Santos (11 anos)', 'Neto', 11, 'Escolar', 'Órfão de mãe, auxílio escolar')
ON CONFLICT DO NOTHING;

-- Visitas periódicas registradas
INSERT INTO periodic_visits (family_id, family_name, date, volunteer_name, summary, demand_type, priority_level) VALUES
    ('FAM-001', 'Maria das Graças Silva', '24/10/2026', 'Anderson', 'Visita domiciliar de rotina. Constatada melhora no abastecimento de água, mas família precisa de cobertores e leite.', 'Suporte Material e Leite', 'alta'),
    ('FAM-003', 'Francisca de Oliveira Santos', '20/10/2026', 'Claudilene', 'Visita pastoral acolhedora. Dona Francisca relatou dificuldades para locomoção ao posto de saúde.', 'Apoio Saúde / Agendamento', 'urgente'),
    ('FAM-002', 'José Antônio Pereira', '12/10/2026', 'Claudilene', 'Acompanhamento pós-cirúrgico do chefe da família. Recuperação favorável.', 'Acompanhamento Social', 'media')
ON CONFLICT DO NOTHING;

-- Entregas históricas
INSERT INTO delivery_records (family_id, family_name, timestamp, basket_type, volunteer_name, parish_unit, status, pastoral_visit_requested, observation, protocol_number) VALUES
    ('FAM-001', 'Maria das Graças Silva', '02/10/2026 09:14', 'Padrão 22kg', 'Claudilene', 'Matriz Santíssimo Redentor', 'concluida', true, 'Entregue com pacote extra de leite integral', 'PROT-2026-1001'),
    ('FAM-002', 'José Antônio Pereira', '15/10/2026 10:45', 'Padrão 22kg', 'Anderson', 'Matriz Santíssimo Redentor', 'concluida', false, 'Retirado pelo próprio beneficiário com termo assinado', 'PROT-2026-1002'),
    ('FAM-003', 'Francisca de Oliveira Santos', '28/08/2026 14:30', 'Padrão 22kg + Kit Higiene', 'Anderson', 'Matriz Santíssimo Redentor', 'concluida', true, 'Entrega realizada no domicílio durante visita', 'PROT-2026-0815')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- Configuração de Row Level Security (RLS) para Supabase
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodic_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastoral_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público/anônimo para leitura e operação pastoral
CREATE POLICY "Leitura pública de famílias" ON families FOR SELECT USING (true);
CREATE POLICY "Inserção e atualização de famílias" ON families FOR ALL USING (true);

CREATE POLICY "Leitura pública de dependentes" ON dependents FOR SELECT USING (true);
CREATE POLICY "Gestão de dependentes" ON dependents FOR ALL USING (true);

CREATE POLICY "Leitura e registro de entregas" ON delivery_records FOR ALL USING (true);

CREATE POLICY "Leitura e registro de visitas" ON periodic_visits FOR ALL USING (true);

CREATE POLICY "Leitura e edição de usuários" ON users FOR ALL USING (true);

CREATE POLICY "Leitura e gestão de parâmetros pastorais" ON pastoral_settings FOR ALL USING (true);
