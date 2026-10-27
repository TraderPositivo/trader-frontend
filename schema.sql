-- ============================================
-- TRADER SYSTEM — schema Neon (PostgreSQL)
-- Rodar no SQL Editor do painel neon.tech
-- ============================================

-- ── USUÁRIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    role        VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
    ativo       SMALLINT DEFAULT 1,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTAS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contas (
    id                    SERIAL PRIMARY KEY,
    usuario_id            INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome                  VARCHAR(50) NOT NULL,
    plataforma            VARCHAR(50) DEFAULT '',
    tipo                  VARCHAR(30) DEFAULT 'CORRETORA',
    saldo_inicial         DECIMAL(10,2) DEFAULT 0.00,
    loss_limit_ciclo      DECIMAL(10,2) DEFAULT 0.00,
    custo_renovacao       DECIMAL(10,2) DEFAULT 0.00,
    meta_mensal           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stop_mensal           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    meta_diaria           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stop_diario           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_operacoes_dia     INT DEFAULT 2,
    janela_tipo           VARCHAR(15) NOT NULL DEFAULT 'manha' CHECK (janela_tipo IN ('manha','tarde','personalizado')),
    janela_inicio         TIME NOT NULL DEFAULT '10:00:00',
    janela_fim            TIME NOT NULL DEFAULT '11:30:00',
    semaforo_ativo        SMALLINT NOT NULL DEFAULT 1,
    operar_ativo          SMALLINT NOT NULL DEFAULT 0,
    risco_por_op          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stop_pts_win          INT NOT NULL DEFAULT 0,
    stop_pts_wdo          INT NOT NULL DEFAULT 0,
    modo_conservador      SMALLINT NOT NULL DEFAULT 0,
    ativa                 SMALLINT DEFAULT 1,
    criada_em             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── OPERAÇÕES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operacoes (
    id              SERIAL PRIMARY KEY,
    conta_id        INT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    data_operacao   DATE NOT NULL,
    tipo            VARCHAR(10) NOT NULL,
    horario_entrada TIME NOT NULL,
    horario_saida   TIME DEFAULT NULL,
    pontos          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    resultado       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    custo           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observacao      TEXT DEFAULT NULL,
    criada_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHECKLIST ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
    id        SERIAL PRIMARY KEY,
    conta_id  INT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    lado      VARCHAR(6) NOT NULL CHECK (lado IN ('COMPRA','VENDA')),
    ordem     INT NOT NULL DEFAULT 0,
    titulo    VARCHAR(100) NOT NULL,
    descricao VARCHAR(200) DEFAULT '',
    tag       VARCHAR(30) DEFAULT '',
    ativo     SMALLINT NOT NULL DEFAULT 1
);

-- ── CICLOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ciclos (
    id           SERIAL PRIMARY KEY,
    conta_id     INT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    data_inicio  DATE NOT NULL,
    data_fim     DATE DEFAULT NULL,
    saldo_inicio DECIMAL(10,2) DEFAULT 0.00,
    criada_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DIAS NÃO OPERADOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dias_nao_operados (
    id         SERIAL PRIMARY KEY,
    conta_id   INT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    data_dia   DATE NOT NULL,
    motivo     VARCHAR(100) NOT NULL,
    observacao TEXT DEFAULT NULL,
    criada_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conta_id, data_dia)
);

-- ── LICENÇAS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licencas (
    id              SERIAL PRIMARY KEY,
    chave           VARCHAR(23) NOT NULL UNIQUE,
    cpf             VARCHAR(11) NOT NULL,
    nome_cliente    VARCHAR(100) NOT NULL DEFAULT '',
    email_cliente   VARCHAR(150) NOT NULL DEFAULT '',
    usuario_id      INT DEFAULT NULL REFERENCES usuarios(id),
    plano           VARCHAR(15) NOT NULL DEFAULT 'mensal' CHECK (plano IN ('mensal','trimestral','anual','vitalicio')),
    duracao_dias    INT NOT NULL DEFAULT 30,
    data_geracao    TIMESTAMPTZ DEFAULT NOW(),
    data_ativacao   TIMESTAMPTZ DEFAULT NULL,
    data_expiracao  TIMESTAMPTZ DEFAULT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','ativa','expirada','revogada')),
    gerado_por      INT NOT NULL,
    obs             TEXT DEFAULT NULL
);

-- ── ADMIN PADRÃO (senha: admin123) ────────────────────────────────
INSERT INTO usuarios (nome, email, senha_hash, role)
VALUES ('Admin', 'admin@trader.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
