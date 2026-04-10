-- ============================================================
-- MIGRATION: Adicionar campos completos à tabela veiculos
-- Conforme escopo FleetFlow_Gestao_Frotas_Escopo_v1 §6.1
-- ============================================================

-- Novos campos obrigatórios pelo escopo
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS marca        TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS ano_modelo    INTEGER;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS combustivel   TEXT CHECK (combustivel IN ('Gasolina','Etanol','Flex','Diesel','Elétrico','Híbrido'));
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS cor           TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS renavam       TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS chassi        TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS filial        TEXT;
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS device_id     TEXT;  -- GPS futuro (D-05)
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ;  -- Soft delete (D-03)

-- Atualizar CHECK de status para incluir Ativo/Inativo conforme escopo §4.1
-- (mantém compatibilidade com dados existentes)
ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_status_check;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_status_check
  CHECK (status IN ('Ativo','Inativo','Em Manutenção','Em Rota','Disponível','Sinistrado'));

-- Tabela de documentos por veículo (§8.1)
CREATE TABLE IF NOT EXISTS public.veiculo_documentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veiculo_id    UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('CRLV','Seguro','Licenciamento')),
  numero        TEXT,
  data_vencimento DATE,
  observacao    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(veiculo_id, tipo)
);

ALTER TABLE public.veiculo_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "veiculo_docs_select" ON public.veiculo_documentos
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "veiculo_docs_insert" ON public.veiculo_documentos
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "veiculo_docs_update" ON public.veiculo_documentos
  FOR UPDATE USING (tenant_id = public.get_tenant_id());

-- Seed documentos para veículos existentes (sem data = badge Alerta)
INSERT INTO public.veiculo_documentos (veiculo_id, tenant_id, tipo)
SELECT v.id, v.tenant_id, t.tipo
FROM public.veiculos v
CROSS JOIN (VALUES ('CRLV'), ('Seguro'), ('Licenciamento')) AS t(tipo)
WHERE v.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (veiculo_id, tipo) DO NOTHING;
