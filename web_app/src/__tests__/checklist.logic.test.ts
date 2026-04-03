/**
 * Testes unitários: Lógica de Checklists
 */

type ChecklistItem = { label: string; ok: boolean };
type Inspection = {
  id: number;
  motorista: string;
  placa: string;
  status: 'Aprovado' | 'Em Revisão' | 'Avaria Grave';
  items: ChecklistItem[];
  conformidade: number;
};

function calcularConformidade(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const ok = items.filter((i) => i.ok).length;
  return Math.round((ok / items.length) * 100);
}

function aprovarChecklist(inspection: Inspection): Inspection | { error: string } {
  if (inspection.status === 'Aprovado') return { error: 'Checklist já aprovado.' };
  return { ...inspection, status: 'Aprovado' };
}

function recusarChecklist(inspection: Inspection): Inspection | { error: string } {
  if (inspection.status === 'Avaria Grave') return { error: 'Checklist já recusado.' };
  return { ...inspection, status: 'Avaria Grave' };
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    'Aprovado': 'Liberado',
    'Em Revisão': 'Em Revisão',
    'Avaria Grave': 'Risco',
  };
  return map[status] ?? status;
}

describe('Checklist - Cálculo de conformidade', () => {
  it('deve calcular 100% quando todos os itens estão ok', () => {
    const items: ChecklistItem[] = [
      { label: 'Óleo', ok: true },
      { label: 'Pneus', ok: true },
      { label: 'Freios', ok: true },
    ];
    expect(calcularConformidade(items)).toBe(100);
  });

  it('deve calcular 0% quando nenhum item está ok', () => {
    const items: ChecklistItem[] = [
      { label: 'Óleo', ok: false },
      { label: 'Pneus', ok: false },
    ];
    expect(calcularConformidade(items)).toBe(0);
  });

  it('deve calcular 50% para metade dos itens ok', () => {
    const items: ChecklistItem[] = [
      { label: 'Óleo', ok: true },
      { label: 'Pneus', ok: false },
    ];
    expect(calcularConformidade(items)).toBe(50);
  });

  it('deve retornar 0 para lista vazia', () => {
    expect(calcularConformidade([])).toBe(0);
  });

  it('deve arredondar corretamente (66.67% → 67%)', () => {
    const items: ChecklistItem[] = [
      { label: 'A', ok: true },
      { label: 'B', ok: true },
      { label: 'C', ok: false },
    ];
    expect(calcularConformidade(items)).toBe(67);
  });
});

describe('Checklist - Aprovação e recusa', () => {
  const baseInspection: Inspection = {
    id: 1,
    motorista: 'Carlos Silva',
    placa: 'ABC-1234',
    status: 'Em Revisão',
    conformidade: 80,
    items: [{ label: 'Óleo', ok: true }, { label: 'Pneus', ok: false }],
  };

  it('deve aprovar checklist em revisão', () => {
    const result = aprovarChecklist(baseInspection);
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.status).toBe('Aprovado');
  });

  it('não deve aprovar checklist já aprovado', () => {
    const result = aprovarChecklist({ ...baseInspection, status: 'Aprovado' });
    expect('error' in result).toBe(true);
  });

  it('deve recusar checklist em revisão', () => {
    const result = recusarChecklist(baseInspection);
    expect('error' in result).toBe(false);
    if (!('error' in result)) expect(result.status).toBe('Avaria Grave');
  });

  it('não deve recusar checklist já recusado', () => {
    const result = recusarChecklist({ ...baseInspection, status: 'Avaria Grave' });
    expect('error' in result).toBe(true);
  });
});

describe('Checklist - Mapeamento de status', () => {
  it('deve mapear Aprovado → Liberado', () => {
    expect(getStatusBadge('Aprovado')).toBe('Liberado');
  });

  it('deve mapear Em Revisão → Em Revisão', () => {
    expect(getStatusBadge('Em Revisão')).toBe('Em Revisão');
  });

  it('deve mapear Avaria Grave → Risco', () => {
    expect(getStatusBadge('Avaria Grave')).toBe('Risco');
  });

  it('deve retornar o próprio valor para status desconhecido', () => {
    expect(getStatusBadge('Desconhecido')).toBe('Desconhecido');
  });
});
