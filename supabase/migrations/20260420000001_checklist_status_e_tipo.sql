-- Adicionar coluna tipo_checklist (Pré-operação / Pós-operação)
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS tipo_checklist TEXT DEFAULT 'Pré-operação';

-- Atualizar CHECK constraint de status para incluir novos valores do escopo
ALTER TABLE public.checklists DROP CONSTRAINT IF EXISTS checklists_status_check;
ALTER TABLE public.checklists ADD CONSTRAINT checklists_status_check
  CHECK (status IN ('Pendente','Aprovado','Recusado','Avaria Grave','Com Pendências','Validado','Cancelado'));

-- Garantir coluna cpf_motorista para a assinatura
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS cpf_motorista TEXT;

-- Garantir coluna para tipo de checklist (compatibilidade)
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS tipo TEXT;
