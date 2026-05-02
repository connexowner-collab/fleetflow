-- =====================================================================
-- Adiciona campos para fluxo de recusa de checklist:
--   motivo_recusa: motivo informado pelo gestor ao recusar
--   recusa_lida:   flag para o motorista confirmar que leu a recusa
-- =====================================================================

ALTER TABLE public.checklists
  ADD COLUMN IF NOT EXISTS motivo_recusa TEXT,
  ADD COLUMN IF NOT EXISTS recusa_lida   BOOLEAN NOT NULL DEFAULT FALSE;
