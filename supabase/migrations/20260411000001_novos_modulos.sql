-- ============================================================
-- FLEETFLOW — Novos Módulos: Manutenção, Combustível,
-- Rastreamento, Notificações
-- ============================================================

-- ── Tabela: manutencoes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manutencoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  veiculo_id      UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  veiculo_placa   TEXT NOT NULL,
  veiculo_modelo  TEXT,
  tipo            TEXT NOT NULL DEFAULT 'preventiva'
                  CHECK (tipo IN ('preventiva','corretiva','revisao')),
  descricao       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'agendada'
                  CHECK (status IN ('agendada','em_andamento','concluida','cancelada')),
  data_agendada   DATE,
  data_realizada  DATE,
  km_agendamento  INTEGER,
  km_realizado    INTEGER,
  custo           NUMERIC(10,2),
  responsavel     TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS manutencoes_tenant_idx ON public.manutencoes(tenant_id);
CREATE INDEX IF NOT EXISTS manutencoes_veiculo_idx ON public.manutencoes(veiculo_id);
CREATE INDEX IF NOT EXISTS manutencoes_status_idx ON public.manutencoes(status);

-- ── Tabela: abastecimentos ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abastecimentos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  veiculo_id       UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  veiculo_placa    TEXT NOT NULL,
  veiculo_modelo   TEXT,
  motorista_nome   TEXT,
  data             DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_combustivel TEXT NOT NULL DEFAULT 'diesel'
                   CHECK (tipo_combustivel IN ('diesel','gasolina','etanol','gnv','eletrico')),
  litros           NUMERIC(8,2) NOT NULL,
  valor_litro      NUMERIC(8,3) NOT NULL,
  valor_total      NUMERIC(10,2) GENERATED ALWAYS AS (litros * valor_litro) STORED,
  km_atual         INTEGER NOT NULL,
  km_anterior      INTEGER DEFAULT 0,
  posto            TEXT,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS abastecimentos_tenant_idx ON public.abastecimentos(tenant_id);
CREATE INDEX IF NOT EXISTS abastecimentos_veiculo_idx ON public.abastecimentos(veiculo_id);
CREATE INDEX IF NOT EXISTS abastecimentos_data_idx ON public.abastecimentos(data DESC);

-- ── Tabela: rastreamento ──────────────────────────────────
-- Uma linha por veículo, updated in-place
CREATE TABLE IF NOT EXISTS public.rastreamento (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  veiculo_id          UUID UNIQUE REFERENCES public.veiculos(id) ON DELETE CASCADE,
  veiculo_placa       TEXT NOT NULL,
  lat                 NUMERIC(10,7),
  lng                 NUMERIC(10,7),
  velocidade          INTEGER DEFAULT 0,
  ignicao             BOOLEAN DEFAULT FALSE,
  odometro            INTEGER DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'offline'
                      CHECK (status IN ('online','parado','offline')),
  ultima_atualizacao  TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rastreamento_tenant_idx ON public.rastreamento(tenant_id);

-- ── Tabela: notificacoes ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  destinatario      TEXT NOT NULL DEFAULT 'all', -- email ou 'all'
  tipo              TEXT NOT NULL DEFAULT 'sistema'
                    CHECK (tipo IN (
                      'documento_vencimento','manutencao_agendada',
                      'ocorrencia_grave','checklist_pendente','sistema'
                    )),
  prioridade        TEXT NOT NULL DEFAULT 'media'
                    CHECK (prioridade IN ('alta','media','baixa')),
  titulo            TEXT NOT NULL,
  mensagem          TEXT NOT NULL,
  lida              BOOLEAN DEFAULT FALSE,
  referencia_id     UUID,
  referencia_tipo   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notificacoes_tenant_idx ON public.notificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS notificacoes_lida_idx ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS notificacoes_created_idx ON public.notificacoes(created_at DESC);

-- ── RLS Policies ─────────────────────────────────────────
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- (Admin client bypasses RLS via service role, so policies are for anon/user clients)
CREATE POLICY "tenant_manutencoes" ON public.manutencoes
  FOR ALL USING (TRUE);

CREATE POLICY "tenant_abastecimentos" ON public.abastecimentos
  FOR ALL USING (TRUE);

CREATE POLICY "tenant_rastreamento" ON public.rastreamento
  FOR ALL USING (TRUE);

CREATE POLICY "tenant_notificacoes" ON public.notificacoes
  FOR ALL USING (TRUE);

-- ── Seed: notificações iniciais demo ─────────────────────
DO $$
DECLARE v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (tenant_id, tipo, prioridade, titulo, mensagem)
    VALUES
      (v_tenant_id, 'sistema', 'alta', 'Bem-vindo ao FleetFlow!', 'Central de notificações ativa. Configure alertas de vencimento nos módulos Documentos e Manutenção.'),
      (v_tenant_id, 'documento_vencimento', 'alta', 'CRLV vence em 15 dias', 'O veículo ABC-1234 tem o CRLV vencendo em 26/04/2026. Providencie a renovação.'),
      (v_tenant_id, 'manutencao_agendada', 'media', 'Revisão preventiva agendada', 'Revisão dos 50.000 km do veículo XYZ-5678 está agendada para 20/04/2026.');
  END IF;
END $$;
