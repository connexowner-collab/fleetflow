/**
 * Testes unitários: Lógica de Ocorrências
 */

type Occurrence = {
  id: number;
  placa: string;
  motorista: string;
  gravidade: 'Grave' | 'Média' | 'Leve';
  status: 'Aberta' | 'Em Tratativa' | 'Concluída';
  descricao: string;
  local: string;
  data: string;
};

// Transições de status
function encaminharParaOficina(occ: Occurrence): Occurrence | { error: string } {
  if (occ.status !== 'Aberta') return { error: 'Apenas ocorrências abertas podem ser encaminhadas.' };
  return { ...occ, status: 'Em Tratativa' };
}

function resolverOcorrencia(occ: Occurrence): Occurrence | { error: string } {
  if (occ.status === 'Concluída') return { error: 'Ocorrência já está concluída.' };
  return { ...occ, status: 'Concluída' };
}

// Estatísticas
function calcularEstatisticas(occurrences: Occurrence[]) {
  return {
    graves: occurrences.filter((o) => o.gravidade === 'Grave' && o.status !== 'Concluída').length,
    abertas: occurrences.filter((o) => o.status === 'Aberta').length,
    concluidas: occurrences.filter((o) => o.status === 'Concluída').length,
    total: occurrences.length,
  };
}

const sampleOccurrences: Occurrence[] = [
  { id: 1, placa: 'ABC-1234', motorista: 'Carlos Silva', gravidade: 'Grave', status: 'Aberta', descricao: 'Acidente em rodovia', local: 'BR-101', data: '2026-04-01' },
  { id: 2, placa: 'XYZ-9876', motorista: 'Roberto Alves', gravidade: 'Média', status: 'Em Tratativa', descricao: 'Pneu furado', local: 'SP-280', data: '2026-04-02' },
  { id: 3, placa: 'DEF-5555', motorista: 'Ana Souza', gravidade: 'Leve', status: 'Concluída', descricao: 'Arranhão', local: 'Pátio', data: '2026-03-28' },
];

describe('Ocorrências - Transições de status', () => {
  it('deve encaminhar ocorrência aberta para oficina', () => {
    const result = encaminharParaOficina(sampleOccurrences[0]);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.status).toBe('Em Tratativa');
    }
  });

  it('não deve encaminhar ocorrência já em tratativa', () => {
    const result = encaminharParaOficina(sampleOccurrences[1]);
    expect('error' in result).toBe(true);
  });

  it('não deve encaminhar ocorrência já concluída', () => {
    const result = encaminharParaOficina(sampleOccurrences[2]);
    expect('error' in result).toBe(true);
  });

  it('deve resolver ocorrência em tratativa', () => {
    const result = resolverOcorrencia(sampleOccurrences[1]);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.status).toBe('Concluída');
    }
  });

  it('deve resolver ocorrência aberta', () => {
    const result = resolverOcorrencia(sampleOccurrences[0]);
    if (!('error' in result)) {
      expect(result.status).toBe('Concluída');
    }
  });

  it('não deve resolver ocorrência já concluída', () => {
    const result = resolverOcorrencia(sampleOccurrences[2]);
    expect('error' in result).toBe(true);
  });
});

describe('Ocorrências - Estatísticas', () => {
  it('deve contar ocorrências graves não concluídas', () => {
    const stats = calcularEstatisticas(sampleOccurrences);
    expect(stats.graves).toBe(1);
  });

  it('deve contar ocorrências abertas', () => {
    const stats = calcularEstatisticas(sampleOccurrences);
    expect(stats.abertas).toBe(1);
  });

  it('deve contar ocorrências concluídas', () => {
    const stats = calcularEstatisticas(sampleOccurrences);
    expect(stats.concluidas).toBe(1);
  });

  it('deve contar total correto', () => {
    const stats = calcularEstatisticas(sampleOccurrences);
    expect(stats.total).toBe(3);
  });

  it('deve retornar zeros para lista vazia', () => {
    const stats = calcularEstatisticas([]);
    expect(stats.graves).toBe(0);
    expect(stats.abertas).toBe(0);
    expect(stats.concluidas).toBe(0);
    expect(stats.total).toBe(0);
  });
});
