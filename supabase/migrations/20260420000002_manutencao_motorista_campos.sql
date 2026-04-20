-- Adicionar colunas do motorista na tabela manutencoes (para solicitações via PWA)
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS motorista_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS motorista_nome TEXT;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS km_atual INTEGER;
ALTER TABLE public.manutencoes ADD COLUMN IF NOT EXISTS observacao_operador TEXT;

-- Garantir índice para busca por motorista
CREATE INDEX IF NOT EXISTS manutencoes_motorista_idx ON public.manutencoes(motorista_id);

-- Atualizar constraint de status para incluir status em português (inseridos pelo PWA)
ALTER TABLE public.manutencoes DROP CONSTRAINT IF EXISTS manutencoes_status_check;
ALTER TABLE public.manutencoes ADD CONSTRAINT manutencoes_status_check
  CHECK (status IN (
    'agendada', 'em_andamento',
    'aguardando_atendimento', 'aguardando_manutencao', 'em_manutencao',
    'concluida', 'cancelada', 'recusado', 'manutencao_reprovada',
    'Aguardando Atendimento', 'Aguardando Manutenção', 'Em Manutenção',
    'Concluída', 'Cancelada', 'Recusada'
  ));
