-- ============================================================
-- FLEETFLOW - Schema Completo Supabase
-- ============================================================

-- ── Extensões ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabela: tenants (empresas) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,          -- ex: "transportadora-abc"
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  email       TEXT,
  logo_url    TEXT,
  cor_primaria TEXT DEFAULT '#0056B3',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: profiles (extensão de auth.users) ─────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  perfil      TEXT NOT NULL CHECK (perfil IN ('motorista','gestor','analista','diretor')),
  placa_vinculada TEXT,                       -- placa do veículo vinculado ao motorista
  ativo       BOOLEAN DEFAULT TRUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: veiculos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.veiculos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  placa       TEXT NOT NULL,
  modelo      TEXT NOT NULL,
  tipo        TEXT DEFAULT 'Caminhão',
  capacidade  TEXT,
  km_atual    INTEGER DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'Disponível'
              CHECK (status IN ('Em Rota','Disponível','Em Manutenção','Sinistrado')),
  motorista_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, placa)
);

-- ── Tabela: checklists ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checklists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL,               -- ex: CK-1052
  motorista_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  motorista_nome  TEXT NOT NULL,
  veiculo_id      UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  placa           TEXT NOT NULL,
  veiculo_nome    TEXT,
  unidade         TEXT,
  setor           TEXT,
  area            TEXT,
  km_anterior     INTEGER DEFAULT 0,
  km_atual        INTEGER DEFAULT 0,
  observacao      TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Pendente'
                  CHECK (status IN ('Pendente','Aprovado','Recusado','Avaria Grave')),
  tem_avaria      BOOLEAN DEFAULT FALSE,
  solicita_troca  BOOLEAN DEFAULT FALSE,
  assinado_em     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: checklist_itens ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.checklist_itens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id  UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  conforme      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Tabela: checklist_fotos ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.checklist_fotos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id  UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('frente','traseira','extra')),
  url           TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: ocorrencias ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL,               -- ex: OCC-9922
  checklist_id    UUID REFERENCES public.checklists(id) ON DELETE SET NULL,
  motorista_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  motorista_nome  TEXT NOT NULL,
  veiculo_id      UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  placa           TEXT NOT NULL,
  veiculo_nome    TEXT,
  categoria       TEXT NOT NULL,               -- Mecânica, Elétrica, Pneu, Acidente, Outros
  gravidade       TEXT NOT NULL CHECK (gravidade IN ('Leve','Média','Grave')),
  descricao       TEXT NOT NULL,
  local           TEXT,
  status          TEXT NOT NULL DEFAULT 'Aberta'
                  CHECK (status IN ('Aberta','Em Tratativa','Concluída')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabela: trocas ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trocas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo              TEXT NOT NULL,            -- ex: TR-503
  checklist_id        UUID REFERENCES public.checklists(id) ON DELETE SET NULL,
  motorista_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  motorista_nome      TEXT NOT NULL,
  veiculo_antigo_id   UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  veiculo_antigo_nome TEXT,
  veiculo_novo_id     UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  veiculo_novo_nome   TEXT,
  motivo              TEXT,
  status              TEXT NOT NULL DEFAULT 'Pendente'
                      CHECK (status IN ('Pendente','Aprovada','Recusada')),
  aprovado_por        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  aprovado_em         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sequências para códigos legíveis ─────────────────────
CREATE SEQUENCE IF NOT EXISTS seq_checklist_codigo START 1052;
CREATE SEQUENCE IF NOT EXISTS seq_ocorrencia_codigo START 9922;
CREATE SEQUENCE IF NOT EXISTS seq_troca_codigo START 503;

-- ── Função: gerar código de checklist ─────────────────────
CREATE OR REPLACE FUNCTION generate_checklist_codigo()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'CK-' || LPAD(nextval('seq_checklist_codigo')::TEXT, 4, '0');
END;
$$;

-- ── Função: gerar código de ocorrência ────────────────────
CREATE OR REPLACE FUNCTION generate_ocorrencia_codigo()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'OCC-' || nextval('seq_ocorrencia_codigo')::TEXT;
END;
$$;

-- ── Função: gerar código de troca ─────────────────────────
CREATE OR REPLACE FUNCTION generate_troca_codigo()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'TR-' || nextval('seq_troca_codigo')::TEXT;
END;
$$;

-- ── Triggers: auto-gerar códigos ──────────────────────────
CREATE OR REPLACE FUNCTION set_checklist_codigo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_checklist_codigo();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_checklist_codigo
  BEFORE INSERT ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION set_checklist_codigo();

CREATE OR REPLACE FUNCTION set_ocorrencia_codigo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_ocorrencia_codigo();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ocorrencia_codigo
  BEFORE INSERT ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION set_ocorrencia_codigo();

CREATE OR REPLACE FUNCTION set_troca_codigo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_troca_codigo();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_troca_codigo
  BEFORE INSERT ON public.trocas
  FOR EACH ROW EXECUTE FUNCTION set_troca_codigo();

-- ── Trigger: criar profile ao registrar usuário ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::UUID, (SELECT id FROM public.tenants LIMIT 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'motorista')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger: atualizar km do veículo ao criar checklist ───
CREATE OR REPLACE FUNCTION update_veiculo_km()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.veiculo_id IS NOT NULL AND NEW.km_atual > 0 THEN
    UPDATE public.veiculos SET km_atual = NEW.km_atual WHERE id = NEW.veiculo_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_veiculo_km
  AFTER INSERT ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION update_veiculo_km();

-- ── Trigger: vincular veículo à troca aprovada ────────────
CREATE OR REPLACE FUNCTION apply_troca_aprovada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'Aprovada' AND OLD.status = 'Pendente' THEN
    -- Desvincula o motorista do veículo antigo
    IF NEW.veiculo_antigo_id IS NOT NULL THEN
      UPDATE public.veiculos SET motorista_id = NULL WHERE id = NEW.veiculo_antigo_id;
    END IF;
    -- Vincula o motorista ao novo veículo e atualiza placa no profile
    IF NEW.veiculo_novo_id IS NOT NULL AND NEW.motorista_id IS NOT NULL THEN
      UPDATE public.veiculos SET motorista_id = NEW.motorista_id WHERE id = NEW.veiculo_novo_id;
      UPDATE public.profiles SET placa_vinculada = (
        SELECT placa FROM public.veiculos WHERE id = NEW.veiculo_novo_id
      ) WHERE id = NEW.motorista_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_apply_troca
  AFTER UPDATE ON public.trocas
  FOR EACH ROW EXECUTE FUNCTION apply_troca_aprovada();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trocas ENABLE ROW LEVEL SECURITY;

-- Função helper: retorna tenant_id do usuário logado (em public, não auth)
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Função helper: retorna perfil do usuário logado (em public, não auth)
CREATE OR REPLACE FUNCTION public.get_user_perfil()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT perfil FROM public.profiles WHERE id = auth.uid()
$$;

-- tenants: apenas admins veem o próprio tenant
CREATE POLICY "tenant_select" ON public.tenants
  FOR SELECT USING (id = public.get_tenant_id());

-- profiles: vê todos do mesmo tenant
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (tenant_id = public.get_tenant_id());

-- veiculos: CRUD restrito ao tenant
CREATE POLICY "veiculos_select" ON public.veiculos
  FOR SELECT USING (tenant_id = public.get_tenant_id());

CREATE POLICY "veiculos_insert" ON public.veiculos
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "veiculos_update" ON public.veiculos
  FOR UPDATE USING (tenant_id = public.get_tenant_id());

CREATE POLICY "veiculos_delete" ON public.veiculos
  FOR DELETE USING (tenant_id = public.get_tenant_id() AND public.get_user_perfil() IN ('gestor','diretor'));

-- checklists: motorista vê os próprios; gestor/analista/diretor vê todos do tenant
CREATE POLICY "checklists_select" ON public.checklists
  FOR SELECT USING (
    tenant_id = public.get_tenant_id() AND (
      public.get_user_perfil() IN ('gestor','analista','diretor')
      OR motorista_id = auth.uid()
    )
  );

CREATE POLICY "checklists_insert" ON public.checklists
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "checklists_update" ON public.checklists
  FOR UPDATE USING (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor','analista','diretor')
  );

-- checklist_itens e fotos: herdam do checklist
CREATE POLICY "ck_itens_select" ON public.checklist_itens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = public.get_tenant_id())
  );

