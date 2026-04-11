-- config_opcoes: campos configuráveis dos dropdowns do checklist e demais módulos
CREATE TABLE IF NOT EXISTS public.config_opcoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  categoria  TEXT NOT NULL CHECK (categoria IN ('unidade', 'setor', 'area', 'item_inspecao')),
  valor      TEXT NOT NULL,
  ativo      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, categoria, valor)
);

ALTER TABLE public.config_opcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_opcoes_select" ON public.config_opcoes
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "config_opcoes_insert" ON public.config_opcoes
  FOR INSERT WITH CHECK (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor', 'diretor')
  );

CREATE POLICY "config_opcoes_update" ON public.config_opcoes
  FOR UPDATE USING (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor', 'diretor')
  );

CREATE POLICY "config_opcoes_delete" ON public.config_opcoes
  FOR DELETE USING (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor', 'diretor')
  );

-- Seed: itens de inspeção padrão para o tenant demo
INSERT INTO public.config_opcoes (tenant_id, categoria, valor) VALUES
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Nível do Óleo do Motor'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Estado e Calibragem dos Pneus'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Luzes de Alerta e Freio'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Sistema de Frenagem'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Extintor de Incêndio'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Triângulo de Sinalização'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Macaco e Chave de Roda'),
  ('00000000-0000-0000-0000-000000000001', 'item_inspecao', 'Limpeza Interna'),
  ('00000000-0000-0000-0000-000000000001', 'unidade', 'Matriz - São Paulo'),
  ('00000000-0000-0000-0000-000000000001', 'unidade', 'Filial - Campinas'),
  ('00000000-0000-0000-0000-000000000001', 'setor', 'Logística'),
  ('00000000-0000-0000-0000-000000000001', 'setor', 'Distribuição'),
  ('00000000-0000-0000-0000-000000000001', 'area', 'Longa Distância'),
  ('00000000-0000-0000-0000-000000000001', 'area', 'Urbano')
ON CONFLICT DO NOTHING;
