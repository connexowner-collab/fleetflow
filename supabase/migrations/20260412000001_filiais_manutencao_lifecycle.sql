-- ===================================================
-- FASE 1: Tabela de Filiais
-- ===================================================
CREATE TABLE IF NOT EXISTS filiais (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID        NOT NULL,
  nome        TEXT        NOT NULL,
  cidade      TEXT,
  estado      CHAR(2),
  endereco    TEXT,
  telefone    TEXT,
  ativa       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_filiais_tenant ON filiais(tenant_id);

ALTER TABLE filiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "filiais_service_only" ON filiais;
CREATE POLICY "filiais_service_only" ON filiais FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Adicionar filial_id em profiles (FK opcional para migração suave)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);

-- Adicionar filial_id em veiculos (FK opcional)
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS filial_id UUID REFERENCES filiais(id);

-- ===================================================
-- FASE 2: Ciclo de vida de Manutenções
-- ===================================================

-- Expandir CHECK de status para suportar ciclo completo
ALTER TABLE manutencoes DROP CONSTRAINT IF EXISTS manutencoes_status_check;
ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_status_check
  CHECK (status IN (
    'agendada', 'em_andamento',
    'aguardando_atendimento', 'aguardando_manutencao', 'em_manutencao',
    'concluida', 'cancelada', 'recusado', 'manutencao_reprovada'
  ));

-- Campos extras para o ciclo de vida
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS urgencia TEXT CHECK (urgencia IN ('muito_alta','alta','media','baixa')) DEFAULT 'media';
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS endereco_oficina TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS telefone_oficina TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS data_entrada_oficina TIMESTAMPTZ;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS data_saida_oficina   TIMESTAMPTZ;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS motivo_reprovacao TEXT;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS sla_prazo TIMESTAMPTZ;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS ator_email TEXT;

-- Tabela: histórico de status (timeline)
CREATE TABLE IF NOT EXISTS manutencao_historico (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  manutencao_id   UUID        NOT NULL REFERENCES manutencoes(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo     TEXT        NOT NULL,
  ator_email      TEXT        NOT NULL,
  ator_perfil     TEXT,
  observacao      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manut_hist_manutencao ON manutencao_historico(manutencao_id);

ALTER TABLE manutencao_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manut_hist_service_only" ON manutencao_historico;
CREATE POLICY "manut_hist_service_only" ON manutencao_historico FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ===================================================
-- FASE 3: Checklist — suporte a PDF e ID sequencial
-- ===================================================
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS codigo_sequencial TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMPTZ;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS email_envio TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS assinatura_base64 TEXT;

-- Sequence para CHK-NNNNN
CREATE SEQUENCE IF NOT EXISTS checklists_codigo_seq START 1;
