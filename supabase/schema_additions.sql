-- Adicionar colunas na tabela checklists
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS itens_json JSONB DEFAULT '{}';
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS motorista TEXT;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS motorista_nome_display TEXT;

-- Criar tabela config_opcoes (dropdowns configuráveis)
CREATE TABLE IF NOT EXISTS public.config_opcoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('unidade','setor','area')),
  valor TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, categoria, valor)
);

ALTER TABLE public.config_opcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_select" ON public.config_opcoes
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "config_insert" ON public.config_opcoes
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "config_update" ON public.config_opcoes
  FOR UPDATE USING (tenant_id = public.get_tenant_id());

CREATE POLICY "config_delete" ON public.config_opcoes
  FOR DELETE USING (
    tenant_id = public.get_tenant_id()
    AND public.get_user_perfil() IN ('gestor','diretor','analista')
  );

-- Dados iniciais para o tenant demo
INSERT INTO public.config_opcoes (tenant_id, categoria, valor) VALUES
  ('00000000-0000-0000-0000-000000000001','unidade','Filial São Paulo'),
  ('00000000-0000-0000-0000-000000000001','unidade','Filial Campinas'),
  ('00000000-0000-0000-0000-000000000001','unidade','Filial Ribeirão Preto'),
  ('00000000-0000-0000-0000-000000000001','unidade','Filial Guarulhos'),
  ('00000000-0000-0000-0000-000000000001','setor','Comercial'),
  ('00000000-0000-0000-0000-000000000001','setor','Operacional'),
  ('00000000-0000-0000-0000-000000000001','setor','Logística'),
  ('00000000-0000-0000-0000-000000000001','area','Zona Norte'),
  ('00000000-0000-0000-0000-000000000001','area','Zona Sul'),
  ('00000000-0000-0000-0000-000000000001','area','Zona Leste'),
  ('00000000-0000-0000-0000-000000000001','area','Zona Oeste'),
  ('00000000-0000-0000-0000-000000000001','area','Grande SP')
ON CONFLICT DO NOTHING;
