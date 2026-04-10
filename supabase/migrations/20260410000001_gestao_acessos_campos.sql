-- G1.1: Adicionar campos em profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telefone     TEXT,
  ADD COLUMN IF NOT EXISTS filial       TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- Garantir que acesso já existe (pode já estar presente)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS acesso TEXT NOT NULL DEFAULT 'app';

-- G6.1: Tabela de log de auditoria (append-only, imutável)
CREATE TABLE IF NOT EXISTS audit_logs (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  tenant_id             UUID,
  ator_id               UUID,
  ator_email            TEXT        NOT NULL,
  ator_perfil           TEXT        NOT NULL,
  acao                  TEXT        NOT NULL,
  usuario_afetado_id    UUID,
  usuario_afetado_email TEXT,
  dados_antes           JSONB,
  dados_depois          JSONB,
  ip                    TEXT,
  ambiente              TEXT        NOT NULL DEFAULT 'web'
);

-- RLS: apenas service_role pode inserir/selecionar. Nenhum perfil pode editar ou excluir.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_service_only" ON audit_logs;
CREATE POLICY "audit_service_only" ON audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
