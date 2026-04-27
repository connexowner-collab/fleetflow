-- Push subscriptions para Web Push Notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON push_subscriptions(tenant_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_service" ON push_subscriptions FOR ALL USING (TRUE);

-- Solicitações de checklist feitas pelo gestor (D-08)
CREATE TABLE IF NOT EXISTS checklist_solicitacoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  motorista_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  solicitante_id  UUID REFERENCES profiles(id),
  solicitante_nome TEXT,
  placa           TEXT,
  mensagem        TEXT,
  atendido_em     TIMESTAMPTZ,
  cancelado_em    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_sol_motorista ON checklist_solicitacoes(motorista_id);
CREATE INDEX IF NOT EXISTS idx_checklist_sol_tenant ON checklist_solicitacoes(tenant_id);

ALTER TABLE checklist_solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_sol_service" ON checklist_solicitacoes FOR ALL USING (TRUE);

-- Coluna pdf_url na tabela checklists (se ainda não existir)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='checklists' AND column_name='pdf_url'
  ) THEN
    ALTER TABLE checklists ADD COLUMN pdf_url TEXT;
  END IF;
END $$;