CREATE POLICY "ck_itens_insert" ON public.checklist_itens
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = public.get_tenant_id())
  );

CREATE POLICY "ck_fotos_select" ON public.checklist_fotos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = public.get_tenant_id())
  );

CREATE POLICY "ck_fotos_insert" ON public.checklist_fotos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.checklists c WHERE c.id = checklist_id AND c.tenant_id = public.get_tenant_id())
  );

-- ocorrencias
CREATE POLICY "ocorrencias_select" ON public.ocorrencias
  FOR SELECT USING (
    tenant_id = public.get_tenant_id() AND (
      public.get_user_perfil() IN ('gestor','analista','diretor')
      OR motorista_id = auth.uid()
    )
  );

CREATE POLICY "ocorrencias_insert" ON public.ocorrencias
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "ocorrencias_update" ON public.ocorrencias
  FOR UPDATE USING (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor','analista','diretor')
  );

-- trocas
CREATE POLICY "trocas_select" ON public.trocas
  FOR SELECT USING (
    tenant_id = public.get_tenant_id() AND (
      public.get_user_perfil() IN ('gestor','analista','diretor')
      OR motorista_id = auth.uid()
    )
  );

CREATE POLICY "trocas_insert" ON public.trocas
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "trocas_update" ON public.trocas
  FOR UPDATE USING (
    tenant_id = public.get_tenant_id() AND
    public.get_user_perfil() IN ('gestor','diretor')
  );

-- ============================================================
-- STORAGE: Bucket para fotos dos checklists
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('checklist-fotos', 'checklist-fotos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "fotos_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'checklist-fotos' AND auth.uid() IS NOT NULL);

CREATE POLICY "fotos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'checklist-fotos');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Tenant demo
INSERT INTO public.tenants (id, slug, nome, cnpj, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fleetflow-demo',
  'FleetFlow Transportes Demo',
  '00.000.000/0001-00',
  'admin@fleetflow.com.br'
) ON CONFLICT (slug) DO NOTHING;

-- Veículos demo
INSERT INTO public.veiculos (tenant_id, placa, modelo, tipo, capacidade, km_atual, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ABC-1234', 'Volvo FH 540', 'Caminhão', '30t', 154200, 'Em Rota'),
  ('00000000-0000-0000-0000-000000000001', 'XYZ-9876', 'Scania R450', 'Caminhão', '25t', 98500, 'Disponível'),
  ('00000000-0000-0000-0000-000000000001', 'DEF-5555', 'Mercedes Axor', 'Caminhão', '20t', 210100, 'Em Manutenção'),
  ('00000000-0000-0000-0000-000000000001', 'JKL-9012', 'DAF XF', 'Caminhão', '28t', 67300, 'Disponível'),
  ('00000000-0000-0000-0000-000000000001', 'MNO-3456', 'Iveco Stralis', 'Caminhão', '22t', 143800, 'Em Rota')
ON CONFLICT DO NOTHING;
